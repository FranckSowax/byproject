-- Create templates table for storing project templates
CREATE TABLE IF NOT EXISTS public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT CHECK (category IN ('residential', 'commercial', 'renovation')),
  file_url TEXT,
  file_type TEXT,
  materials_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_templates_category ON public.templates(category);
CREATE INDEX IF NOT EXISTS idx_templates_is_active ON public.templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.templates(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow authenticated users to read templates
CREATE POLICY "Templates are viewable by authenticated users"
  ON public.templates
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow only admin users to insert templates
CREATE POLICY "Only admins can insert templates"
  ON public.templates
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow only admin users to update templates
CREATE POLICY "Only admins can update templates"
  ON public.templates
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow only admin users to delete templates
CREATE POLICY "Only admins can delete templates"
  ON public.templates
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_templates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER templates_updated_at_trigger
  BEFORE UPDATE ON public.templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_templates_updated_at();

-- Optional: Create storage bucket for template files
-- Run this in Supabase SQL Editor or via CLI
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('templates', 'templates', true);

-- Create storage policies for templates bucket
-- Allow authenticated users to read files
CREATE POLICY "Templates files are publicly accessible"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'templates');

-- Allow only admins to upload files
CREATE POLICY "Only admins can upload template files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'templates' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow only admins to update files
CREATE POLICY "Only admins can update template files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'templates' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

-- Allow only admins to delete files
CREATE POLICY "Only admins can delete template files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'templates' AND
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

COMMENT ON TABLE public.templates IS 'Project templates with optional file attachments (Excel, CSV, PDF)';
COMMENT ON COLUMN public.templates.name IS 'Template name';
COMMENT ON COLUMN public.templates.description IS 'Template description';
COMMENT ON COLUMN public.templates.category IS 'Template category: residential, commercial, renovation';
COMMENT ON COLUMN public.templates.file_url IS 'URL to the template file in storage';
COMMENT ON COLUMN public.templates.file_type IS 'MIME type of the template file';
COMMENT ON COLUMN public.templates.materials_count IS 'Number of materials in this template';
COMMENT ON COLUMN public.templates.is_active IS 'Whether the template is active and available for use';
