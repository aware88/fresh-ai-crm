-- Migration: Create Subscription System Tables
-- Description: Creates tables for subscription plans, organization subscriptions, and invoices

BEGIN;

-- Create subscription_plans table
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    billing_interval VARCHAR(20) NOT NULL, -- 'monthly', 'yearly', etc.
    features JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_plans table: %', SQLERRM;
END $$;

-- Create organization_subscriptions table
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    subscription_plan_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'active', 'canceled', 'past_due', etc.
    current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    payment_method_id VARCHAR(255),
    subscription_provider VARCHAR(50), -- 'stripe', 'paypal', etc.
    provider_subscription_id VARCHAR(255),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Add foreign key constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'organization_subscriptions_organization_id_fkey'
  ) THEN
    ALTER TABLE organization_subscriptions 
    ADD CONSTRAINT organization_subscriptions_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'organization_subscriptions_subscription_plan_id_fkey'
  ) THEN
    ALTER TABLE organization_subscriptions 
    ADD CONSTRAINT organization_subscriptions_subscription_plan_id_fkey 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organization_subscriptions table: %', SQLERRM;
END $$;

-- Create subscription_invoices table
DO $$
BEGIN
  CREATE TABLE IF NOT EXISTS subscription_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    subscription_id UUID NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'paid', 'unpaid', 'void', etc.
    due_date TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    invoice_url VARCHAR(255),
    invoice_pdf VARCHAR(255),
    provider_invoice_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Add foreign key constraints if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscription_invoices_organization_id_fkey'
  ) THEN
    ALTER TABLE subscription_invoices 
    ADD CONSTRAINT subscription_invoices_organization_id_fkey 
    FOREIGN KEY (organization_id) REFERENCES organizations(id);
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'subscription_invoices_subscription_id_fkey'
  ) THEN
    ALTER TABLE subscription_invoices 
    ADD CONSTRAINT subscription_invoices_subscription_id_fkey 
    FOREIGN KEY (subscription_id) REFERENCES organization_subscriptions(id);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_invoices table: %', SQLERRM;
END $$;

-- Add indexes for faster lookups
DO $$
BEGIN
  -- Indexes for organization_subscriptions
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_subscriptions' AND column_name = 'organization_id') THEN
    CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_organization_id ON organization_subscriptions(organization_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_subscriptions' AND column_name = 'subscription_plan_id') THEN
    CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_subscription_plan_id ON organization_subscriptions(subscription_plan_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organization_subscriptions' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_organization_subscriptions_status ON organization_subscriptions(status);
  END IF;
  
  -- Indexes for subscription_invoices
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_invoices' AND column_name = 'organization_id') THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_invoices_organization_id ON subscription_invoices(organization_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_invoices' AND column_name = 'subscription_id') THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subscription_invoices' AND column_name = 'status') THEN
    CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON subscription_invoices(status);
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating indexes for subscription tables: %', SQLERRM;
END $$;

-- Add RLS policies

-- Enable RLS on subscription_plans
DO $$
BEGIN
  ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error enabling RLS on subscription_plans: %', SQLERRM;
END $$;

-- Enable RLS on organization_subscriptions
DO $$
BEGIN
  ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error enabling RLS on organization_subscriptions: %', SQLERRM;
END $$;

-- Enable RLS on subscription_invoices
DO $$
BEGIN
  ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error enabling RLS on subscription_invoices: %', SQLERRM;
END $$;

-- Policy: Everyone can view subscription plans
DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_plans_select_policy ON subscription_plans;
  CREATE POLICY subscription_plans_select_policy ON subscription_plans
    FOR SELECT USING (true);
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_plans_select_policy: %', SQLERRM;
END $$;

-- Policy: Only admins can modify subscription plans
DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_plans_insert_policy ON subscription_plans;
  CREATE POLICY subscription_plans_insert_policy ON subscription_plans
    FOR INSERT WITH CHECK (auth.uid() IN (
      SELECT user_id FROM auth.users WHERE is_admin = true
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_plans_insert_policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_plans_update_policy ON subscription_plans;
  CREATE POLICY subscription_plans_update_policy ON subscription_plans
    FOR UPDATE USING (auth.uid() IN (
      SELECT user_id FROM auth.users WHERE is_admin = true
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_plans_update_policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_plans_delete_policy ON subscription_plans;
  CREATE POLICY subscription_plans_delete_policy ON subscription_plans
    FOR DELETE USING (auth.uid() IN (
      SELECT user_id FROM auth.users WHERE is_admin = true
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_plans_delete_policy: %', SQLERRM;
END $$;

-- Policy: Users can view subscriptions for their organizations
DO $$
BEGIN
  DROP POLICY IF EXISTS organization_subscriptions_select_policy ON organization_subscriptions;
  CREATE POLICY organization_subscriptions_select_policy ON organization_subscriptions
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organization_subscriptions_select_policy: %', SQLERRM;
END $$;

-- Policy: Only organization admins can modify subscriptions
DO $$
BEGIN
  DROP POLICY IF EXISTS organization_subscriptions_insert_policy ON organization_subscriptions;
  CREATE POLICY organization_subscriptions_insert_policy ON organization_subscriptions
    FOR INSERT WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organization_subscriptions_insert_policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS organization_subscriptions_update_policy ON organization_subscriptions;
  CREATE POLICY organization_subscriptions_update_policy ON organization_subscriptions
    FOR UPDATE USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organization_subscriptions_update_policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS organization_subscriptions_delete_policy ON organization_subscriptions;
  CREATE POLICY organization_subscriptions_delete_policy ON organization_subscriptions
    FOR DELETE USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating organization_subscriptions_delete_policy: %', SQLERRM;
END $$;

-- Policy: Users can view invoices for their organizations
DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_invoices_select_policy ON subscription_invoices;
  CREATE POLICY subscription_invoices_select_policy ON subscription_invoices
    FOR SELECT USING (
      organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_invoices_select_policy: %', SQLERRM;
END $$;

-- Policy: Only system processes can modify invoices
DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_invoices_insert_policy ON subscription_invoices;
  CREATE POLICY subscription_invoices_insert_policy ON subscription_invoices
    FOR INSERT WITH CHECK (auth.uid() IN (
      SELECT user_id FROM auth.users WHERE is_admin = true
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_invoices_insert_policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_invoices_update_policy ON subscription_invoices;
  CREATE POLICY subscription_invoices_update_policy ON subscription_invoices
    FOR UPDATE USING (auth.uid() IN (
      SELECT user_id FROM auth.users WHERE is_admin = true
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_invoices_update_policy: %', SQLERRM;
END $$;

DO $$
BEGIN
  DROP POLICY IF EXISTS subscription_invoices_delete_policy ON subscription_invoices;
  CREATE POLICY subscription_invoices_delete_policy ON subscription_invoices
    FOR DELETE USING (auth.uid() IN (
      SELECT user_id FROM auth.users WHERE is_admin = true
    ));
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating subscription_invoices_delete_policy: %', SQLERRM;
END $$;

-- Add comments
COMMENT ON TABLE subscription_plans IS 'Stores available subscription plans with pricing and features';
COMMENT ON TABLE organization_subscriptions IS 'Stores organization subscriptions to plans';
COMMENT ON TABLE subscription_invoices IS 'Stores subscription invoices for billing';

-- Create function to check if an organization has an active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(org_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_active BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organization_subscriptions
    WHERE organization_id = org_id
      AND status = 'active'
      AND current_period_end > NOW()
  ) INTO has_active;
  
  RETURN has_active;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if an organization has access to a specific feature
CREATE OR REPLACE FUNCTION has_feature_access(org_id UUID, feature_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM organization_subscriptions os
    JOIN subscription_plans sp ON os.subscription_plan_id = sp.id
    WHERE os.organization_id = org_id
      AND os.status = 'active'
      AND os.current_period_end > NOW()
      AND sp.features ? feature_name
      AND (sp.features ->> feature_name)::boolean = true
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
