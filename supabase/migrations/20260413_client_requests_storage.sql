-- ============================================================================
-- Migration: Storage bucket for client request images
-- ============================================================================

-- Create storage bucket for client request images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'client-request-images',
  'client-request-images',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
) ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY "Public read access for client request images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'client-request-images');

-- Allow anyone to upload images (public form)
CREATE POLICY "Anyone can upload client request images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'client-request-images');

-- Allow service role to delete images
CREATE POLICY "Service role can delete client request images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'client-request-images');
