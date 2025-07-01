-- Enable uuid-ossp extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the table if it exists to avoid conflicts
DROP TABLE IF EXISTS public.suppliers CASCADE;

-- Create the suppliers table with all columns
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    website TEXT,
    reliability_score NUMERIC DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable RLS on the suppliers table
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_suppliers_email ON public.suppliers(email);
CREATE INDEX idx_suppliers_created_by ON public.suppliers(created_by);

-- Create policy to allow users to view their own suppliers
CREATE POLICY "Users can view their own suppliers" 
ON public.suppliers 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to insert their own suppliers
CREATE POLICY "Users can insert their own suppliers" 
ON public.suppliers 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

-- Create policy to allow users to update their own suppliers
CREATE POLICY "Users can update their own suppliers" 
ON public.suppliers 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policy to allow users to delete their own suppliers
CREATE POLICY "Users can delete their own suppliers" 
ON public.suppliers 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to update the updated_at column
CREATE TRIGGER update_suppliers_updated_at
    BEFORE UPDATE ON public.suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_suppliers_updated_at();

-- Add comments for documentation
COMMENT ON TABLE public.suppliers IS 'Stores supplier information';
COMMENT ON COLUMN public.suppliers.reliability_score IS 'Score from 0-100 indicating supplier reliability';
