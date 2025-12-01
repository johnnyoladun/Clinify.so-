-- Organisations table
CREATE TABLE IF NOT EXISTS organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  owner_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Locations table
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  table_id TEXT NOT NULL UNIQUE,
  form_id TEXT NOT NULL,
  field_mapping_patient_name TEXT,
  field_mapping_id_document TEXT,
  field_mapping_dr_script TEXT,
  field_mapping_outcome_letters TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organisation_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_locations_org_id ON locations(organisation_id);
CREATE INDEX IF NOT EXISTS idx_locations_table_id ON locations(table_id);
CREATE INDEX IF NOT EXISTS idx_locations_form_id ON locations(form_id);

-- Enable Row Level Security
ALTER TABLE organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated users to read organisations" ON organisations;
DROP POLICY IF EXISTS "Allow admin users to insert organisations" ON organisations;
DROP POLICY IF EXISTS "Allow admin users to update organisations" ON organisations;
DROP POLICY IF EXISTS "Allow admin users to delete organisations" ON organisations;
DROP POLICY IF EXISTS "Allow authenticated users to read locations" ON locations;
DROP POLICY IF EXISTS "Allow admin users to insert locations" ON locations;
DROP POLICY IF EXISTS "Allow admin users to update locations" ON locations;
DROP POLICY IF EXISTS "Allow admin users to delete locations" ON locations;

-- Policies for organisations (admin only)
CREATE POLICY "Allow authenticated users to read organisations" 
  ON organisations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin users to insert organisations" 
  ON organisations FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow admin users to update organisations" 
  ON organisations FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin users to delete organisations" 
  ON organisations FOR DELETE 
  TO authenticated 
  USING (true);

-- Policies for locations (admin only)
CREATE POLICY "Allow authenticated users to read locations" 
  ON locations FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin users to insert locations" 
  ON locations FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

CREATE POLICY "Allow admin users to update locations" 
  ON locations FOR UPDATE 
  TO authenticated 
  USING (true);

CREATE POLICY "Allow admin users to delete locations" 
  ON locations FOR DELETE 
  TO authenticated 
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_organisations_updated_at ON organisations;
CREATE TRIGGER update_organisations_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
CREATE TRIGGER update_locations_updated_at
  BEFORE UPDATE ON locations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
