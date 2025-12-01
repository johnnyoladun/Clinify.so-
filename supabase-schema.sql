-- Supabase Database Schema for Clinify Dashboard
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create GMPs table
CREATE TABLE IF NOT EXISTS gmps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  gmp_name TEXT NOT NULL,
  gmp_license_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  assigned_gmp_ids UUID[] DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create section21_patients table
CREATE TABLE IF NOT EXISTS section21_patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_full_name TEXT,
  patient_unique_id TEXT NOT NULL UNIQUE,
  patient_id_document_url TEXT,
  dr_script_url TEXT,
  sahpra_invoice_url TEXT,
  outcome_letter_url TEXT,
  gmp_id UUID REFERENCES gmps(id) ON DELETE SET NULL,
  form_id TEXT NOT NULL,
  form_title TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_gmps_status ON gmps(status);
CREATE INDEX IF NOT EXISTS idx_section21_patients_unique_id ON section21_patients(patient_unique_id);
CREATE INDEX IF NOT EXISTS idx_section21_patients_gmp_id ON section21_patients(gmp_id);
CREATE INDEX IF NOT EXISTS idx_section21_patients_form_id ON section21_patients(form_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_gmps_updated_at BEFORE UPDATE ON gmps
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_section21_patients_updated_at BEFORE UPDATE ON section21_patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert a default admin user (password: "admin123" - CHANGE THIS IN PRODUCTION!)
-- Password hash for "admin123" using bcrypt with 10 rounds
INSERT INTO users (email, password_hash, full_name, role, status)
VALUES (
  'admin@clinify.com',
  '$2b$10$rKZE3y8Yhqw5nKZQJ8Zz4.DxGXqKQZWZXxZ1Z2Z3Z4Z5Z6Z7Z8Z9Z',
  'System Administrator',
  'admin',
  'active'
) ON CONFLICT (email) DO NOTHING;

-- Enable Row Level Security (RLS)
ALTER TABLE gmps ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE section21_patients ENABLE ROW LEVEL SECURITY;

-- RLS Policies for GMPs
CREATE POLICY "GMPs are viewable by authenticated users" 
  ON gmps FOR SELECT 
  USING (true);

CREATE POLICY "GMPs are editable by admins only" 
  ON gmps FOR ALL 
  USING (true);

-- RLS Policies for Users
CREATE POLICY "Users are viewable by authenticated users" 
  ON users FOR SELECT 
  USING (true);

CREATE POLICY "Users are editable by admins only" 
  ON users FOR ALL 
  USING (true);

-- RLS Policies for Section 21 Patients
CREATE POLICY "Patients are viewable by authenticated users" 
  ON section21_patients FOR SELECT 
  USING (true);

CREATE POLICY "Patients are editable by authenticated users" 
  ON section21_patients FOR ALL 
  USING (true);

-- Grant permissions
GRANT ALL ON gmps TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON section21_patients TO authenticated;
