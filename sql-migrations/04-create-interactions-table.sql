-- Create interactions table
CREATE TABLE IF NOT EXISTS public.interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'email', 'call', 'meeting', 'note', etc.
    title VARCHAR(255) NOT NULL,
    content TEXT,
    interaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB
);

-- Enable RLS (Row Level Security)
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_interactions_contact_id ON public.interactions(contact_id);
CREATE INDEX idx_interactions_type ON public.interactions(type);
CREATE INDEX idx_interactions_date ON public.interactions(interaction_date);

-- Create policies
-- Allow authenticated users to view their own interactions
CREATE POLICY "Users can view their own interactions"
    ON public.interactions
    FOR SELECT
    USING (auth.uid() = created_by);

-- Allow users to create interactions
CREATE POLICY "Users can create interactions"
    ON public.interactions
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Allow users to update their own interactions
CREATE POLICY "Users can update their own interactions"
    ON public.interactions
    FOR UPDATE
    USING (auth.uid() = created_by);

-- Allow users to delete their own interactions
CREATE POLICY "Users can delete their own interactions"
    ON public.interactions
    FOR DELETE
    USING (auth.uid() = created_by);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_interactions_updated_at
    BEFORE UPDATE ON public.interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
