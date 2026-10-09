"""Product images: upload checks, resizing to WebP, generated names, order and deletion."""

import base64
import io
import re
import struct
import zlib
from pathlib import Path
from types import SimpleNamespace

import psycopg
import pytest
from fastapi.testclient import TestClient
from PIL import Image

from app.repositories import products
from app.services import images

# A 1x1 PNG image, a real file that decodes. The magic bytes alone would also pass the check.
PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5E"
    "rkJggg=="
)
GENERATED_NAME = re.compile(r"[0-9a-f]{32}\.webp")
GENERATED_THUMB_NAME = re.compile(r"[0-9a-f]{32}-sm\.webp")


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


def _stored_thumb_name(response) -> str:
    return response.json()["thumb_url"].removeprefix("/api/media/")


def _files_of(response, settings) -> list[Path]:
    """The full file and the card file of an upload response."""
    return [
        settings.upload_dir / _stored_name(response),
        settings.upload_dir / _stored_thumb_name(response),
    ]


def _size(path: Path) -> tuple[int, int]:
    with Image.open(path) as image:
        return image.size


def _mode(path: Path) -> str:
    with Image.open(path) as image:
        return image.mode


def _is_webp(path: Path) -> bool:
    head = path.read_bytes()[:12]
    return head[:4] == b"RIFF" and head[8:12] == b"WEBP"


def _encoded(image: Image.Image, fmt: str, **options) -> bytes:
    buffer = io.BytesIO()
    image.save(buffer, format=fmt, **options)
    return buffer.getvalue()


def _png_chunk(kind: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data))


def _png_declaring(width: int, height: int) -> bytes:
    """A PNG that declares width x height pixels and carries no pixel data."""
    header = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    return b"\x89PNG\r\n\x1a\n" + _png_chunk(b"IHDR", header) + _png_chunk(b"IEND", b"")


def test_upload_png_is_stored_as_a_full_and_a_card_webp(
    client: TestClient, admin_headers, make_product, make_image, settings
) -> None:
    product = make_product()
    make_image(product["id"], file_name="first.png", position=0)
    response = _upload(client, admin_headers(), product["id"])
    assert response.status_code == 201
    body = response.json()
    assert body["position"] == 1
    file_name = _stored_name(response)
    thumb_name = _stored_thumb_name(response)
    assert GENERATED_NAME.fullmatch(file_name)
    assert GENERATED_THUMB_NAME.fullmatch(thumb_name)
    assert thumb_name == file_name.removesuffix(".webp") + "-sm.webp"
    assert body["url"] == f"/api/media/{file_name}"
    assert body["thumb_url"] == f"/api/media/{thumb_name}"
    assert _is_webp(settings.upload_dir / file_name)
    assert _is_webp(settings.upload_dir / thumb_name)
    assert client.get(body["url"]).status_code == 200
    assert client.get(body["thumb_url"]).status_code == 200


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
    assert GENERATED_NAME.fullmatch(_stored_name(response))
    assert not any(path.name.endswith(".php") for path in settings.upload_dir.iterdir())


def test_a_large_photo_is_scaled_down_for_both_copies(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    product = make_product()
    photo = _encoded(Image.new("RGB", (6000, 4000), (200, 120, 40)), "JPEG", quality=90)
    response = _upload(
        client,
        admin_headers(),
        product["id"],
        name="phone.jpg",
        content=photo,
        content_type="image/jpeg",
    )
    assert response.status_code == 201
    full, card = _files_of(response, settings)
    assert _size(full) == (1600, 1067)
    assert _size(card) == (480, 320)


def test_a_one_pixel_png_is_not_enlarged(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    product = make_product()
    response = _upload(client, admin_headers(), product["id"])
    assert response.status_code == 201
    assert [_size(path) for path in _files_of(response, settings)] == [(1, 1), (1, 1)]


def test_an_exif_rotated_photo_is_stored_upright(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    exif = Image.Exif()
    exif[0x0112] = 6  # orientation 6: the 200 x 100 picture is turned by a quarter turn
    photo = _encoded(Image.new("RGB", (200, 100), (200, 120, 40)), "JPEG", exif=exif)
    product = make_product()
    response = _upload(
        client,
        admin_headers(),
        product["id"],
        name="turned.jpg",
        content=photo,
        content_type="image/jpeg",
    )
    assert response.status_code == 201
    assert [_size(path) for path in _files_of(response, settings)] == [(100, 200), (100, 200)]


def test_other_colour_modes_are_stored_as_rgb_and_transparency_is_kept(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    product = make_product()
    headers = admin_headers()
    cases = {
        "grey.png": (_encoded(Image.new("L", (8, 8), 128), "PNG"), "RGB"),
        "print.jpg": (_encoded(Image.new("CMYK", (8, 8), (0, 50, 100, 0)), "JPEG"), "RGB"),
        "clear.png": (_encoded(Image.new("RGBA", (8, 8), (255, 0, 0, 0)), "PNG"), "RGBA"),
    }
    for name, (content, mode) in cases.items():
        response = _upload(client, headers, product["id"], name=name, content=content)
        assert response.status_code == 201, name
        full, card = _files_of(response, settings)
        assert _mode(full) == mode, name
        assert _mode(card) == mode, name


def test_a_png_with_garbage_after_its_magic_bytes_gives_415(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    product = make_product()
    files_before = set(settings.upload_dir.iterdir())
    response = _upload(
        client,
        admin_headers(),
        product["id"],
        name="broken.png",
        content=b"\x89PNG\r\n\x1a\n" + b"not image data " * 50,
    )
    assert response.status_code == 415
    assert response.json() == {"detail": "unsupported_media_type"}
    assert set(settings.upload_dir.iterdir()) == files_before


@pytest.mark.parametrize(
    "size", [(50_000, 50_000), (7_000, 7_000)], ids=["50000x50000", "7000x7000"]
)
def test_a_png_declaring_more_than_40_million_pixels_gives_415(
    client: TestClient, admin_headers, make_product, settings, size: tuple[int, int]
) -> None:
    product = make_product()
    files_before = set(settings.upload_dir.iterdir())
    response = _upload(
        client, admin_headers(), product["id"], name="huge.png", content=_png_declaring(*size)
    )
    assert response.status_code == 415
    assert response.json() == {"detail": "unsupported_media_type"}
    assert set(settings.upload_dir.iterdir()) == files_before


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


def test_delete_image_removes_row_and_both_files(
    client: TestClient, admin_headers, make_product, conn, settings
) -> None:
    headers = admin_headers()
    product = make_product()
    other = make_product()
    uploaded = _upload(client, headers, product["id"])
    image_id = uploaded.json()["id"]
    files = _files_of(uploaded, settings)
    assert all(file.exists() for file in files)

    wrong_product = client.delete(
        f"/api/admin/products/{other['id']}/images/{image_id}", headers=headers
    )
    assert wrong_product.status_code == 404
    assert all(file.exists() for file in files)

    path = f"/api/admin/products/{product['id']}/images/{image_id}"
    assert client.delete(path, headers=headers).status_code == 204
    assert not any(file.exists() for file in files)
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


def test_deleting_a_product_removes_both_files_of_each_image(
    client: TestClient, admin_headers, make_product, settings
) -> None:
    headers = admin_headers()
    webp_before = set(settings.upload_dir.glob("*.webp"))
    product = make_product()
    uploaded = _upload(client, headers, product["id"])
    files = _files_of(uploaded, settings)
    assert all(file.exists() for file in files)
    assert client.delete(f"/api/admin/products/{product['id']}", headers=headers).status_code == 204
    assert not any(file.exists() for file in files)
    assert set(settings.upload_dir.glob("*.webp")) == webp_before


def test_upload_whose_product_vanishes_leaves_no_file(
    client: TestClient, admin_headers, make_product, settings, monkeypatch
) -> None:
    # The product is deleted after the existence check, so the insert finds no product.
    product = make_product()
    files_before = set(settings.upload_dir.iterdir())
    monkeypatch.setattr(products, "add_image", lambda conn, product_id, file_name, thumb_name: None)
    response = _upload(client, admin_headers(), product["id"])
    assert response.status_code == 404
    assert response.json() == {"detail": "not_found"}
    assert set(settings.upload_dir.iterdir()) == files_before


def test_a_failed_insert_leaves_no_file(
    client: TestClient, admin_headers, make_product, settings, monkeypatch
) -> None:
    product = make_product()
    files_before = set(settings.upload_dir.iterdir())

    def lost_connection(conn, product_id, file_name, thumb_name):
        raise psycopg.OperationalError("connection lost")

    monkeypatch.setattr(products, "add_image", lost_connection)
    with pytest.raises(psycopg.OperationalError):
        _upload(client, admin_headers(), product["id"])
    assert set(settings.upload_dir.iterdir()) == files_before


def test_the_cart_line_shows_the_card_copy(
    client: TestClient, admin_headers, make_user, make_product, auth_headers
) -> None:
    product = make_product(stock=5)
    uploaded = _upload(client, admin_headers(), product["id"])
    added = client.post(
        "/api/cart/items",
        json={"product_id": product["id"], "quantity": 1},
        headers=auth_headers(make_user()),
    )
    assert added.status_code == 200
    assert [item["image_url"] for item in added.json()["items"]] == [uploaded.json()["thumb_url"]]


def test_a_failed_second_write_removes_the_first_file(tmp_path: Path, monkeypatch) -> None:
    token = "ab" * 16
    monkeypatch.setattr(images, "uuid", SimpleNamespace(uuid4=lambda: SimpleNamespace(hex=token)))
    (tmp_path / f"{token}-sm.webp").mkdir()  # a directory in the way makes the second write fail
    with pytest.raises(OSError):
        images.store_image(tmp_path, b"full", b"card")
    assert not (tmp_path / f"{token}.webp").exists()


def test_only_jpeg_png_and_webp_are_decoded() -> None:
    buffer = io.BytesIO()
    Image.new("RGB", (4, 4)).save(buffer, format="GIF")
    with pytest.raises(images.InvalidImage):
        images.process_image(buffer.getvalue())


def test_upload_checks_the_product_without_the_admin_query(
    client: TestClient, admin_headers, make_product, monkeypatch
) -> None:
    product = make_product()

    def not_called(*args: object) -> None:
        raise AssertionError("an existence check needs no admin columns")

    monkeypatch.setattr(products, "get_admin", not_called)
    assert _upload(client, admin_headers(), product["id"]).status_code == 201
