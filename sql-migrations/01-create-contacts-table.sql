-- Migration: Fix contacts table data and ensure proper mapping
-- This script ensures our application can work with the existing database schema
-- Run this in your Supabase SQL Editor

-- IMPORTANT: We've identified that the contacts table uses lowercase column names
-- (firstname, lastname, email, createdat, etc.) and requires an explicit ID value

-- First, create a function to generate UUIDs as text
-- This will help us generate IDs for new contacts
CREATE OR REPLACE FUNCTION generate_uuid_as_text()
RETURNS TEXT AS $$
BEGIN
    RETURN gen_random_uuid()::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Let's check for any null IDs in the contacts table and fix them
UPDATE contacts SET id = generate_uuid_as_text() WHERE id IS NULL;

-- Verify that all required columns exist
DO $$ 
BEGIN
    -- Check if the table has the expected columns
    -- If any critical column is missing, add it
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'firstname') THEN
        ALTER TABLE contacts ADD COLUMN firstname VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lastname') THEN
        ALTER TABLE contacts ADD COLUMN lastname VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'email') THEN
        ALTER TABLE contacts ADD COLUMN email VARCHAR(255) UNIQUE NOT NULL DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'phone') THEN
        ALTER TABLE contacts ADD COLUMN phone VARCHAR(50) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'company') THEN
        ALTER TABLE contacts ADD COLUMN company VARCHAR(255) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'position') THEN
        ALTER TABLE contacts ADD COLUMN position VARCHAR(255) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'notes') THEN
        ALTER TABLE contacts ADD COLUMN notes TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'personalitytype') THEN
        ALTER TABLE contacts ADD COLUMN personalitytype VARCHAR(100) DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'personalitynotes') THEN
        ALTER TABLE contacts ADD COLUMN personalitynotes TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'status') THEN
        ALTER TABLE contacts ADD COLUMN status VARCHAR(50) DEFAULT 'active';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'createdat') THEN
        ALTER TABLE contacts ADD COLUMN createdat TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'updatedat') THEN
        ALTER TABLE contacts ADD COLUMN updatedat TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'contacts' AND column_name = 'lastcontact') THEN
        ALTER TABLE contacts ADD COLUMN lastcontact TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
END $$;

-- Create indexes for better performance (if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_email') THEN
        CREATE INDEX idx_contacts_email ON contacts(email);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_company') THEN
        CREATE INDEX idx_contacts_company ON contacts(company);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_status') THEN
        CREATE INDEX idx_contacts_status ON contacts(status);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_contacts_createdat') THEN
        CREATE INDEX idx_contacts_createdat ON contacts(createdat);
    END IF;
END $$;

-- Create a trigger to automatically update the updatedat column
CREATE OR REPLACE FUNCTION update_updatedat_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updatedat = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the trigger if it exists, then recreate it
DROP TRIGGER IF EXISTS update_contacts_updatedat ON contacts;
CREATE TRIGGER update_contacts_updatedat 
    BEFORE UPDATE ON contacts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updatedat_column();
    
-- Insert sample data only if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM contacts LIMIT 1) THEN
        INSERT INTO contacts (id, firstname, lastname, email, phone, company, position, notes, personalitytype, status)
        VALUES
        (generate_uuid_as_text(), 'John', 'Doe', 'john.doe@example.com', '555-1234', 'Acme Inc', 'CEO', 'Key decision maker', 'Analytical', 'active'),
        (generate_uuid_as_text(), 'Jane', 'Smith', 'jane.smith@example.com', '555-5678', 'Tech Solutions', 'CTO', 'Technical background', 'Driver', 'active'),
        (generate_uuid_as_text(), 'Michael', 'Johnson', 'michael.j@example.com', '555-9012', 'Global Corp', 'Sales Director', 'Prefers phone calls over emails', 'Expressive', 'active');
    END IF;
END $$;

-- Verify the table structure and data
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'contacts' 
ORDER BY ordinal_position;

-- Check sample data
SELECT id, firstname, lastname, email, createdat, updatedat 
FROM contacts 
ORDER BY createdat DESC 
LIMIT 5;

-- Verify the table was created correctly
SELECT * FROM contacts LIMIT 5;
