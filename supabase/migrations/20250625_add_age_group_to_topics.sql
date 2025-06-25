-- Add age_group column to topics table safely
-- This migration is safe for production as it adds a nullable column with a default value

ALTER TABLE topics 
ADD COLUMN age_group TEXT DEFAULT NULL;

-- Add a comment to document the column
COMMENT ON COLUMN topics.age_group IS 'Age group classification: عمر من صفر لسنتين, سنتين ل 6 سنوات, 6-14 سنة';

-- Optional: Add a check constraint to ensure only valid values (uncomment if needed)
-- ALTER TABLE topics 
-- ADD CONSTRAINT topics_age_group_check 
-- CHECK (age_group IS NULL OR age_group IN ('عمر من صفر لسنتين', 'سنتين ل 6 سنوات', '6-14 سنة'));
