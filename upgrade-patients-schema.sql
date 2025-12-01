-- Add organisation and location foreign keys to patients table
ALTER TABLE section21_patients 
ADD COLUMN organisation_id UUID REFERENCES organisations(id) ON DELETE SET NULL,
ADD COLUMN location_id UUID REFERENCES locations(id) ON DELETE SET NULL;

-- Add structured name fields
ALTER TABLE section21_patients
ADD COLUMN name_prefix TEXT,
ADD COLUMN first_name TEXT,
ADD COLUMN last_name TEXT;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_organisation_id ON section21_patients(organisation_id);
CREATE INDEX IF NOT EXISTS idx_patients_location_id ON section21_patients(location_id);

-- Update patient_full_name to be computed or we can keep it as is
-- We'll handle the display name in the application layer
