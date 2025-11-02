-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles table
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL CHECK (name IN ('Administrator', 'Editor', 'Reader'))
);

-- Insert default roles
INSERT INTO roles (name) VALUES ('Administrator'), ('Editor'), ('Reader');

-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  hashed_password TEXT NOT NULL,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'fr', 'zh')),
  role_id INT REFERENCES roles(id) DEFAULT 3, -- Default to Reader
  created_at TIMESTAMP DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('Free', 'Premium')),
  project_limit INT DEFAULT 5,
  export_limit INT DEFAULT 2,
  expires_at DATE
);

-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_url TEXT,
  file_path TEXT,
  mapping_status TEXT CHECK (mapping_status IN ('pending', 'completed', 'corrected')),
  created_at TIMESTAMP DEFAULT now()
);

-- Create column_mappings table
CREATE TABLE column_mappings (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  ai_mapping JSONB,
  user_mapping JSONB,
  updated_at TIMESTAMP DEFAULT now()
);

-- Create materials table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  quantity NUMERIC,
  weight NUMERIC,
  volume NUMERIC,
  specs JSONB
);

-- Create suppliers table
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT,
  contact_info JSONB,
  logo_url TEXT
);

-- Create currencies table
CREATE TABLE currencies (
  code TEXT PRIMARY KEY,
  symbol TEXT
);

-- Insert default currencies
INSERT INTO currencies (code, symbol) VALUES 
  ('CFA', 'FCFA'),
  ('RMB', '¥');

-- Create exchange_rates table
CREATE TABLE exchange_rates (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  from_currency TEXT REFERENCES currencies(code),
  to_currency TEXT REFERENCES currencies(code),
  rate NUMERIC NOT NULL,
  updated_at TIMESTAMP DEFAULT now()
);

-- Create prices table
CREATE TABLE prices (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  country TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT REFERENCES currencies(code),
  converted_amount NUMERIC,
  created_at TIMESTAMP DEFAULT now()
);

-- Create photos table
CREATE TABLE photos (
  id SERIAL PRIMARY KEY,
  material_id UUID REFERENCES materials(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT now()
);

-- Create exports table
CREATE TABLE exports (
  id SERIAL PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  format TEXT CHECK (format IN ('PDF', 'Excel')),
  file_path TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_materials_project_id ON materials(project_id);
CREATE INDEX idx_prices_material_id ON prices(material_id);
CREATE INDEX idx_prices_supplier_id ON prices(supplier_id);
CREATE INDEX idx_photos_material_id ON photos(material_id);
CREATE INDEX idx_exports_project_id ON exports(project_id);
CREATE INDEX idx_exports_user_id ON exports(user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE column_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for projects table
CREATE POLICY "Users can view their own projects" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for materials table
CREATE POLICY "Users can view materials in their projects" ON materials
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM projects 
      WHERE projects.id = materials.project_id 
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage materials" ON materials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM projects 
      JOIN users ON users.id = projects.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE projects.id = materials.project_id 
      AND projects.user_id = auth.uid()
      AND roles.name IN ('Administrator', 'Editor')
    )
  );

-- RLS Policies for suppliers table
CREATE POLICY "Anyone can view suppliers" ON suppliers
  FOR SELECT USING (true);

CREATE POLICY "Admins and Editors can manage suppliers" ON suppliers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      JOIN roles ON roles.id = users.role_id
      WHERE users.id = auth.uid()
      AND roles.name IN ('Administrator', 'Editor')
    )
  );

-- RLS Policies for prices table
CREATE POLICY "Users can view prices for their materials" ON prices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM materials
      JOIN projects ON projects.id = materials.project_id
      WHERE materials.id = prices.material_id
      AND projects.user_id = auth.uid()
    )
  );

CREATE POLICY "Editors can manage prices" ON prices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM materials
      JOIN projects ON projects.id = materials.project_id
      JOIN users ON users.id = projects.user_id
      JOIN roles ON roles.id = users.role_id
      WHERE materials.id = prices.material_id
      AND projects.user_id = auth.uid()
      AND roles.name IN ('Administrator', 'Editor')
    )
  );

-- RLS Policies for exports table
CREATE POLICY "Users can view their own exports" ON exports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create exports for their projects" ON exports
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = exports.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Create function to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_column_mappings_updated_at
  BEFORE UPDATE ON column_mappings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_exchange_rates_updated_at
  BEFORE UPDATE ON exchange_rates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
