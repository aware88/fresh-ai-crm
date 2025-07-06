-- Migration for AI Memory & Context Management (Phase 4)
-- This migration adds tables and functions for memory context management,
-- memory summarization, and context optimization.

-- Create ai_agents table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  settings JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for memory contexts
CREATE TABLE IF NOT EXISTS ai_memory_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  conversation_id UUID,
  query TEXT NOT NULL,
  token_count INTEGER NOT NULL DEFAULT 0,
  memory_count INTEGER NOT NULL DEFAULT 0,
  context_utilization FLOAT NOT NULL DEFAULT 0,
  truncated BOOLEAN NOT NULL DEFAULT FALSE,
  relevance_score FLOAT,
  usefulness_score FLOAT,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Create table for memory context items
CREATE TABLE IF NOT EXISTS ai_memory_context_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_id UUID NOT NULL REFERENCES ai_memory_contexts(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create table for scheduled memory jobs
CREATE TABLE IF NOT EXISTS ai_scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  interval_hours INTEGER NOT NULL,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ,
  config JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create a function to update next_run
CREATE OR REPLACE FUNCTION update_next_run()
RETURNS TRIGGER AS $$
BEGIN
  NEW.next_run := COALESCE(NEW.last_run, NEW.created_at) + (NEW.interval_hours || ' hours')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update next_run on insert or update
CREATE TRIGGER set_next_run
  BEFORE INSERT OR UPDATE ON ai_scheduled_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_next_run();

-- Create ai_agent_activities table if it doesn't exist
CREATE TABLE IF NOT EXISTS ai_agent_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID REFERENCES ai_agents(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  activity_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add memory_context_id to ai_agent_activities
ALTER TABLE ai_agent_activities
ADD COLUMN IF NOT EXISTS memory_context_id UUID REFERENCES ai_memory_contexts(id) ON DELETE SET NULL;

-- Add is_summary and summarized_at to ai_memories
ALTER TABLE ai_memories
ADD COLUMN IF NOT EXISTS is_summary BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS summarized_at TIMESTAMPTZ;

-- Add summarizes relationship type to ai_memory_relationship_types enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_memory_relationship_type') THEN
    CREATE TYPE ai_memory_relationship_type AS ENUM (
      'caused', 'related_to', 'contradicts', 'supports', 'follows', 'precedes', 'summarizes'
    );
  ELSE
    -- Check if 'summarizes' value exists in the enum
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'ai_memory_relationship_type')
      AND enumlabel = 'summarizes'
    ) THEN
      -- Add 'summarizes' to the enum
      ALTER TYPE ai_memory_relationship_type ADD VALUE 'summarizes';
    END IF;
  END IF;
END$$;

-- Create index for faster context retrieval
CREATE INDEX IF NOT EXISTS idx_ai_memory_contexts_organization_id ON ai_memory_contexts(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_contexts_user_id ON ai_memory_contexts(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_contexts_agent_id ON ai_memory_contexts(agent_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_contexts_conversation_id ON ai_memory_contexts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_contexts_expires_at ON ai_memory_contexts(expires_at);

-- Create index for faster context item retrieval
CREATE INDEX IF NOT EXISTS idx_ai_memory_context_items_context_id ON ai_memory_context_items(context_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_context_items_memory_id ON ai_memory_context_items(memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_context_items_organization_id ON ai_memory_context_items(organization_id);

-- Create index for scheduled jobs
CREATE INDEX IF NOT EXISTS idx_ai_scheduled_jobs_organization_id ON ai_scheduled_jobs(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_scheduled_jobs_job_type ON ai_scheduled_jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_ai_scheduled_jobs_next_run ON ai_scheduled_jobs(next_run);
CREATE INDEX IF NOT EXISTS idx_ai_scheduled_jobs_status ON ai_scheduled_jobs(status);

-- Function to get due jobs
CREATE OR REPLACE FUNCTION get_due_memory_jobs(job_type_param TEXT)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  job_type TEXT,
  config JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT j.id, j.organization_id, j.job_type, j.config
  FROM ai_scheduled_jobs j
  WHERE j.job_type = job_type_param
  AND j.status = 'active'
  AND (j.last_run IS NULL OR j.next_run <= NOW());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update job last run time
CREATE OR REPLACE FUNCTION update_memory_job_last_run(job_id_param UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE ai_scheduled_jobs
  SET last_run = NOW(), updated_at = NOW()
  WHERE id = job_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired contexts
CREATE OR REPLACE FUNCTION cleanup_expired_memory_contexts()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_memory_contexts
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies

-- Memory contexts RLS
ALTER TABLE ai_memory_contexts ENABLE ROW LEVEL SECURITY;

-- Create function to check if user belongs to organization
CREATE OR REPLACE FUNCTION user_belongs_to_org(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND organization_id = org_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin of organization
CREATE OR REPLACE FUNCTION user_is_org_admin(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM organization_users
    WHERE user_id = auth.uid()
    AND organization_id = org_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY memory_contexts_org_isolation ON ai_memory_contexts
  FOR ALL
  USING (user_belongs_to_org(organization_id));

CREATE POLICY memory_contexts_user_select ON ai_memory_contexts
  FOR SELECT
  USING (
    user_belongs_to_org(organization_id) AND
    (user_id IS NULL OR user_id = auth.uid())
  );

-- Memory context items RLS
ALTER TABLE ai_memory_context_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY memory_context_items_org_isolation ON ai_memory_context_items
  FOR ALL
  USING (user_belongs_to_org(organization_id));

-- Scheduled jobs RLS
ALTER TABLE ai_scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_jobs_org_isolation ON ai_scheduled_jobs
  FOR ALL
  USING (user_belongs_to_org(organization_id));

CREATE POLICY scheduled_jobs_admin_select ON ai_scheduled_jobs
  FOR SELECT
  USING (
    user_belongs_to_org(organization_id) AND
    user_is_org_admin(organization_id)
  );

-- Add memory context features to subscription plans
UPDATE subscription_plans
SET features = features || jsonb_build_object(
  'maxContextSize', CASE
    WHEN name = 'Free' THEN 2000
    WHEN name = 'Starter' THEN 4000
    WHEN name = 'Pro' THEN 8000
    WHEN name = 'Business' THEN 16000
    WHEN name = 'Enterprise' THEN 32000
    ELSE 4000
  END,
  'enableMemoryCompression', CASE
    WHEN name IN ('Free', 'Starter') THEN false
    ELSE true
  END,
  'enableLongTermMemory', CASE
    WHEN name = 'Free' THEN false
    ELSE true
  END,
  'maxMemoriesPerSummary', CASE
    WHEN name = 'Free' THEN 5
    WHEN name = 'Starter' THEN 10
    WHEN name = 'Pro' THEN 20
    WHEN name = 'Business' THEN 50
    WHEN name = 'Enterprise' THEN 100
    ELSE 10
  END
)
WHERE name IN ('Free', 'Starter', 'Pro', 'Business', 'Enterprise');
