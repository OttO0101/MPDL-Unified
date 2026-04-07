-- Add photo_url column to cleaning_inventories table
-- This stores a public Blob URL for the photo attached to each inventory record

ALTER TABLE cleaning_inventories
  ADD COLUMN IF NOT EXISTS photo_url text DEFAULT NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'cleaning_inventories'
  AND column_name = 'photo_url';
