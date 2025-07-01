-- Enable uuid-ossp extension for UUID generation (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop the tables if they exist to avoid conflicts
DROP TABLE IF EXISTS public.supplier_query_results CASCADE;
DROP TABLE IF EXISTS public.supplier_queries CASCADE;

-- Create the supplier_queries table
CREATE TABLE public.supplier_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ai_response TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create the supplier_query_results table
CREATE TABLE public.supplier_query_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.supplier_queries(id) ON DELETE CASCADE,
    supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
    relevance_score NUMERIC DEFAULT 0,
    product_match TEXT,
    match_reason TEXT,
    product_matches JSONB DEFAULT '[]'::jsonb,
    price TEXT,
    document_references JSONB DEFAULT '[]'::jsonb,
    email_references JSONB DEFAULT '[]'::jsonb,
    suggested_email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the tables
ALTER TABLE public.supplier_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_query_results ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX idx_supplier_queries_created_by ON public.supplier_queries(created_by);
CREATE INDEX idx_supplier_query_results_query_id ON public.supplier_query_results(query_id);
CREATE INDEX idx_supplier_query_results_supplier_id ON public.supplier_query_results(supplier_id);

-- Create policies for supplier_queries
CREATE POLICY "Users can view their own supplier queries" 
ON public.supplier_queries 
FOR SELECT 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own supplier queries" 
ON public.supplier_queries 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own supplier queries" 
ON public.supplier_queries 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = created_by);

CREATE POLICY "Users can delete their own supplier queries" 
ON public.supplier_queries 
FOR DELETE 
TO authenticated 
USING (auth.uid() = created_by);

-- Create policies for supplier_query_results
-- These policies link to the parent query's ownership
CREATE POLICY "Users can view their own supplier query results" 
ON public.supplier_query_results 
FOR SELECT 
TO authenticated 
USING (
    query_id IN (
        SELECT id FROM public.supplier_queries WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can insert supplier query results for their queries" 
ON public.supplier_query_results 
FOR INSERT 
TO authenticated 
WITH CHECK (
    query_id IN (
        SELECT id FROM public.supplier_queries WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can update supplier query results for their queries" 
ON public.supplier_query_results 
FOR UPDATE 
TO authenticated 
USING (
    query_id IN (
        SELECT id FROM public.supplier_queries WHERE created_by = auth.uid()
    )
);

CREATE POLICY "Users can delete supplier query results for their queries" 
ON public.supplier_query_results 
FOR DELETE 
TO authenticated 
USING (
    query_id IN (
        SELECT id FROM public.supplier_queries WHERE created_by = auth.uid()
    )
);

-- Add comments for documentation
COMMENT ON TABLE public.supplier_queries IS 'Stores AI queries related to suppliers';
COMMENT ON TABLE public.supplier_query_results IS 'Stores results of AI queries related to suppliers';
COMMENT ON COLUMN public.supplier_query_results.relevance_score IS 'Score indicating relevance of result to query';
COMMENT ON COLUMN public.supplier_query_results.document_references IS 'References to relevant supplier documents';
COMMENT ON COLUMN public.supplier_query_results.email_references IS 'References to relevant supplier emails';
