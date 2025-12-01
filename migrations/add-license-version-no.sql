-- Add license_version_no column to GMPs table
-- This will store the version number that gets appended to the GMP license number
-- Format: {gmp_license_number}.-.{license_version_no}
-- Example: 0000001473.-.2

ALTER TABLE gmps 
ADD COLUMN IF NOT EXISTS license_version_no TEXT;

-- Add comment to explain the field purpose
COMMENT ON COLUMN gmps.license_version_no IS 'Version number appended to GMP license number in format: {license_number}.-.{version_no}';
