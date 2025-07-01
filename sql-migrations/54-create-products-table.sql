-- Migration: Create products table
-- Description: Creates a table to store product information
-- This will be used to store product data extracted from documents

-- Enable RLS and create products table with user-based security
BEGIN;

-- Create the products table
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit TEXT, -- kg, each, liter, etc.
  metadata JSONB DEFAULT '{}'::jsonb, -- For additional flexible attributes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on user_id for faster filtering
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);

-- Create index on name for faster search
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);

-- Create index on SKU for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_sku ON products USING btree(sku);

-- Create index on category for filtering
CREATE INDEX IF NOT EXISTS idx_products_category ON products USING btree(category);

-- Add a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_products_updated_at();

-- Enable Row Level Security
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for Row Level Security
CREATE POLICY products_select_policy 
  ON products 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY products_insert_policy 
  ON products 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY products_update_policy 
  ON products 
  FOR UPDATE 
  USING (auth.uid() = user_id) 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY products_delete_policy 
  ON products 
  FOR DELETE 
  USING (auth.uid() = user_id);

COMMIT;
