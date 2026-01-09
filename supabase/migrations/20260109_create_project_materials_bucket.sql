-- Create storage bucket for project materials images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-materials',
  'project-materials',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for project-materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-materials');

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload to project-materials"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-materials');

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete own files in project-materials"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-materials');

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access to project-materials"
ON storage.objects
USING (bucket_id = 'project-materials')
WITH CHECK (bucket_id = 'project-materials');
