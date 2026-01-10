-- Create storage bucket for quote request images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'quote-requests',
  'quote-requests',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for quote-requests" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to quote-requests" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to quote-requests" ON storage.objects;

-- Allow public read access to all files in the bucket
CREATE POLICY "Public read access for quote-requests"
ON storage.objects FOR SELECT
USING (bucket_id = 'quote-requests');

-- Allow anyone to upload files (for public quote request form)
CREATE POLICY "Anyone can upload to quote-requests"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'quote-requests');

-- Allow service role full access (for API routes)
CREATE POLICY "Service role full access to quote-requests"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'quote-requests')
WITH CHECK (bucket_id = 'quote-requests');
