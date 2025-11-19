-- Create template_materials table for storing materials in templates
CREATE TABLE IF NOT EXISTS public.template_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  quantity NUMERIC DEFAULT 1,
  unit TEXT DEFAULT 'unité',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE
);

-- Add user_id to templates table for tracking who created the template
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_template_materials_template_id ON public.template_materials(template_id);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);

-- Enable RLS
ALTER TABLE public.template_materials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for template_materials
CREATE POLICY "Template materials are viewable by authenticated users"
  ON public.template_materials
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert materials for their templates"
  ON public.template_materials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_materials.template_id
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update materials in their templates"
  ON public.template_materials
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_materials.template_id
      AND templates.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete materials from their templates"
  ON public.template_materials
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.templates
      WHERE templates.id = template_materials.template_id
      AND templates.user_id = auth.uid()
    )
  );

-- Update policy for templates to allow users to create their own
DROP POLICY IF EXISTS "Only admins can insert templates" ON public.templates;

CREATE POLICY "Users can insert their own templates"
  ON public.templates
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON public.templates
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON public.templates
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_template_materials_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_materials_updated_at_trigger
  BEFORE UPDATE ON public.template_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_template_materials_updated_at();

COMMENT ON TABLE public.template_materials IS 'Materials associated with project templates';
COMMENT ON COLUMN public.template_materials.template_id IS 'Reference to the parent template';
COMMENT ON COLUMN public.template_materials.name IS 'Material name';
COMMENT ON COLUMN public.template_materials.description IS 'Material description';
COMMENT ON COLUMN public.template_materials.quantity IS 'Material quantity';
COMMENT ON COLUMN public.template_materials.unit IS 'Unit of measurement (unité, m², kg, etc.)';
