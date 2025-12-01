-- Remove unique constraint from form_id column
-- form_id should not be unique since multiple locations can use the same form
-- table_id is the unique identifier

-- Drop the unique constraint on form_id
ALTER TABLE locations DROP CONSTRAINT IF EXISTS locations_form_id_key;

-- Clean up any test data
DELETE FROM locations;
DELETE FROM organisations;
