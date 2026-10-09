# API reference

This page describes the HTTP API of the backend in `backend/app`. The interactive documentation at
`/api/docs` lists the same routes with their schemas. If this page and the running API disagree, the
running API is the reference.

Contents: 1. Overview · 2. Conventions · 3. Error codes · 4. Endpoints · 5. Data shapes ·
6. Orders and the status machine · 7. Database · 8. Adding a feature

## 1. Overview

**Base path and format.** Every endpoint lives under `/api`. Requests and responses are JSON in
UTF-8. Uploaded product images are served from `/api/media/<file_name>`.

**Interactive documentation.** Swagger UI is at `/api/docs` and the OpenAPI document is at
`/api/openapi.json`. The README explains how to switch both off for a public deployment.

**Health check.** `GET /api/health` answers `{"status": "ok", "db": true}` when the database responds.

**Authentication.** A client logs in with `POST /api/auth/login` and receives an `access_token`. It
sends the token in the `Authorization` header of every later call that needs a login:

```bash
curl -s -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "ayse@example.com", "password": "your-password"}'

curl -s http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer <access_token>"
```

- The token is an HS256 JWT with the claims `sub` (the user id as a string), `iat` and `exp`. Its
  lifetime is `ACCESS_TOKEN_MINUTES`, 60 by default; the setting accepts 1 to 1440.
- On every request the server decodes the token and loads the user from the database. The role comes
  from that row, never from the token. A user who is missing or inactive gets `401 unauthorized` at
  once, and an admin whose role was changed gets `403 forbidden` on the next admin call.
- A password change does not end existing sessions. An old token works until it expires. This is a
  known limitation, described in the README.
- The frontend keeps the token in `localStorage` under the key `ecommerce.token`.

**Who may call an endpoint.** The endpoint tables use four labels:

| Label | Meaning |
|---|---|
| public | No token is needed. |
| login | Any active user with a valid token. |
| optional | Works without a token. A valid token is recorded; a missing or invalid token makes the caller a guest. |
| admin | An active user whose role is `admin`. |

Routes marked login or admin answer `401 unauthorized` without a valid token. Admin routes answer
`403 forbidden` to a logged-in customer.

## 2. Conventions

### Names, IDs and timestamps

- Field names are `snake_case`. IDs are integers.
- Timestamps are ISO 8601 strings in UTC, for example `"2026-10-08T12:00:00Z"`. A value that has
  fractional seconds keeps them, for example `"2026-10-08T12:00:00.123456Z"`.

### Money

- Money is a string with exactly two decimals in every response, for example `"1299.90"`. Requests
  accept such a string or a JSON number with at most two decimals.
- A product's `price` and `cost_price` must be from `0` to `1000000.00`.
- The currency is TRY. The frontend formats the amounts.

### Pagination

- List endpoints accept `page` (1 to 100000, default 1) and `page_size` (1 to 100, default 20).
- The response has this shape:

```json
{"items": [], "total": 42, "page": 1, "page_size": 20}
```

- `total` counts every matching row, not only the rows on the current page.
- Lists are newest first, except the category and brand lists (sorted by name) and the product list
  (sorted by `sort`, see section 4.3).

### Errors

- Our errors have the body `{"detail": "<code>"}`. Some add a field: `product_id` for stock problems
  in the cart and at checkout, and `field` for `invalid_reference`. Section 3 lists every code.
- Input that fails validation answers `422` with FastAPI's list of problems. Each entry has `type`,
  `loc` and `msg`. The submitted value is not echoed back:

```json
{"detail": [{"type": "string_too_short", "loc": ["body", "password"], "msg": "String should have at least 8 characters"}]}
```

- An unknown path answers `404 {"detail": "not_found"}`. Other framework errors, such as
  `405 Method Not Allowed`, keep FastAPI's text in `detail`.

### Request size

- A POST, PUT or PATCH body larger than 256 KB is refused with `413 payload_too_large`. The check runs
  before authentication, so an anonymous client gets the same answer.
- The image upload route (`POST /api/admin/products/{product_id}/images`) accepts bodies up to
  2 065 536 bytes: the 2 000 000-byte image limit plus 64 KB for the multipart envelope. An image
  larger than 2 000 000 bytes gets `413 file_too_large`.
- GET, HEAD, OPTIONS and DELETE requests are not checked against these limits.

### E-mail addresses

- Addresses are trimmed and lowercased before they are stored or compared, and lookups ignore case.
  `Ayse@Example.com` and `ayse@example.com` are the same account.
- Login applies the same trimming and lowercasing but does not check the format. A malformed address
  gets `401 invalid_credentials`, not a validation error.

### Deletion and references

- A category, brand or product that other rows still reference cannot be deleted: `409 has_dependencies`.
  The database enforces these references with `ON DELETE RESTRICT`, which raises
  `psycopg.errors.RestrictViolation` (SQLSTATE 23001). The API checks first and also catches that error,
  so a race gives the same 409 instead of a 500.
- A product that appears in any order cannot be deleted. Deactivate it with `"is_active": false` instead.
- Deleting a product also deletes its image rows and files, its comments and its cart lines
  (`ON DELETE CASCADE`).
- Orders and user accounts are never deleted through the API. An order ends as `completed`, `rejected`
  or `cancelled`, and a user is deactivated with `is_active: false`. Admins can delete messages and
  comments.

## 3. Error codes

| Code | HTTP | Extra fields | When |
|---|---|---|---|
| `unauthorized` | 401 | | The token is missing, malformed or expired, or the user does not exist or is inactive. |
| `invalid_credentials` | 401 | | Login failed. An unknown e-mail, a wrong password and an inactive account get the same answer. |
| `forbidden` | 403 | | The caller is logged in but is not an admin. |
| `not_found` | 404 | | The resource does not exist, is an inactive product (where inactive products are hidden), or belongs to another user. |
| `email_taken` | 409 | | The e-mail address is already registered. |
| `sku_taken` | 409 | | Another product already has this SKU. |
| `name_taken` | 409 | | Another category or brand already has this name. |
| `has_dependencies` | 409 | | The delete is blocked by rows that reference the item. |
| `last_admin` | 409 | | The change would leave no active admin. |
| `insufficient_stock` | 409 | `product_id` | Not enough stock for the quantity. In the cart the limit is `min(stock, 99)` per line. |
| `product_unavailable` | 409 | `product_id` | At checkout, a cart line's product has been deactivated. |
| `product_changed` | 409 | | `PUT /api/admin/products/{product_id}` sent an `expected_updated_at` that no longer matches, because the product changed (a sale, a cancellation, another admin) after the form was loaded. |
| `invalid_status_transition` | 409 | | The order status change is not allowed (section 6). |
| `empty_cart` | 400 | | Checkout with an empty cart. |
| `wrong_password` | 400 | | The current password given to change the password is wrong. |
| `invalid_reference` | 422 | `field` | A referenced row does not exist (`brand_id`, `category_id`, `user_id`), or the `image_ids` list does not match the product's images exactly. |
| `validation_error` | 422 | | The database refused a value that passed the schema: a NUL character, a lone surrogate or an out-of-range number. The body is `{"detail": "validation_error"}`. FastAPI's own validation failures are different (section 2). |
| `payload_too_large` | 413 | | A request body is over 256 KB, or over the upload limit on the image route. |
| `file_too_large` | 413 | | An uploaded image is over 2 000 000 bytes. |
| `unsupported_media_type` | 415 | | The uploaded file is not a JPEG, PNG or WebP image. The type is read from the first bytes. |

The frontend adds two codes of its own for failures that have no API answer: `network` (the server
cannot be reached) and `unknown` (any other unexpected answer).

## 4. Endpoints

Each table gives the method, the path, who may call it, the input (`?` marks an optional field), the
success answer and the codes that are specific to that route. The general codes of section 2 (401, 403
and 422) are not repeated in each row.

### 4.1 Health

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/health` | public | none | 200 `{"status": "ok", "db": true}` | 503 `{"status": "error", "db": false}` when no pooled connection is free within 2 seconds, or `SELECT 1` fails. This body has no `detail`. |

### 4.2 Auth and profile

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/auth/register` | public | Body: `email`, `password` (8 to 128 characters), `full_name` (1 to 100, trimmed), `phone?` (max 30), `address?` (max 500). | 201 `User`, always with role `customer` | 409 `email_taken` |
| POST | `/api/auth/login` | public | Body: `email`, `password` (1 to 128 characters) | 200 `TokenOut` | 401 `invalid_credentials` |
| GET | `/api/auth/me` | login | none | 200 `User` | |
| PATCH | `/api/auth/me` | login | Body: `full_name?` (cannot be null), `phone?`, `address?` (null clears them). `role`, `email` and `is_active` are refused with 422. | 200 `User` | |
| POST | `/api/auth/change-password` | login | Body: `current_password` (1 to 128 characters), `new_password` (8 to 128 characters) | 204 | 400 `wrong_password` |

### 4.3 Catalogue

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/categories` | public | none | 200 `Taxonomy[]`, sorted by name | |
| GET | `/api/brands` | public | none | 200 `Taxonomy[]`, sorted by name | |
| GET | `/api/site` | public | none | 200 `SiteSettings`. The first call creates the settings row, with empty values. | |
| GET | `/api/products` | public | Query: `page`, `page_size`, `category_id?`, `brand_id?`, `is_new?` (true or false), `q?` (matches the name or the SKU, ignoring case), `sort?` (`newest` by default, `price_asc` or `price_desc`). Only active products are listed. | 200 `Page<ProductListItem>` | 422 for an unknown `sort` |
| GET | `/api/products/{product_id}` | public | none | 200 `ProductDetail`, images in position order | 404 `not_found` (also for an inactive product) |

### 4.4 Comments

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/products/{product_id}/comments` | public | Query: `page`, `page_size` | 200 `Page<Comment>`, newest first | 404 `not_found` (missing or inactive product) |
| POST | `/api/products/{product_id}/comments` | login | Body: `body` (1 to 2000 characters, trimmed) | 201 `Comment` | 404 `not_found` (missing or inactive product) |
| DELETE | `/api/comments/{comment_id}` | login | none. Allowed for the author and for admins. | 204 | 404 `not_found` (missing, or another user's comment and the caller is not an admin) |
| GET | `/api/me/comments` | login | Query: `page`, `page_size` | 200 `Page<MyComment>`, newest first | |

### 4.5 Cart

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/cart` | login | none | 200 `Cart`. Lines are in product id order. A line whose product is inactive stays listed with `available: false`, and the total still includes it. | |
| POST | `/api/cart/items` | login | Body: `product_id`, `quantity` (1 to 99). The quantity is added to the quantity already in the cart. | 200 `Cart` | 404 `not_found` (missing or inactive product); 409 `insufficient_stock` when the new line quantity is more than `min(stock, 99)` |
| PUT | `/api/cart/items/{product_id}` | login | Body: `quantity` (1 to 99). Sets the quantity and creates the line if it does not exist. | 200 `Cart` | 404 `not_found`; 409 `insufficient_stock` (same rule) |
| DELETE | `/api/cart/items/{product_id}` | login | none. Idempotent: a missing line is not an error. | 200 `Cart` | |

### 4.6 Orders (customer)

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/orders` | login | Body: `ship_name` (1 to 100), `ship_phone` (1 to 30), `ship_address` (1 to 500), all trimmed. A `total` or `items` field is refused with 422: prices and totals always come from the database. | 201 `Order`, status `new` | 400 `empty_cart`; 409 `insufficient_stock` or `product_unavailable` (both with `product_id`). The whole checkout is rolled back. |
| GET | `/api/orders` | login | Query: `page`, `page_size` | 200 `Page<OrderListItem>`, newest first | |
| GET | `/api/orders/{order_id}` | login | none | 200 `Order` | 404 `not_found` (also for another customer's order) |
| POST | `/api/orders/{order_id}/cancel` | login | none | 200 `Order`, status `cancelled`, stock returned | 404 `not_found`; 409 `invalid_status_transition` for any status other than `new`, including an order that is already cancelled |

### 4.7 Contact and messages

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| POST | `/api/contact` | optional | Body: `name` (1 to 100), `email`, `phone?` (max 30), `subject` (1 to 200), `body` (1 to 5000), all trimmed. The message is stored as inbound with status `new`. Its `user_id` is set when a valid token is sent. | 201 `{"id": 12}` | |
| GET | `/api/me/messages` | login | Query: `page`, `page_size` | 200 `Page<Message>`, newest first, for the messages whose `user_id` is the caller | |

### 4.8 Admin products and images

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/products` | admin | Query: `page`, `page_size`, `q?` (name or SKU), `category_id?`, `brand_id?`, `is_active?`. Inactive products are included. | 200 `Page<AdminProduct>`, newest first | |
| POST | `/api/admin/products` | admin | Body: `ProductIn` (below). `expected_updated_at` is read by PUT only; POST ignores it. | 201 `AdminProduct` | 409 `sku_taken`; 422 `invalid_reference` (`field` is `brand_id` or `category_id`) |
| GET | `/api/admin/products/{product_id}` | admin | none | 200 `AdminProduct` | 404 `not_found` |
| PUT | `/api/admin/products/{product_id}` | admin | Body: `ProductIn`, which replaces every field. Optional `expected_updated_at`: the `updated_at` the form was loaded with. If it no longer matches, nothing is saved. Without it, the save is unconditional. | 200 `AdminProduct` | 404 `not_found`; 409 `sku_taken`; 409 `product_changed`; 422 `invalid_reference` |
| DELETE | `/api/admin/products/{product_id}` | admin | none | 204 | 404 `not_found`; 409 `has_dependencies` when the product appears in an order |
| POST | `/api/admin/products/{product_id}/images` | admin | Multipart form with one field, `file`: a JPEG, PNG or WebP image of at most 2 000 000 bytes. The type is read from the first bytes. The client's file name and content type are ignored, and the file is stored under a generated name. | 201 `ProductImageOut`, added after the last image | 404 `not_found`; 413 `file_too_large`; 413 `payload_too_large`; 415 `unsupported_media_type` |
| PUT | `/api/admin/products/{product_id}/images/order` | admin | Body: `image_ids`, which must list every image id of the product exactly once, in the new order | 200 `AdminProduct` | 404 `not_found`; 422 `invalid_reference` (`field` is `image_ids`) |
| DELETE | `/api/admin/products/{product_id}/images/{image_id}` | admin | none. The file is deleted too, except `placeholder.svg`. | 204 | 404 `not_found` (the image does not belong to this product) |

`ProductIn` (the request body of POST and PUT):

| Field | Rule |
|---|---|
| `sku` | 1 to 64 characters: letters, digits, `.`, `_` and `-` |
| `name` | 1 to 200 characters, trimmed |
| `brand_id?`, `category_id?` | an existing id, or `null` |
| `short_description` | up to 500 characters; default empty |
| `description` | up to 5000 characters of plain text; default empty |
| `price`, `cost_price?` | money from `0` to `1000000.00` |
| `stock` | integer from 0 to 1000000 |
| `is_new` | default `false` |
| `is_active` | default `true` |
| `expected_updated_at?` | PUT only, see the PUT row above |

Any other field is refused with 422.

### 4.9 Admin categories and brands

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/categories` | admin | none | 200 `Taxonomy[]`, sorted by name | |
| POST | `/api/admin/categories` | admin | Body: `name` (1 to 100, trimmed), `description?` (up to 2000; default empty) | 201 `Taxonomy` | 409 `name_taken` |
| PUT | `/api/admin/categories/{item_id}` | admin | Body: `name`, `description?`. Both fields are replaced; a missing description becomes empty. | 200 `Taxonomy` | 404 `not_found`; 409 `name_taken` |
| DELETE | `/api/admin/categories/{item_id}` | admin | none | 204 | 404 `not_found`; 409 `has_dependencies` when a product uses the category |
| GET | `/api/admin/brands` | admin | none | 200 `Taxonomy[]`, sorted by name | |
| POST | `/api/admin/brands` | admin | Body: `name` (1 to 100, trimmed), `description?` (up to 2000; default empty) | 201 `Taxonomy` | 409 `name_taken` |
| PUT | `/api/admin/brands/{item_id}` | admin | Body: `name`, `description?`, replaced as for categories | 200 `Taxonomy` | 404 `not_found`; 409 `name_taken` |
| DELETE | `/api/admin/brands/{item_id}` | admin | none | 204 | 404 `not_found`; 409 `has_dependencies` when a product uses the brand |

### 4.10 Admin orders

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/orders` | admin | Query: `status?` (one of the six statuses), `page`, `page_size` | 200 `Page<AdminOrderListItem>`, newest first | |
| GET | `/api/admin/orders/{order_id}` | admin | none | 200 `AdminOrder` | 404 `not_found` |
| PATCH | `/api/admin/orders/{order_id}` | admin | Body: `status?` (cannot be null), `cargo_company?` (up to 100), `tracking_no?` (up to 100), `admin_note?` (up to 2000). A null clears a text field. The status rules are in section 6. | 200 `AdminOrder` | 404 `not_found`; 409 `invalid_status_transition`, in which case nothing is saved, including the text fields |

### 4.11 Admin users

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/users` | admin | Query: `role?` (`customer` or `admin`), `q?` (matches the e-mail or the name, ignoring case), `page`, `page_size` | 200 `Page<User>`, newest first | |
| POST | `/api/admin/users` | admin | Body: `email`, `password` (8 to 128 characters), `full_name`, `role` (required), `phone?`, `address?` | 201 `User` | 409 `email_taken` |
| PATCH | `/api/admin/users/{user_id}` | admin | Body: `full_name?`, `phone?`, `address?`, `role?`, `is_active?`, `password?` (8 to 128 characters). `full_name`, `role`, `is_active` and `password` cannot be null. | 200 `User` | 404 `not_found`; 409 `last_admin`, when the change would deactivate or demote the only active admin |

### 4.12 Admin messages

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/messages` | admin | Query: `status?` (`new` or `read`), `direction?` (`inbound` or `outbound`), `page`, `page_size` | 200 `Page<AdminMessage>`, newest first | |
| POST | `/api/admin/messages` | admin | Body: `user_id`, `subject` (1 to 200), `body` (1 to 5000). Creates an outbound message stored as `read`, with the user's name and e-mail copied from the account. | 201 `AdminMessage` | 422 `invalid_reference` (`field` is `user_id`) |
| GET | `/api/admin/messages/{message_id}` | admin | none. Reading has no side effects. | 200 `AdminMessage` | 404 `not_found` |
| PATCH | `/api/admin/messages/{message_id}` | admin | Body: `status?` (cannot be null), `admin_note?` (up to 2000) | 200 `AdminMessage` | 404 `not_found` |
| DELETE | `/api/admin/messages/{message_id}` | admin | none | 204 | 404 `not_found` |

### 4.13 Admin comments

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/comments` | admin | Query: `page`, `page_size` | 200 `Page<AdminComment>`, newest first, with the author's e-mail and the product name. To delete one, use `DELETE /api/comments/{comment_id}`. | |

### 4.14 Admin site settings

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/site` | admin | none | 200 `SiteSettings` | |
| PUT | `/api/admin/site` | admin | Body: all ten `SiteSettings` fields (section 5). Every field is replaced. An unknown or missing field is refused with 422. | 200 `SiteSettings` | |

### 4.15 Admin dashboard

| Method | Path | Who | Input | Success | Errors |
|---|---|---|---|---|---|
| GET | `/api/admin/dashboard` | admin | none | 200 `Dashboard` | |

## 5. Data shapes

The examples show the JSON that the API returns. Money is a string, and every timestamp is UTC.

### User

```json
{
  "id": 2,
  "email": "ayse@example.com",
  "full_name": "Ayşe Yılmaz",
  "phone": "05320000000",
  "address": "Moda Cad. 1, Kadıköy, İstanbul",
  "role": "customer",
  "is_active": true,
  "created_at": "2026-10-08T12:00:00Z"
}
```

No response contains a password or a password hash.

### TokenOut

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9.example.signature",
  "token_type": "bearer",
  "user": {
    "id": 2,
    "email": "ayse@example.com",
    "full_name": "Ayşe Yılmaz",
    "phone": "05320000000",
    "address": "Moda Cad. 1, Kadıköy, İstanbul",
    "role": "customer",
    "is_active": true,
    "created_at": "2026-10-08T12:00:00Z"
  }
}
```

### ProductListItem

```json
{
  "id": 5,
  "sku": "KLV-1001",
  "name": "Mekanik Klavye",
  "short_description": "Türkçe Q düzen, kırmızı anahtarlar",
  "price": "1299.90",
  "stock": 12,
  "is_new": true,
  "brand": {"id": 2, "name": "Nova"},
  "category": {"id": 3, "name": "Klavye ve Fare"},
  "image_url": "/api/media/3f9c2a1e7b8d4c6a9e0f1a2b3c4d5e6f.jpg"
}
```

`brand` and `category` are `null` when they are not set. `image_url` is `/api/media/placeholder.svg`
for a product without images.

### ProductDetail

```json
{
  "id": 5,
  "sku": "KLV-1001",
  "name": "Mekanik Klavye",
  "short_description": "Türkçe Q düzen, kırmızı anahtarlar",
  "price": "1299.90",
  "stock": 12,
  "is_new": true,
  "brand": {"id": 2, "name": "Nova"},
  "category": {"id": 3, "name": "Klavye ve Fare"},
  "image_url": "/api/media/3f9c2a1e7b8d4c6a9e0f1a2b3c4d5e6f.jpg",
  "description": "Alüminyum gövde, değiştirilebilir tuş takımı ve iki yıl garanti.",
  "images": [
    {"id": 11, "url": "/api/media/3f9c2a1e7b8d4c6a9e0f1a2b3c4d5e6f.jpg", "position": 0},
    {"id": 12, "url": "/api/media/0a1b2c3d4e5f60718293a4b5c6d7e8f9.png", "position": 1}
  ],
  "created_at": "2026-10-08T12:00:00Z"
}
```

### AdminProduct

`AdminProduct` is `ProductDetail` plus three admin-only fields. `cost_price` never appears in a public response.

```json
{
  "id": 5,
  "sku": "KLV-1001",
  "name": "Mekanik Klavye",
  "short_description": "Türkçe Q düzen, kırmızı anahtarlar",
  "price": "1299.90",
  "stock": 12,
  "is_new": true,
  "brand": {"id": 2, "name": "Nova"},
  "category": {"id": 3, "name": "Klavye ve Fare"},
  "image_url": "/api/media/3f9c2a1e7b8d4c6a9e0f1a2b3c4d5e6f.jpg",
  "description": "Alüminyum gövde, değiştirilebilir tuş takımı ve iki yıl garanti.",
  "images": [
    {"id": 11, "url": "/api/media/3f9c2a1e7b8d4c6a9e0f1a2b3c4d5e6f.jpg", "position": 0}
  ],
  "created_at": "2026-10-08T12:00:00Z",
  "cost_price": "980.00",
  "is_active": true,
  "updated_at": "2026-10-08T12:30:00Z"
}
```

### Cart

```json
{
  "items": [
    {
      "product_id": 5,
      "name": "Mekanik Klavye",
      "unit_price": "1299.90",
      "quantity": 2,
      "line_total": "2599.80",
      "stock": 12,
      "available": true,
      "image_url": "/api/media/3f9c2a1e7b8d4c6a9e0f1a2b3c4d5e6f.jpg"
    }
  ],
  "total": "2599.80"
}
```

### Order

`Order` is the customer view. `OrderListItem` has only `id`, `status`, `total`, `item_count` and
`created_at`. `item_count` is the number of units (the sum of the quantities), not the number of lines.

```json
{
  "id": 41,
  "status": "new",
  "total": "2599.80",
  "item_count": 2,
  "created_at": "2026-10-08T12:00:00Z",
  "ship_name": "Ayşe Yılmaz",
  "ship_phone": "05320000000",
  "ship_address": "Moda Cad. 1, Kadıköy, İstanbul",
  "cargo_company": null,
  "tracking_no": null,
  "updated_at": "2026-10-08T12:00:00Z",
  "items": [
    {
      "product_id": 5,
      "product_name": "Mekanik Klavye",
      "unit_price": "1299.90",
      "quantity": 2,
      "line_total": "2599.80"
    }
  ]
}
```

`AdminOrder` adds two fields to `Order`: `customer` (`{"id": 2, "email": "ayse@example.com", "full_name": "Ayşe Yılmaz"}`)
and `admin_note`. `AdminOrderListItem` adds `customer` to `OrderListItem`.

### Message

`Message` is the customer view. `AdminMessage` adds `phone`, `user_id` and `admin_note`.

```json
{
  "id": 9,
  "direction": "outbound",
  "subject": "Siparişiniz hakkında",
  "body": "Siparişiniz kargoya verildi.",
  "status": "read",
  "name": "Ayşe Yılmaz",
  "email": "ayse@example.com",
  "created_at": "2026-10-08T12:00:00Z"
}
```

### SiteSettings

All ten fields are text. Each one has a maximum length; the longest are `about_text` and `contact_text` (20000 characters).

```json
{
  "site_name": "Örnek Mağaza",
  "description": "Elektronik çevre birimleri ve aksesuarlar.",
  "address": "Moda Cad. 1, Kadıköy, İstanbul",
  "phone": "0212 000 00 00",
  "email": "info@example.com",
  "facebook": "",
  "instagram": "",
  "pinterest": "",
  "about_text": "Mağazamız 2010 yılından beri müşterilerine hizmet veriyor.",
  "contact_text": "Hafta içi 09:00 - 18:00 arasında arayabilirsiniz."
}
```

### Dashboard

```json
{
  "new_orders": 3,
  "unread_messages": 2,
  "products": 20,
  "customers": 14
}
```

`new_orders` counts orders with status `new`. `unread_messages` counts inbound messages with status
`new`. `products` counts all products, active or not. `customers` counts active users with role `customer`.

### Other shapes

| Shape | Fields |
|---|---|
| `Page<T>` | `items` (a list of `T`), `total`, `page`, `page_size` |
| `Taxonomy` | `id`, `name`, `description`. Used for categories and brands. |
| `ProductImageOut` | `id`, `url`, `position` |
| `Comment` | `id`, `product_id`, `user_id`, `author_name`, `body`, `created_at` |
| `MyComment` | `Comment` plus `product_name` |
| `AdminComment` | `MyComment` plus `author_email` |
| `CartItem` | `product_id`, `name`, `unit_price`, `quantity`, `line_total`, `stock`, `available`, `image_url` |
| `OrderItem` | `product_id`, `product_name`, `unit_price`, `quantity`, `line_total` |
| `Customer` | `id`, `email`, `full_name` |

## 6. Orders and the status machine

### Statuses

| Status | Allowed next statuses | Stock |
|---|---|---|
| `new` | `approved`, `rejected`, `cancelled` | |
| `approved` | `shipped`, `cancelled` | |
| `shipped` | `completed` | |
| `completed` | none (final) | |
| `rejected` | none (final) | returned when the order enters this status |
| `cancelled` | none (final) | returned when the order enters this status |

- Setting an order to the status it already has is a no-op. It is not an error, and stock is not returned again.
- Entering `rejected` or `cancelled` adds each item's quantity back to `products.stock`, in the same transaction as the status change. This happens from `new` and from `approved`.
- A customer's only status change is `POST /api/orders/{order_id}/cancel`. It works only while the order is `new`, and it returns the stock.
- An admin's `PATCH /api/admin/orders/{order_id}` may change the status to any allowed next status. A refused change saves nothing else in that request.

### How an order is placed

`POST /api/orders` runs as one database transaction:

1. Lock the caller's cart lines (`SELECT ... FOR UPDATE`), and process them in product id order, so that two checkouts that share products always take the stock in the same order and cannot wait on each other in a cycle. No lines means `400 empty_cart`.
2. For each line, take the stock with one guarded statement:

   ```sql
   UPDATE products SET stock = stock - %s, updated_at = now()
   WHERE id = %s AND is_active AND stock >= %s
   RETURNING price, name
   ```

   If no row comes back, the whole checkout is rolled back. The answer is `409 product_unavailable` when the product is inactive, and `409 insufficient_stock` otherwise. Both carry the `product_id`.

3. Take each unit price and name from the row that the `UPDATE` returned. The client never sends a price. The total is the sum of `price × quantity` over the lines.
4. Insert the order with status `new`, then one `order_items` row per line. Each row copies the product name, the unit price and the line total, so a later rename or price change does not alter an existing order.
5. Delete the caller's cart lines and commit.

The implementation is in `backend/app/services/orders.py` (`place_order`, `admin_update_order`,
`cancel_own_order`) and `backend/app/repositories/orders.py`.

## 7. Database

The schema is defined only in `backend/migrations/0001_init.sql`. The tests and `seed.py` run against
the schema that this file creates. The schema has no triggers, so every `UPDATE` statement sets
`updated_at` itself on the tables that have that column.

| Table | Purpose and notable constraints |
|---|---|
| `users` | Customers and administrators. `role` is `customer` or `admin`. `is_active` deactivates an account instead of deleting it. E-mail addresses are unique ignoring case (`users_email_lower_key` on `lower(email)`). `password_hash` holds an Argon2 hash and is never returned. |
| `categories`, `brands` | Shared shape: `name` (unique, 1 to 100 characters) and `description` (up to 2000). Products reference them with `ON DELETE RESTRICT`. |
| `products` | `sku` (unique, up to 64 characters). `brand_id` and `category_id` reference the taxonomy tables with `RESTRICT`. `price` and `cost_price` are `NUMERIC(12,2)` and not negative; `stock` is not negative. `is_active` hides a product from the shop. `updated_at` is the version that `PUT` compares with `expected_updated_at`. |
| `product_images` | One row per image: a generated `file_name` and a `position`. The lowest position is the cover. The unique pair `(product_id, position)` is deferred, so a reorder can swap positions in one transaction. Rows cascade with the product. |
| `cart_items` | One row per user and product, unique on `(user_id, product_id)`, with `quantity` from 1 to 99. Rows cascade when the user or the product is deleted. |
| `orders` | Status (one of the six values, checked), `total` (`NUMERIC(12,2)`, not negative), the shipping fields copied from the checkout form, and `cargo_company`, `tracking_no` and `admin_note` set by admins. `user_id` references `users` with `RESTRICT`. Orders are never deleted. |
| `order_items` | Line items. `order_id` cascades from `orders`. `product_id` references `products` with `RESTRICT`, so a product that was ordered cannot be deleted. `product_name`, `unit_price` and `line_total` are a snapshot taken at checkout. `quantity` is above zero. |
| `comments` | `body` (1 to 2000 characters). Rows cascade with the product and with the author. Indexed by product and newest first. |
| `messages` | Contact messages (`direction` inbound) and admin replies (`direction` outbound). `user_id` is empty for a guest and references `users` with `RESTRICT`. A CHECK requires a user on every outbound message. `status` is `new` or `read`. The name, e-mail, subject and body are stored trimmed (the e-mail also lowercased); the phone number is stored as sent. |
| `site_settings` | One row, enforced by `id = 1`, with ten text columns. The migration creates no row; the first read creates it. |
| `schema_migrations` | Kept by the migration runner, not by a migration file: `version` (primary key), `checksum` (SHA-256 of the file) and `applied_at`. |

### Adding a migration

1. Create a new file in `backend/migrations/` whose name is four digits, an underscore, and a name in
   lowercase letters, digits and underscores, for example `0002_wishlist.sql`. The runner rejects other names.
2. Never edit a file that has already been applied. The runner stores the SHA-256 checksum of each
   applied file, and when a stored checksum no longer matches, it stops with
   `MigrationError: <version> changed after it was applied`.
3. Apply it from `backend/` with `python -m app.migrate`. The command reads `DATABASE_URL` from the
   environment or from `backend/.env`. Each file runs in its own transaction together with its
   `schema_migrations` row, so a failing file changes nothing and stops the run.

## 8. Adding a feature

This walkthrough is an illustration. It adds a wishlist, a list of products that a logged-in customer
wants to keep. The wishlist does not exist in the project, and none of the files named below exist
either. The existing files named as models are real.

### Backend

1. **Migration.** `backend/migrations/0002_wishlist.sql`:

   ```sql
   CREATE TABLE wishlist_items (
       user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
       product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
       PRIMARY KEY (user_id, product_id)
   );
   ```

2. **Schemas.** `backend/app/schemas/wishlist.py`, modelled on `schemas/cart.py`. Request bodies inherit
   `InputModel`, which rejects unknown fields:

   ```python
   class WishlistAddIn(InputModel):
       product_id: int

   class WishlistItemOut(BaseModel):
       product_id: int
       name: str
       price: Money
       created_at: Iso
   ```

3. **Repository.** `backend/app/repositories/wishlist.py`, modelled on `repositories/cart.py`. The
   connection is the first argument, the SQL is plain with `%s` placeholders, and the functions return a
   `dict`, a list of dicts, `None` or a count, as the callers need:

   ```python
   def add(conn: psycopg.Connection, user_id: int, product_id: int) -> None:
       conn.execute(
           "INSERT INTO wishlist_items (user_id, product_id) VALUES (%s, %s) "
           "ON CONFLICT DO NOTHING",
           (user_id, product_id),
       )
   ```

4. **Service.** `backend/app/services/wishlist.py`, with the rule that only active products can be
   saved. Model: `services/cart.py`, whose `_active_product` answers `404 not_found`. A unit that does
   several writes runs inside `with conn.transaction():`, as `place_order` does in `services/orders.py`.
   A single statement needs no transaction, because the pool commits each statement.

5. **Router.** `backend/app/routers/wishlist.py`, modelled on `routers/cart.py`. The dependencies are
   the ones the other routers use: `Conn` for the database, `CurrentUser` for the caller and `Pagination`
   for `page` and `page_size`. Every router module must also define an `admin_router`, even when it has
   no admin routes, because the wiring test checks for it:

   ```python
   router = APIRouter()
   admin_router = APIRouter(dependencies=[Depends(require_admin)])

   @router.post("/wishlist/items", status_code=204)
   def add_to_wishlist(body: WishlistAddIn, conn: Conn, user: CurrentUser) -> Response:
       wishlist_service.add(conn, user["id"], body.product_id)
       return Response(status_code=204)
   ```

   Then register the module in two places: the `ROUTER_MODULES` tuple in `backend/app/main.py`, which
   is what mounts its routes, and the module list in `backend/tests/api/test_wiring.py`.

6. **Tests.** The new test file is `backend/tests/api/test_wishlist.py`. Use the fixtures and factories
   from `backend/tests/conftest.py`: `client`, `make_user`, `make_product`, `auth_headers`,
   `admin_headers`. The test database is emptied after each test automatically:

   ```python
   def test_wishlist_requires_login(client: TestClient) -> None:
       assert client.post("/api/wishlist/items", json={"product_id": 1}).status_code == 401

   def test_adding_an_active_product_saves_it(client, make_user, make_product, auth_headers) -> None:
       user = make_user()
       product = make_product()
       response = client.post(
           "/api/wishlist/items", json={"product_id": product["id"]}, headers=auth_headers(user)
       )
       assert response.status_code == 204
   ```

   `backend/tests/api/test_route_security.py` also checks every new route automatically: each route that
   is not listed in its `PUBLIC_ROUTES` set must answer 401 without a token, and each admin route must
   answer 403 to a customer. A new public route is therefore added to `PUBLIC_ROUTES`.

### Frontend

7. **Type.** `frontend/src/lib/types.ts` gets an exported interface that mirrors the JSON:

   ```ts
   export interface WishlistItem {
     product_id: number
     name: string
     price: Money
     created_at: Iso
   }
   ```

8. **Hook.** `frontend/src/features/wishlist/hooks/useWishlist.ts`, modelled on `features/cart/hooks/useCart.ts`.
   The query key starts with a constant that other hooks can invalidate:

   ```ts
   export const wishlistQueryKey = ['wishlist'] as const

   export function useWishlist(page: number) {
     return useQuery({
       queryKey: [...wishlistQueryKey, page],
       queryFn: () => api.get<Page<WishlistItem>>('/wishlist', { page }),
     })
   }
   ```

   The query keys already in use are: `['cart']` for the cart; `['orders', ...]` for every customer
   order query, so one invalidation refreshes them all; `['site']` for the public site settings; and
   `['admin', ...]` for every admin query. Admin keys always begin with `'admin'`.

9. **Page.** `frontend/src/features/wishlist/pages/WishlistPage.tsx`, the default export, modelled on
   `features/cart/pages/CartPage.tsx`. Every visible string comes from `t(...)`, and the page shows the
   errors with `ErrorNotice`.

10. **Route.** `frontend/src/app/routes.tsx`, inside the `RequireAuth` group next to `cart` and `checkout`:

    ```tsx
    <Route path="wishlist" element={<WishlistPage />} />
    ```

11. **Strings.** `frontend/src/locales/tr/wishlist.json`. Every `.json` file in that folder is loaded
    automatically, so nothing needs registering. A key that is missing from the file is shown as the
    key itself:

    ```json
    {
      "title": "Favorilerim",
      "empty": "Favori listeniz boş.",
      "remove": "Kaldır"
    }
    ```

    The page uses `t('wishlist.title')`.

12. **Test.** `frontend/src/features/wishlist/pages/WishlistPage.test.tsx`, modelled on
    `features/cart/pages/CartPage.test.tsx`. The test renders with `renderWithProviders` from
    `@/test/utils`, and it mocks the network by spying on the `api` object. Do not mock `@/lib/api`
    as a module, because that replaces the real `ApiError` class:

    ```tsx
    import { screen } from '@testing-library/react'
    import WishlistPage from '@/features/wishlist/pages/WishlistPage'
    import { api } from '@/lib/api'
    import { renderWithProviders, testCustomer } from '@/test/utils'

    const wishlistItem = {
      product_id: 5,
      name: 'Mekanik Klavye',
      price: '1299.90',
      created_at: '2026-10-08T12:00:00Z',
    }

    it('lists the saved products', async () => {
      vi.spyOn(api, 'get').mockResolvedValue({ items: [wishlistItem], total: 1, page: 1, page_size: 20 })
      renderWithProviders(<WishlistPage />, { user: testCustomer })
      expect(await screen.findByText('Mekanik Klavye')).toBeInTheDocument()
    })
    ```

    Restore the spies after each test (`afterEach(() => vi.restoreAllMocks())`), as the cart tests do.
