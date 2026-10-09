-- The admin order list, the dashboard's newest orders and its 14-day chart read orders by date.
CREATE INDEX orders_created_idx ON orders (created_at DESC, id DESC);

-- A product without photos shows the shared placeholder anyway, so the rows that the seed stored for it
-- are not needed. Only rows that point at exactly that file are removed.
DELETE FROM product_images WHERE file_name = 'placeholder.svg';
