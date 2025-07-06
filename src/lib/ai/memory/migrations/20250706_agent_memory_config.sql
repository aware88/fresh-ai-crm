-- Migration: Agent Memory Configuration
-- Creates tables and functions for sales agent memory integration

-- First, check if required tables exist, if not create basic versions
DO $$
BEGIN
  -- Check for organizations table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'organizations') THEN
    CREATE TABLE organizations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Add comment that this is a placeholder
    COMMENT ON TABLE organizations IS 'Placeholder organizations table created by memory migration';
  END IF;

  -- Check for agents table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'agents') THEN
    CREATE TABLE agents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL,
      organization_id UUID NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );
    
    -- Add comment that this is a placeholder
    COMMENT ON TABLE agents IS 'Placeholder agents table created by memory migration';
  END IF;
  
  -- Check for agent_interactions table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'agent_interactions') THEN
    CREATE TABLE agent_interactions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      agent_id UUID NOT NULL,
      contact_id UUID NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      organization_id UUID NOT NULL
    );
    
    -- Add comment that this is a placeholder
    COMMENT ON TABLE agent_interactions IS 'Placeholder agent_interactions table created by memory migration';
    
    -- Add RLS policy
    ALTER TABLE agent_interactions ENABLE ROW LEVEL SECURITY;
    
    CREATE POLICY agent_interactions_isolation_policy ON agent_interactions
      USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);
  END IF;
END
$$;

-- Create agent_memory_config table
CREATE TABLE IF NOT EXISTS agent_memory_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  enable_memory_creation BOOLEAN NOT NULL DEFAULT TRUE,
  enable_memory_retrieval BOOLEAN NOT NULL DEFAULT TRUE,
  max_memories_to_retrieve INTEGER NOT NULL DEFAULT 10,
  min_relevance_score FLOAT NOT NULL DEFAULT 0.7,
  memory_types TEXT[] NOT NULL DEFAULT '{"preference", "feedback", "interaction", "observation", "insight"}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  
  -- Foreign key to agents table
  CONSTRAINT fk_agent_memory_config_agent
    FOREIGN KEY (agent_id)
    REFERENCES agents (id)
    ON DELETE CASCADE,
    
  -- Foreign key to organizations table
  CONSTRAINT fk_agent_memory_config_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations (id)
    ON DELETE CASCADE,
    
  -- Unique constraint on agent_id and organization_id
  CONSTRAINT unique_agent_memory_config
    UNIQUE (agent_id, organization_id)
);

-- Add RLS policies
ALTER TABLE agent_memory_config ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view agent memory config for their organization
CREATE POLICY agent_memory_config_select_policy ON agent_memory_config
  FOR SELECT
  USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);

-- Policy: Users can insert agent memory config for their organization
CREATE POLICY agent_memory_config_insert_policy ON agent_memory_config
  FOR INSERT
  WITH CHECK (organization_id = (auth.jwt() ->> 'org_id')::UUID);

-- Policy: Users can update agent memory config for their organization
CREATE POLICY agent_memory_config_update_policy ON agent_memory_config
  FOR UPDATE
  USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);

-- Policy: Users can delete agent memory config for their organization
CREATE POLICY agent_memory_config_delete_policy ON agent_memory_config
  FOR DELETE
  USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);

-- Create function to get agent memory config
CREATE OR REPLACE FUNCTION get_agent_memory_config(
  p_agent_id UUID,
  p_organization_id UUID
)
RETURNS TABLE (
  id UUID,
  agent_id UUID,
  organization_id UUID,
  enable_memory_creation BOOLEAN,
  enable_memory_retrieval BOOLEAN,
  max_memories_to_retrieve INTEGER,
  min_relevance_score FLOAT,
  memory_types TEXT[],
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    amc.id,
    amc.agent_id,
    amc.organization_id,
    amc.enable_memory_creation,
    amc.enable_memory_retrieval,
    amc.max_memories_to_retrieve,
    amc.min_relevance_score,
    amc.memory_types,
    amc.created_at,
    amc.updated_at
  FROM agent_memory_config amc
  WHERE amc.agent_id = p_agent_id
    AND amc.organization_id = p_organization_id;
END;
$$;

-- Create index on agent_id and organization_id
CREATE INDEX IF NOT EXISTS idx_agent_memory_config_agent_org
  ON agent_memory_config (agent_id, organization_id);

-- Create index on organization_id
CREATE INDEX IF NOT EXISTS idx_agent_memory_config_org
  ON agent_memory_config (organization_id);

-- Add memory columns to agent_interactions table if it exists
DO $$
BEGIN
  -- First check if the table exists
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'agent_interactions') THEN
    -- Add columns if they don't exist
    ALTER TABLE agent_interactions
    ADD COLUMN IF NOT EXISTS memory_context_id UUID,
    ADD COLUMN IF NOT EXISTS memory_context_relevance FLOAT,
    ADD COLUMN IF NOT EXISTS memory_context_usefulness FLOAT,
    ADD COLUMN IF NOT EXISTS memories_created INTEGER DEFAULT 0;
    
    -- Check if ai_memory_contexts exists before adding the foreign key
    IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_memory_contexts') THEN
      -- Check if the constraint already exists
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'fk_agent_interactions_memory_context'
      ) THEN
        ALTER TABLE agent_interactions
        ADD CONSTRAINT fk_agent_interactions_memory_context
          FOREIGN KEY (memory_context_id)
          REFERENCES ai_memory_contexts (id)
          ON DELETE SET NULL;
      END IF;
    END IF;
    
    -- Create index if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM pg_indexes WHERE indexname = 'idx_agent_interactions_memory_context'
    ) THEN
      CREATE INDEX idx_agent_interactions_memory_context
        ON agent_interactions (memory_context_id);
    END IF;
  END IF;
END
$$;

-- Add comment
COMMENT ON TABLE agent_memory_config IS 'Stores configuration for agent memory integration';
