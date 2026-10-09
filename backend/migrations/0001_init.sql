CREATE TABLE users (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         TEXT        NOT NULL CHECK (char_length(email) <= 254),
    full_name     TEXT        NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 100),
    password_hash TEXT        NOT NULL,
    role          TEXT        NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
    phone         TEXT        CHECK (char_length(phone) <= 30),
    address       TEXT        CHECK (char_length(address) <= 500),
    token_version INTEGER     NOT NULL DEFAULT 0,
    is_active     BOOLEAN     NOT NULL DEFAULT TRUE,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX users_email_lower_key ON users (lower(email));

CREATE TABLE categories (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 100),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000)
);

CREATE TABLE brands (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE CHECK (char_length(name) BETWEEN 1 AND 100),
    description TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 2000)
);

CREATE TABLE products (
    id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    sku               TEXT          NOT NULL UNIQUE CHECK (char_length(sku) BETWEEN 1 AND 64),
    name              TEXT          NOT NULL CHECK (char_length(name) BETWEEN 1 AND 200),
    brand_id          BIGINT        REFERENCES brands (id) ON DELETE RESTRICT,
    category_id       BIGINT        REFERENCES categories (id) ON DELETE RESTRICT,
    short_description TEXT          NOT NULL DEFAULT '' CHECK (char_length(short_description) <= 500),
    description       TEXT          NOT NULL DEFAULT '' CHECK (char_length(description) <= 5000),
    price             NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    cost_price        NUMERIC(12,2) CHECK (cost_price >= 0),
    stock             INTEGER       NOT NULL DEFAULT 0 CHECK (stock >= 0),
    is_new            BOOLEAN       NOT NULL DEFAULT FALSE,
    is_active         BOOLEAN       NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at        TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX products_category_idx ON products (category_id);
CREATE INDEX products_brand_idx ON products (brand_id);
CREATE INDEX products_active_created_idx ON products (is_active, created_at DESC);

CREATE TABLE product_images (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    file_name  TEXT        NOT NULL,
    thumb_name TEXT,
    position   INTEGER     NOT NULL DEFAULT 0 CHECK (position >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT product_images_position_key UNIQUE (product_id, position) DEFERRABLE INITIALLY DEFERRED
);

CREATE TABLE cart_items (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    quantity   INTEGER     NOT NULL CHECK (quantity BETWEEN 1 AND 99),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT cart_items_user_product_key UNIQUE (user_id, product_id)
);

CREATE TABLE orders (
    id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id       BIGINT        NOT NULL REFERENCES users (id) ON DELETE RESTRICT,
    status        TEXT          NOT NULL DEFAULT 'new'
                  CHECK (status IN ('new', 'approved', 'rejected', 'cancelled', 'shipped', 'completed')),
    total         NUMERIC(12,2) NOT NULL CHECK (total >= 0),
    ship_name     TEXT          NOT NULL CHECK (char_length(ship_name) BETWEEN 1 AND 100),
    ship_phone    TEXT          NOT NULL CHECK (char_length(ship_phone) BETWEEN 1 AND 30),
    ship_address  TEXT          NOT NULL CHECK (char_length(ship_address) BETWEEN 1 AND 500),
    cargo_company TEXT          CHECK (char_length(cargo_company) <= 100),
    tracking_no   TEXT          CHECK (char_length(tracking_no) <= 100),
    admin_note    TEXT          CHECK (char_length(admin_note) <= 2000),
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);
CREATE INDEX orders_status_idx ON orders (status, created_at DESC);
CREATE INDEX orders_created_idx ON orders (created_at DESC, id DESC);

CREATE TABLE order_items (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    order_id     BIGINT        NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
    product_id   BIGINT        NOT NULL REFERENCES products (id) ON DELETE RESTRICT,
    product_name TEXT          NOT NULL,
    unit_price   NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    quantity     INTEGER       NOT NULL CHECK (quantity > 0),
    line_total   NUMERIC(12,2) NOT NULL CHECK (line_total >= 0)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);

CREATE TABLE comments (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX comments_product_idx ON comments (product_id, created_at DESC);
CREATE INDEX comments_user_idx ON comments (user_id);

CREATE TABLE product_ratings (
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    rating     SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);
CREATE INDEX product_ratings_product_idx ON product_ratings (product_id);

CREATE TABLE favorites (
    user_id    BIGINT      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    product_id BIGINT      NOT NULL REFERENCES products (id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, product_id)
);
CREATE INDEX favorites_user_idx ON favorites (user_id, created_at DESC);

CREATE TABLE messages (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    direction  TEXT        NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    user_id    BIGINT      REFERENCES users (id) ON DELETE RESTRICT,
    name       TEXT        NOT NULL CHECK (char_length(name) BETWEEN 1 AND 100),
    email      TEXT        NOT NULL CHECK (char_length(email) <= 254),
    phone      TEXT        CHECK (char_length(phone) <= 30),
    subject    TEXT        NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 200),
    body       TEXT        NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
    status     TEXT        NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read')),
    admin_note TEXT        CHECK (char_length(admin_note) <= 2000),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT messages_outbound_needs_user CHECK (direction = 'inbound' OR user_id IS NOT NULL)
);
CREATE INDEX messages_status_idx ON messages (status);
CREATE INDEX messages_user_idx ON messages (user_id, created_at DESC);

CREATE TABLE site_settings (
    id           SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    site_name    TEXT NOT NULL DEFAULT '' CHECK (char_length(site_name) <= 100),
    description  TEXT NOT NULL DEFAULT '' CHECK (char_length(description) <= 500),
    address      TEXT NOT NULL DEFAULT '' CHECK (char_length(address) <= 500),
    phone        TEXT NOT NULL DEFAULT '' CHECK (char_length(phone) <= 30),
    email        TEXT NOT NULL DEFAULT '' CHECK (char_length(email) <= 254),
    facebook     TEXT NOT NULL DEFAULT '' CHECK (char_length(facebook) <= 200),
    instagram    TEXT NOT NULL DEFAULT '' CHECK (char_length(instagram) <= 200),
    pinterest    TEXT NOT NULL DEFAULT '' CHECK (char_length(pinterest) <= 200),
    about_text   TEXT NOT NULL DEFAULT '' CHECK (char_length(about_text) <= 20000),
    contact_text TEXT NOT NULL DEFAULT '' CHECK (char_length(contact_text) <= 20000)
);
