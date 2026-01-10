-- Add images column to materials table
ALTER TABLE materials ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';

-- Add description column if not exists
ALTER TABLE materials ADD COLUMN IF NOT EXISTS description TEXT DEFAULT NULL;

-- Add surface column if not exists
ALTER TABLE materials ADD COLUMN IF NOT EXISTS surface NUMERIC DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN materials.images IS 'Array of image URLs for the material';
COMMENT ON COLUMN materials.description IS 'Detailed description of the material';
COMMENT ON COLUMN materials.surface IS 'Surface area in square meters';
