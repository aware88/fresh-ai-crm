-- Migration: 20250709_security_fixes
-- Description: Fix security issues identified by Supabase Security Advisor
-- 1. Change views from SECURITY DEFINER to SECURITY INVOKER
-- 2. Enable RLS on tables that don't have it
-- 3. Create appropriate RLS policies

-- ============================================================
-- PART 1: Change views from SECURITY DEFINER to SECURITY INVOKER
-- ============================================================

-- Fix supplier_product_pricing view
ALTER VIEW public.supplier_product_pricing SET (security_invoker = true);

-- Fix enriched_contacts view
ALTER VIEW public.enriched_contacts SET (security_invoker = true);

-- Fix supplier_documents_pending_review view
ALTER VIEW public.supplier_documents_pending_review SET (security_invoker = true);

-- ============================================================
-- PART 2: Enable RLS on tables that don't have it
-- ============================================================

-- Enable RLS on emails table
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;

-- Enable RLS on organization_users table
ALTER TABLE public.organization_users ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_agents table
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Enable RLS on ai_agent_activities table
ALTER TABLE public.ai_agent_activities ENABLE ROW LEVEL SECURITY;

-- Enable RLS on agents table
ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PART 3: Create appropriate RLS policies
-- ============================================================

-- Check if emails table has user_id column, if not add it
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'emails' AND column_name = 'user_id') THEN
    -- Add user_id column if it doesn't exist
    ALTER TABLE public.emails ADD COLUMN user_id UUID REFERENCES auth.users(id);
    
    -- Update existing rows to set user_id = created_by if created_by exists
    BEGIN
      UPDATE public.emails SET user_id = created_by WHERE created_by IS NOT NULL;
    EXCEPTION WHEN undefined_column THEN
      -- created_by doesn't exist, do nothing
    END;
  END IF;
END
$$;

-- RLS policy for emails table using user_id - check if policies exist first
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can view their own emails') THEN
    EXECUTE 'CREATE POLICY "Users can view their own emails" ON public.emails FOR SELECT USING (user_id = auth.uid())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can insert their own emails') THEN
    EXECUTE 'CREATE POLICY "Users can insert their own emails" ON public.emails FOR INSERT WITH CHECK (user_id = auth.uid())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can update their own emails') THEN
    EXECUTE 'CREATE POLICY "Users can update their own emails" ON public.emails FOR UPDATE USING (user_id = auth.uid())';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'emails' AND policyname = 'Users can delete their own emails') THEN
    EXECUTE 'CREATE POLICY "Users can delete their own emails" ON public.emails FOR DELETE USING (user_id = auth.uid())';
  END IF;
END
$$;

-- RLS policy for organization_users table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'Users can view organization_users in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can view organization_users in their organizations" 
    ON public.organization_users FOR SELECT
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'Users can insert organization_users in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can insert organization_users in their organizations" 
    ON public.organization_users FOR INSERT
    WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'Users can update organization_users in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can update organization_users in their organizations" 
    ON public.organization_users FOR UPDATE
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'organization_users' AND policyname = 'Users can delete organization_users in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can delete organization_users in their organizations" 
    ON public.organization_users FOR DELETE
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
END
$$;

-- RLS policy for ai_agents table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Users can view ai_agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can view ai_agents in their organizations" 
    ON public.ai_agents FOR SELECT
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Users can insert ai_agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can insert ai_agents in their organizations" 
    ON public.ai_agents FOR INSERT
    WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Users can update ai_agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can update ai_agents in their organizations" 
    ON public.ai_agents FOR UPDATE
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agents' AND policyname = 'Users can delete ai_agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can delete ai_agents in their organizations" 
    ON public.ai_agents FOR DELETE
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
END
$$;

-- RLS policy for ai_agent_activities table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agent_activities' AND policyname = 'Users can view ai_agent_activities in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can view ai_agent_activities in their organizations" 
    ON public.ai_agent_activities FOR SELECT
    USING (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ai_agent_activities' AND policyname = 'Users can insert ai_agent_activities in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can insert ai_agent_activities in their organizations" 
    ON public.ai_agent_activities FOR INSERT
    WITH CHECK (
      organization_id IN (
        SELECT organization_id FROM organization_users
        WHERE user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
END
$$;

-- RLS policy for agents table
DO $$
BEGIN
  -- Check if policy exists before creating
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can view agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can view agents in their organizations" 
    ON public.agents FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_users.organization_id = agents.organization_id
        AND organization_users.user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can insert agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can insert agents in their organizations" 
    ON public.agents FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_users.organization_id = agents.organization_id
        AND organization_users.user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can update agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can update agents in their organizations" 
    ON public.agents FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_users.organization_id = agents.organization_id
        AND organization_users.user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agents' AND policyname = 'Users can delete agents in their organizations') THEN
    EXECUTE $POLICY$
    CREATE POLICY "Users can delete agents in their organizations" 
    ON public.agents FOR DELETE
    USING (
      EXISTS (
        SELECT 1 FROM organization_users
        WHERE organization_users.organization_id = agents.organization_id
        AND organization_users.user_id = auth.uid()
      )
    )
    $POLICY$;
  END IF;
END
$$;

-- ============================================================
-- PART 4: Fix function search path mutable warnings
-- ============================================================

-- This dynamic SQL will fix all functions with mutable search paths
-- by setting their search_path to 'public'
DO $$
DECLARE
  func_record RECORD;
  alter_statement TEXT;
BEGIN
  -- Get all functions in the public schema
  FOR func_record IN 
    SELECT n.nspname AS schema_name, p.proname AS function_name, 
           pg_get_function_identity_arguments(p.oid) AS function_args
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public'
  LOOP
    -- Generate ALTER FUNCTION statement to set search_path
    alter_statement := format('ALTER FUNCTION %I.%I(%s) SET search_path = public', 
                             func_record.schema_name, 
                             func_record.function_name,
                             func_record.function_args);
    
    -- Execute the ALTER FUNCTION statement
    BEGIN
      EXECUTE alter_statement;
      RAISE NOTICE 'Fixed search_path for function: %.%(%)', 
                  func_record.schema_name, 
                  func_record.function_name,
                  func_record.function_args;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Failed to fix search_path for function: %.%(%): %', 
                  func_record.schema_name, 
                  func_record.function_name,
                  func_record.function_args,
                  SQLERRM;
    END;
  END LOOP;
END;
$$;
