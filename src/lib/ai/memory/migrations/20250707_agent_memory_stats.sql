-- Migration: Agent Memory Statistics
-- Creates functions for retrieving agent memory statistics

-- First, check if required tables exist, if not create basic versions
DO $$
BEGIN
  -- Check for ai_memory_contexts table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_memory_contexts') THEN
    -- Check if vector extension is available
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector' AND installed_version IS NOT NULL) THEN
      CREATE TABLE ai_memory_contexts (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        query TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::JSONB
      );
      
      -- Add RLS policy
      ALTER TABLE ai_memory_contexts ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY ai_memory_contexts_isolation_policy ON ai_memory_contexts
        USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);
      
      -- Add comment that this is a placeholder
      COMMENT ON TABLE ai_memory_contexts IS 'Placeholder ai_memory_contexts table created by memory migration';
    ELSE
      RAISE NOTICE 'Vector extension not available. Skipping ai_memory_contexts table creation.';
    END IF;
  END IF;

  -- Check for ai_memories table
  IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'ai_memories') THEN
    -- Check if vector extension is available
    IF EXISTS (SELECT 1 FROM pg_available_extensions WHERE name = 'vector' AND installed_version IS NOT NULL) THEN
      CREATE TABLE ai_memories (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        organization_id UUID NOT NULL,
        memory_type TEXT NOT NULL,
        content TEXT NOT NULL,
        embedding VECTOR(1536),
        importance_score FLOAT DEFAULT 0.5,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::JSONB
      );
      
      -- Add RLS policy
      ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY ai_memories_isolation_policy ON ai_memories
        USING (organization_id = (auth.jwt() ->> 'org_id')::UUID);
      
      -- Add comment that this is a placeholder
      COMMENT ON TABLE ai_memories IS 'Placeholder ai_memories table created by memory migration';
      
      -- Create index on metadata for common queries
      CREATE INDEX IF NOT EXISTS idx_ai_memories_metadata_agent_id ON ai_memories USING GIN ((metadata -> 'agent_id'));
      CREATE INDEX IF NOT EXISTS idx_ai_memories_metadata_contact_id ON ai_memories USING GIN ((metadata -> 'contact_id'));
    ELSE
      RAISE NOTICE 'Vector extension not available. Skipping ai_memories table creation.';
    END IF;
  END IF;
END
$$;

-- Create function to get agent memory statistics
CREATE OR REPLACE FUNCTION get_agent_memory_stats(
  p_agent_id UUID,
  p_organization_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  memory_types JSON;
  memory_usage JSON;
  memory_feedback JSON;
  total_memories INTEGER;
BEGIN
  -- Get total memories for this agent
  SELECT COUNT(*)
  INTO total_memories
  FROM ai_memories am
  WHERE am.metadata->>'agent_id' = p_agent_id::TEXT
    AND am.organization_id = p_organization_id
    AND am.created_at >= NOW() - (p_days || ' days')::INTERVAL;

  -- Get memory types breakdown
  SELECT json_agg(row_to_json(r))
  INTO memory_types
  FROM (
    SELECT 
      memory_type,
      COUNT(*) as count
    FROM ai_memories am
    WHERE am.metadata->>'agent_id' = p_agent_id::TEXT
      AND am.organization_id = p_organization_id
      AND am.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY memory_type
    ORDER BY count DESC
  ) r;

  -- Get memory usage over time
  SELECT json_agg(row_to_json(r))
  INTO memory_usage
  FROM (
    SELECT 
      DATE_TRUNC('day', created_at)::DATE as date,
      COUNT(*) as count
    FROM ai_memories am
    WHERE am.metadata->>'agent_id' = p_agent_id::TEXT
      AND am.organization_id = p_organization_id
      AND am.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY DATE_TRUNC('day', created_at)::DATE
    ORDER BY date ASC
  ) r;

  -- Get memory feedback metrics
  SELECT json_build_object(
    'average_relevance', COALESCE(AVG(memory_context_relevance), 0),
    'average_usefulness', COALESCE(AVG(memory_context_usefulness), 0)
  )
  INTO memory_feedback
  FROM agent_interactions ai
  WHERE ai.agent_id = p_agent_id
    AND ai.organization_id = p_organization_id
    AND ai.created_at >= NOW() - (p_days || ' days')::INTERVAL
    AND ai.memory_context_id IS NOT NULL;

  -- Build the final result
  result := json_build_object(
    'total_memories', total_memories,
    'memory_types', COALESCE(memory_types, '[]'::JSON),
    'memory_usage', COALESCE(memory_usage, '[]'::JSON),
    'memory_feedback', COALESCE(memory_feedback, '{}'::JSON)
  );

  RETURN result;
END;
$$;

-- Create function to get memory insights for a specific contact
CREATE OR REPLACE FUNCTION get_contact_memory_insights(
  p_contact_id UUID,
  p_organization_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  memory_type TEXT,
  content TEXT,
  importance_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    am.id,
    am.memory_type,
    am.content,
    am.importance_score,
    am.created_at,
    am.metadata
  FROM ai_memories am
  WHERE am.metadata->>'contact_id' = p_contact_id::TEXT
    AND am.organization_id = p_organization_id
    AND am.memory_type IN ('preference', 'feedback', 'insight')
  ORDER BY am.importance_score DESC, am.created_at DESC
  LIMIT p_limit;
END;
$$;

-- Create index on agent_id in ai_memories metadata
CREATE INDEX IF NOT EXISTS idx_ai_memories_agent_id
  ON ai_memories ((metadata->>'agent_id'));

-- Create index on contact_id in ai_memories metadata
CREATE INDEX IF NOT EXISTS idx_ai_memories_contact_id
  ON ai_memories ((metadata->>'contact_id'));

-- Add comment
COMMENT ON FUNCTION get_agent_memory_stats IS 'Returns memory statistics for a specific sales agent';
COMMENT ON FUNCTION get_contact_memory_insights IS 'Returns key memory insights for a specific contact';
