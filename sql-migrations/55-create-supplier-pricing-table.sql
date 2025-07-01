-- Migration: Create supplier_pricing table
-- Description: Creates a table to store product pricing information from suppliers
-- This will link products, suppliers, and pricing data

BEGIN;

-- Create the supplier_pricing table
CREATE TABLE IF NOT EXISTS supplier_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(15,6) NOT NULL, -- High precision for various currencies
  currency TEXT DEFAULT 'USD',
  unit_price BOOLEAN DEFAULT TRUE, -- If false, this is a total price not per unit
  quantity DECIMAL(15,3) DEFAULT 1, -- For bulk pricing
  unit TEXT, -- Can override product unit if different
  valid_from DATE,
  valid_to DATE,
  source_document_id UUID REFERENCES supplier_documents(id), -- Link to the source invoice/document
  notes TEXT, -- Additional pricing information
  metadata JSONB DEFAULT '{}'::jsonb, -- For additional flexible attributes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indices for faster querying
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_user_id ON supplier_pricing(user_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_supplier_id ON supplier_pricing(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_product_id ON supplier_pricing(product_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_source_document_id ON supplier_pricing(source_document_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_valid_date_range ON supplier_pricing(valid_from, valid_to);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_supplier_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_supplier_pricing_updated_at
BEFORE UPDATE ON supplier_pricing
FOR EACH ROW
EXECUTE FUNCTION update_supplier_pricing_updated_at();

-- Enable Row Level Security
ALTER TABLE supplier_pricing ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
CREATE POLICY supplier_pricing_select_policy 
  ON supplier_pricing 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY supplier_pricing_insert_policy 
  ON supplier_pricing 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY supplier_pricing_update_policy 
  ON supplier_pricing 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY supplier_pricing_delete_policy 
  ON supplier_pricing 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create a view that joins supplier_pricing with products and suppliers for easy querying
CREATE OR REPLACE VIEW supplier_product_pricing AS
SELECT 
  sp.id as pricing_id,
  sp.user_id,
  s.id as supplier_id, 
  s.name as supplier_name,
  p.id as product_id,
  p.name as product_name,
  p.sku,
  p.category,
  sp.price,
  sp.currency,
  sp.unit_price,
  sp.quantity,
  COALESCE(sp.unit, p.unit) as unit,
  sp.valid_from,
  sp.valid_to,
  sp.source_document_id,
  sp.notes,
  sp.created_at,
  sp.updated_at
FROM 
  supplier_pricing sp
JOIN 
  suppliers s ON sp.supplier_id = s.id
JOIN 
  products p ON sp.product_id = p.id;

-- Note: The view will automatically inherit RLS policies from the underlying tables

COMMIT;
