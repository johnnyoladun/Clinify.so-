-- Delete all patient records
DELETE FROM section21_patients;

-- Delete all locations
DELETE FROM locations;

-- Delete all organisations
DELETE FROM organisations;

-- Verify deletion
SELECT COUNT(*) as org_count FROM organisations;
SELECT COUNT(*) as location_count FROM locations;
SELECT COUNT(*) as patient_count FROM section21_patients;
