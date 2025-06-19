-- 37-add-full-name-to-contacts.sql
-- Adds a full_name column to contacts and back-fills existing rows
-- Run this in the Supabase SQL editor or include it in your CI migration pipeline.

-- 1. Add the column if it doesn’t exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'contacts' AND column_name = 'full_name'
    ) THEN
        ALTER TABLE contacts
        ADD COLUMN full_name TEXT;
    END IF;
END$$;

-- 2. Back-fill full_name for existing rows (first + last name)
UPDATE contacts
SET full_name =
    TRIM(BOTH ' ' FROM COALESCE(firstname, '') || ' ' || COALESCE(lastname, ''))
WHERE full_name IS NULL OR full_name = '';

-- 3. Ensure future inserts always have full_name (simple trigger)
CREATE OR REPLACE FUNCTION set_full_name()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.full_name IS NULL OR NEW.full_name = '' THEN
        NEW.full_name := TRIM(BOTH ' ' FROM COALESCE(NEW.firstname, '') || ' ' || COALESCE(NEW.lastname, ''));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS contacts_set_full_name ON contacts;
CREATE TRIGGER contacts_set_full_name
    BEFORE INSERT OR UPDATE ON contacts
    FOR EACH ROW EXECUTE FUNCTION set_full_name();
