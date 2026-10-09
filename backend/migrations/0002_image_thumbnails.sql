-- Card-sized WebP copy of an upload. NULL for images uploaded before resizing existed.
ALTER TABLE product_images ADD COLUMN thumb_name TEXT;
