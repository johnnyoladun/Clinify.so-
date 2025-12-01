-- Check and fix the GMPs table structure
-- Run this in your Supabase SQL Editor

-- First, check if the gmps table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'gmps') THEN
    -- Create GMPs table if it doesn't exist
    CREATE TABLE gmps (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      gmp_name TEXT NOT NULL,
      gmp_license_number TEXT NOT NULL UNIQUE,
      license_version_no TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    RAISE NOTICE 'Created gmps table';
  ELSE
    RAISE NOTICE 'gmps table already exists';
  END IF;
END $$;

-- Add license_version_no column if it doesn't exist
ALTER TABLE gmps 
ADD COLUMN IF NOT EXISTS license_version_no TEXT;

-- Ensure the table has proper permissions
GRANT ALL ON gmps TO authenticated;

-- Enable RLS if not already enabled
ALTER TABLE gmps ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "GMPs are viewable by authenticated users" ON gmps;
DROP POLICY IF EXISTS "GMPs are editable by authenticated users" ON gmps;

-- Create policies
CREATE POLICY "GMPs are viewable by authenticated users" 
  ON gmps FOR SELECT 
  USING (true);

CREATE POLICY "GMPs are editable by authenticated users" 
  ON gmps FOR ALL 
  USING (true);

-- Show current table structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'gmps' 
ORDER BY ordinal_position;
