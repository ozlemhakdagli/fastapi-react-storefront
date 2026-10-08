"""Product images: upload checks by magic bytes and size, generated names, order and deletion."""

import base64
import re

from fastapi.testclient import TestClient

from app.repositories import products

# A 1x1 PNG image. The upload code checks only its magic bytes; the rest makes it a real image.
PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5E"
    "rkJggg=="
)
GENERATED_PNG_NAME = re.compile(r"[0-9a-f]{32}\.png")


def _upload(
    client: TestClient,
    headers: dict[str, str],
    product_id: int,
    *,
    name: str = "photo.png",
    content: bytes = PNG_1X1,
    content_type: str = "image/png",
):
    return client.post(
        f"/api/admin/products/{product_id}/images",
        headers=headers,
        files={"file": (name, content, content_type)},
    )


def _stored_name(response) -> str:
    return response.json()["url"].removeprefix("/api/media/")


def test_upload_png_appends_image(
    client: TestClient, admin_headers, make_product, make_image, settings
) -> None:
    product = make_product()
    make_image(product["id"], file_name="first.png", position=0)
    response = _upload(client, admin_headers(), product["id"])
    assert response.status_code == 201
    body = response.json()
    assert body["position"] == 1
    file_name = _stored_name(response)
    assert GENERATED_PNG_NAME.fullmatch(file_name)
    assert body["url"] == f"/api/media/{file_name}"
    assert (settings.upload_dir / file_name).read_bytes() == PNG_1X1
    assert client.get(body["url"]).status_code == 200


def test_upload_to_missing_product_gives_404(client: TestClient, admin_headers) -> None:
    response = _upload(client, admin_headers(), 999999)
    assert response.status_code == 404
    assert response.json() == {"detail": "not_found"}


def test_upload_rejects_fake_png(client: TestClient, admin_headers, make_product) -> None:
    product = make_product()
    response = _upload(
        client,
        admin_headers(),
        product["id"],
        name="evil.png",
        content=b"<script>alert(1)</script>",
        content_type="image/png",
    )
    assert response.status_code == 415
    assert response.json() == {"detail": "unsupported_media_type"}


def test_upload_rejects_empty_and_oversize(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    product = make_product()
    headers = admin_headers()
    empty = _upload(client, headers, product["id"], content=b"")
    assert empty.status_code == 415
    assert empty.json() == {"detail": "unsupported_media_type"}

    limit = settings.max_upload_bytes
    too_big_content = PNG_1X1 + bytes(limit - len(PNG_1X1) + 1)
    too_big = _upload(client, headers, product["id"], content=too_big_content)
    assert too_big.status_code == 413
    assert too_big.json() == {"detail": "file_too_large"}

    exactly_the_limit = PNG_1X1 + bytes(limit - len(PNG_1X1))
    assert _upload(client, headers, product["id"], content=exactly_the_limit).status_code == 201


def test_upload_ignores_client_filename_and_content_type(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    product = make_product()
    response = _upload(
        client,
        admin_headers(),
        product["id"],
        name="../../x.php",
        content=PNG_1X1,
        content_type="text/plain",
    )
    assert response.status_code == 201
    assert GENERATED_PNG_NAME.fullmatch(_stored_name(response))
    assert not any(path.name.endswith(".php") for path in settings.upload_dir.iterdir())


def test_reorder_images(client: TestClient, admin_headers, make_product, make_image) -> None:
    headers = admin_headers()
    product = make_product()
    first = make_image(product["id"], file_name="a.png", position=0)
    second = make_image(product["id"], file_name="b.png", position=1)
    third = make_image(product["id"], file_name="c.png", position=2)
    path = f"/api/admin/products/{product['id']}/images/order"
    new_order = [third["id"], first["id"], second["id"]]

    response = client.put(path, headers=headers, json={"image_ids": new_order})
    assert response.status_code == 200
    assert [image["id"] for image in response.json()["images"]] == new_order
    assert response.json()["image_url"] == "/api/media/c.png"
    public = client.get(f"/api/products/{product['id']}").json()
    assert [image["id"] for image in public["images"]] == new_order

    for bad_ids in (
        [first["id"], second["id"]],  # one image missing
        [first["id"], first["id"], second["id"]],  # one image twice
        [*new_order, make_image(make_product()["id"], file_name="z.png")["id"]],  # foreign image
    ):
        response = client.put(path, headers=headers, json={"image_ids": bad_ids})
        assert response.status_code == 422, bad_ids
        assert response.json() == {"detail": "invalid_reference", "field": "image_ids"}
    still = client.get(f"/api/products/{product['id']}").json()
    assert [image["id"] for image in still["images"]] == new_order

    missing = client.put(
        "/api/admin/products/999999/images/order", headers=headers, json={"image_ids": []}
    )
    assert missing.status_code == 404


def test_delete_image_removes_row_and_file(
    client: TestClient, admin_headers, make_product, conn, settings
) -> None:
    headers = admin_headers()
    product = make_product()
    other = make_product()
    uploaded = _upload(client, headers, product["id"])
    image_id = uploaded.json()["id"]
    file_path = settings.upload_dir / _stored_name(uploaded)
    assert file_path.exists()

    wrong_product = client.delete(
        f"/api/admin/products/{other['id']}/images/{image_id}", headers=headers
    )
    assert wrong_product.status_code == 404
    assert file_path.exists()

    path = f"/api/admin/products/{product['id']}/images/{image_id}"
    assert client.delete(path, headers=headers).status_code == 204
    assert not file_path.exists()
    remaining = conn.execute(
        "SELECT count(*) AS n FROM product_images WHERE id = %s", (image_id,)
    ).fetchone()["n"]
    assert remaining == 0
    assert client.delete(path, headers=headers).status_code == 404


def test_placeholder_file_is_never_deleted(
    client: TestClient, admin_headers, make_product, make_image, settings
) -> None:
    product = make_product()
    image = make_image(product["id"])  # the file name defaults to placeholder.svg
    path = f"/api/admin/products/{product['id']}/images/{image['id']}"
    assert client.delete(path, headers=admin_headers()).status_code == 204
    assert (settings.upload_dir / "placeholder.svg").exists()


def test_deleting_a_product_removes_its_image_files(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    headers = admin_headers()
    product = make_product()
    uploaded = _upload(client, headers, product["id"])
    file_path = settings.upload_dir / _stored_name(uploaded)
    assert file_path.exists()
    assert client.delete(f"/api/admin/products/{product['id']}", headers=headers).status_code == 204
    assert not file_path.exists()


def test_upload_whose_product_vanishes_leaves_no_file(
    client: TestClient, admin_headers, make_product, settings, monkeypatch
) -> None:
    # The product is deleted after the existence check, so the insert finds no product.
    product = make_product()
    files_before = set(settings.upload_dir.iterdir())
    monkeypatch.setattr(products, "add_image", lambda conn, product_id, file_name: None)
    response = _upload(client, admin_headers(), product["id"])
    assert response.status_code == 404
    assert response.json() == {"detail": "not_found"}
    assert set(settings.upload_dir.iterdir()) == files_before
