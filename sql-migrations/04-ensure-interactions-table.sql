-- Migration: Ensure interactions table has the correct structure
-- This script ensures our application can work with the existing interactions table
-- Run this in your Supabase SQL Editor

-- First, check if the table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'interactions') THEN
        -- Create the table if it doesn't exist
        CREATE TABLE public.interactions (
            id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
            contact_id TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            content TEXT,
            interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            created_by TEXT,
            metadata JSONB,
            
            -- Add foreign key constraint
            CONSTRAINT fk_contact_id FOREIGN KEY (contact_id) 
                REFERENCES public.contacts(id) 
                ON DELETE CASCADE
        );
        
        -- Create indexes
        CREATE INDEX idx_interactions_contact_id ON public.interactions(contact_id);
        CREATE INDEX idx_interactions_type ON public.interactions(type);
        CREATE INDEX idx_interactions_date ON public.interactions(interaction_date);
        
        -- Add comments for documentation
        COMMENT ON TABLE public.interactions IS 'Stores all interactions with contacts';
        COMMENT ON COLUMN public.interactions.type IS 'Type of interaction (email, call, meeting, etc.)';
        COMMENT ON COLUMN public.interactions.metadata IS 'Additional metadata in JSON format';
    ELSE
        -- Table exists, ensure it has all required columns
        -- Add any missing columns with appropriate defaults
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'interactions' AND column_name = 'metadata') THEN
            ALTER TABLE public.interactions ADD COLUMN metadata JSONB;
        END IF;
        
        -- Ensure the foreign key constraint exists
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.table_constraints 
            WHERE table_name = 'interactions' 
            AND constraint_name = 'fk_contact_id'
        ) THEN
            -- First, make sure all contact_ids exist or set a default
            -- This is a safety check - you might need to adjust based on your data
            UPDATE public.interactions 
            SET contact_id = (SELECT id FROM public.contacts LIMIT 1)
            WHERE contact_id NOT IN (SELECT id FROM public.contacts) 
            AND contact_id IS NOT NULL;
            
            -- Now add the constraint
            ALTER TABLE public.interactions 
            ADD CONSTRAINT fk_contact_id 
            FOREIGN KEY (contact_id) 
            REFERENCES public.contacts(id) 
            ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

-- Create or replace the update_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_interactions_updated_at'
    ) THEN
        CREATE TRIGGER update_interactions_updated_at
            BEFORE UPDATE ON public.interactions
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;
