-- Add outcome_letter_uploaded_at field to track Section 21 document upload date
-- This field is used to calculate the 5-month expiry date for notifications

ALTER TABLE section21_patients 
ADD COLUMN IF NOT EXISTS outcome_letter_uploaded_at TIMESTAMP WITH TIME ZONE;

-- Add index for efficient expiry queries
CREATE INDEX IF NOT EXISTS idx_section21_patients_outcome_uploaded 
ON section21_patients(outcome_letter_uploaded_at) 
WHERE outcome_letter_url IS NOT NULL;

-- Backfill for existing records: use updated_at as best guess
-- Only for records that have an outcome letter but no upload date
UPDATE section21_patients 
SET outcome_letter_uploaded_at = updated_at 
WHERE outcome_letter_url IS NOT NULL 
  AND outcome_letter_uploaded_at IS NULL;

-- Add comment explaining the field
COMMENT ON COLUMN section21_patients.outcome_letter_uploaded_at IS 
  'Timestamp when Section 21 outcome letter was uploaded. Used to calculate 5-month expiry date for notifications.';
