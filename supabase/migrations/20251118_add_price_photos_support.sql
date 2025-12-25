-- Add support for price photos and photo types
-- This migration adds columns to distinguish between material photos and price photos

-- Add price_id column to photos table
ALTER TABLE photos 
ADD COLUMN price_id INTEGER REFERENCES prices(id) ON DELETE CASCADE;

-- Add photo_type column to photos table
-- Types: 'material' for supplier material photos, 'price' for price/product photos
ALTER TABLE photos 
ADD COLUMN photo_type TEXT CHECK (photo_type IN ('material', 'price')) DEFAULT 'material';

-- Update constraint to allow photos to belong to either a material or a price
-- Material photos: material_id NOT NULL, price_id NULL
-- Price photos: material_id NULL, price_id NOT NULL
ALTER TABLE photos 
DROP CONSTRAINT IF EXISTS photos_material_id_fkey;

ALTER TABLE photos
ADD CONSTRAINT photos_material_id_fkey 
FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE;

-- Add check constraint to ensure photo belongs to either material or price, not both
ALTER TABLE photos
ADD CONSTRAINT photos_belongs_to_material_or_price
CHECK (
  (material_id IS NOT NULL AND price_id IS NULL) OR
  (material_id IS NULL AND price_id IS NOT NULL)
);

-- Create index for price_id
CREATE INDEX idx_photos_price_id ON photos(price_id);

-- Update RLS policies for photos table
DROP POLICY IF EXISTS "Users can view photos for their materials" ON photos;
DROP POLICY IF EXISTS "Editors can manage photos" ON photos;

-- New RLS policy for viewing photos (both material and price photos)
CREATE POLICY "Users can view photos for their materials and prices" ON photos
  FOR SELECT USING (
    -- Material photos
    (material_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM materials
      JOIN projects ON projects.id = materials.project_id
      WHERE materials.id = photos.material_id
      AND projects.user_id = auth.uid()
    ))
    OR
    -- Price photos
    (price_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM prices
      JOIN materials ON materials.id = prices.material_id
      JOIN projects ON projects.id = materials.project_id
      WHERE prices.id = photos.price_id
      AND projects.user_id = auth.uid()
    ))
  );

-- New RLS policy for managing photos (both material and price photos)
CREATE POLICY "Editors can manage photos" ON photos
  FOR ALL USING (
    -- Material photos
    (material_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM materials
      JOIN projects ON projects.id = materials.project_id
      JOIN users ON users.id = projects.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE materials.id = photos.material_id
      AND projects.user_id = auth.uid()
      AND roles.name IN ('Administrator', 'Editor')
    ))
    OR
    -- Price photos
    (price_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM prices
      JOIN materials ON materials.id = prices.material_id
      JOIN projects ON projects.id = materials.project_id
      JOIN users ON users.id = projects.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE prices.id = photos.price_id
      AND projects.user_id = auth.uid()
      AND roles.name IN ('Administrator', 'Editor')
    ))
  );

-- Add comment to document the new structure
COMMENT ON COLUMN photos.price_id IS 'Reference to price table for price/product photos';
COMMENT ON COLUMN photos.photo_type IS 'Type of photo: material (supplier material photo) or price (price/product photo)';
