-- Create inventory_alerts table
CREATE TABLE IF NOT EXISTS public.inventory_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    threshold_quantity NUMERIC(10, 2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT inventory_alerts_product_user_key UNIQUE (product_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own alerts"
    ON public.inventory_alerts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own alerts"
    ON public.inventory_alerts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alerts"
    ON public.inventory_alerts
    FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alerts"
    ON public.inventory_alerts
    FOR DELETE
    USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_user_product 
    ON public.inventory_alerts(user_id, product_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inventory_alerts_updated_at
BEFORE UPDATE ON public.inventory_alerts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
