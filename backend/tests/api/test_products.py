"""Public product catalogue: list, filters, search, sorting and detail (see docs/api.md)."""

from fastapi.testclient import TestClient


def _ids(response) -> list[int]:
    return [item["id"] for item in response.json()["items"]]


def test_list_returns_only_active_products_with_pagination_fields(
    client: TestClient, make_product
) -> None:
    visible = make_product(name="Visible")
    make_product(name="Hidden", is_active=False)
    response = client.get("/api/products")
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["page"] == 1
    assert body["page_size"] == 20
    assert _ids(response) == [visible["id"]]
    assert set(body["items"][0]) == {
        "id",
        "sku",
        "name",
        "short_description",
        "price",
        "stock",
        "is_new",
        "brand",
        "category",
        "image_url",
    }


def test_list_filters_by_category_brand_and_is_new(
    client: TestClient, make_product, make_category, make_brand
) -> None:
    category = make_category()
    other_category = make_category()
    brand = make_brand()
    match = make_product(category_id=category["id"], brand_id=brand["id"], is_new=True)
    old_in_category = make_product(category_id=category["id"], brand_id=brand["id"], is_new=False)
    other_category_product = make_product(
        category_id=other_category["id"], brand_id=brand["id"], is_new=True
    )
    new_without_brand = make_product(category_id=category["id"], is_new=True)

    def ids(**params) -> set[int]:
        return set(_ids(client.get("/api/products", params=params)))

    in_category = {match["id"], old_in_category["id"], new_without_brand["id"]}
    with_brand = {match["id"], old_in_category["id"], other_category_product["id"]}
    assert ids(category_id=category["id"]) == in_category
    assert ids(brand_id=brand["id"]) == with_brand
    assert ids(category_id=category["id"], brand_id=brand["id"]) == {
        match["id"],
        old_in_category["id"],
    }
    assert ids(category_id=category["id"], brand_id=brand["id"], is_new="true") == {match["id"]}
    assert ids(category_id=category["id"], is_new="false") == {old_in_category["id"]}


def test_list_q_matches_name_and_sku_case_insensitively(client: TestClient, make_product) -> None:
    by_name = make_product(name="Solar Lamp", sku="LMP-1")
    by_sku = make_product(name="Cable", sku="SOLAR-9")
    make_product(name="Kettle", sku="KTL-2")
    assert set(_ids(client.get("/api/products", params={"q": "solar"}))) == {
        by_name["id"],
        by_sku["id"],
    }
    assert _ids(client.get("/api/products", params={"q": "lmp-1"})) == [by_name["id"]]
    # LIKE wildcards in the search text are literal characters, not patterns.
    assert _ids(client.get("/api/products", params={"q": "%"})) == []


def test_list_sort_price_asc_and_desc(client: TestClient, make_product) -> None:
    cheap = make_product(price="10.00")
    middle = make_product(price="50.00")
    dear = make_product(price="99.99")
    assert _ids(client.get("/api/products", params={"sort": "price_asc"})) == [
        cheap["id"],
        middle["id"],
        dear["id"],
    ]
    assert _ids(client.get("/api/products", params={"sort": "price_desc"})) == [
        dear["id"],
        middle["id"],
        cheap["id"],
    ]
    # The default sort is newest first.
    assert _ids(client.get("/api/products")) == [dear["id"], middle["id"], cheap["id"]]


def test_list_survives_hostile_query_input(client: TestClient, make_product, conn) -> None:
    make_product()
    response = client.get("/api/products", params={"q": "'; DROP TABLE products;--"})
    assert response.status_code == 200
    assert response.json()["items"] == []
    assert response.json()["total"] == 0
    assert client.get("/api/products", params={"sort": "bogus"}).status_code == 422
    assert client.get("/api/products", params={"page": 0}).status_code == 422
    assert client.get("/api/products", params={"page_size": 10000}).status_code == 422
    assert conn.execute("SELECT count(*) AS n FROM products").fetchone()["n"] == 1


def test_detail_404_for_inactive_and_missing(client: TestClient, make_product) -> None:
    visible = make_product()
    hidden = make_product(is_active=False)
    assert client.get(f"/api/products/{visible['id']}").status_code == 200
    for product_id in (hidden["id"], 999999):
        response = client.get(f"/api/products/{product_id}")
        assert response.status_code == 404
        assert response.json() == {"detail": "not_found"}


def test_detail_has_images_in_order_and_placeholder_fallback(
    client: TestClient, make_product, make_image
) -> None:
    product = make_product()
    bare = make_product()
    make_image(product["id"], file_name="second.jpg", position=1)
    make_image(product["id"], file_name="first.png", position=0)

    body = client.get(f"/api/products/{product['id']}").json()
    assert [(image["position"], image["url"]) for image in body["images"]] == [
        (0, "/api/media/first.png"),
        (1, "/api/media/second.jpg"),
    ]
    assert body["image_url"] == "/api/media/first.png"

    bare_body = client.get(f"/api/products/{bare['id']}").json()
    assert bare_body["images"] == []
    assert bare_body["image_url"] == "/api/media/placeholder.svg"


def test_list_and_detail_use_the_card_copy_and_fall_back_to_the_full_file(
    client: TestClient, make_product, make_image
) -> None:
    resized = make_product()
    legacy = make_product()  # uploaded before resizing existed, so it has no thumb_name
    make_image(resized["id"], file_name="new.webp", thumb_name="new-sm.webp", position=0)
    make_image(legacy["id"], file_name="old.png", position=0)

    items = {item["id"]: item for item in client.get("/api/products").json()["items"]}
    assert items[resized["id"]]["image_url"] == "/api/media/new-sm.webp"
    assert items[legacy["id"]]["image_url"] == "/api/media/old.png"

    [image] = client.get(f"/api/products/{resized['id']}").json()["images"]
    assert (image["url"], image["thumb_url"]) == ("/api/media/new.webp", "/api/media/new-sm.webp")
    [legacy_image] = client.get(f"/api/products/{legacy['id']}").json()["images"]
    assert (legacy_image["url"], legacy_image["thumb_url"]) == (
        "/api/media/old.png",
        "/api/media/old.png",
    )


def test_public_json_never_contains_cost_price_or_is_active(
    client: TestClient, make_product
) -> None:
    product = make_product(cost_price="60.00")
    listing = client.get("/api/products")
    detail = client.get(f"/api/products/{product['id']}")
    assert listing.status_code == 200
    assert detail.status_code == 200
    assert "cost_price" not in listing.text
    assert "is_active" not in listing.text
    assert "cost_price" not in detail.text
    assert "is_active" not in detail.text


def test_unicode_name_round_trips(client: TestClient, make_product) -> None:
    name = "Çelik Şarj İstasyonu 🚀"
    product = make_product(name=name)
    assert client.get("/api/products").json()["items"][0]["name"] == name
    assert client.get(f"/api/products/{product['id']}").json()["name"] == name
