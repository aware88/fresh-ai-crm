-- AI Memory System Schema (Phase 1)
-- First, enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- AI Memories Table
-- Stores AI memories with vector embeddings for semantic search
CREATE TABLE IF NOT EXISTS ai_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  memory_type TEXT NOT NULL,
  importance_score FLOAT NOT NULL DEFAULT 0.5 CHECK (importance_score >= 0 AND importance_score <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for ai_memories
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_memories_organization_isolation ON ai_memories
  USING (organization_id = auth.jwt() -> 'organization_id'::text::uuid);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS ai_memories_embedding_idx ON ai_memories
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_memories_org ON ai_memories(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_type ON ai_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_memories_user ON ai_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memories_importance ON ai_memories(importance_score);

-- AI Memory Relationships Table
-- Stores relationships between AI memories
CREATE TABLE IF NOT EXISTS ai_memory_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  target_memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength FLOAT NOT NULL DEFAULT 0.5 CHECK (strength >= 0 AND strength <= 1),
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(source_memory_id, target_memory_id, relationship_type)
);

-- Add RLS policy for ai_memory_relationships
ALTER TABLE ai_memory_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_memory_relationships_organization_isolation ON ai_memory_relationships
  USING (organization_id = auth.jwt() -> 'organization_id'::text::uuid);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_memory_relationships_org ON ai_memory_relationships(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_relationships_source ON ai_memory_relationships(source_memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_relationships_target ON ai_memory_relationships(target_memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_relationships_type ON ai_memory_relationships(relationship_type);

-- AI Memory Access Table
-- Tracks when and how AI memories are accessed
CREATE TABLE IF NOT EXISTS ai_memory_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL,
  context TEXT,
  outcome_recorded BOOLEAN NOT NULL DEFAULT FALSE,
  outcome_positive BOOLEAN,
  outcome_details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for ai_memory_access
ALTER TABLE ai_memory_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_memory_access_organization_isolation ON ai_memory_access
  USING (organization_id = auth.jwt() -> 'organization_id'::text::uuid);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_memory_access_org ON ai_memory_access(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_access_memory ON ai_memory_access(memory_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_access_user ON ai_memory_access(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_memory_access_outcome ON ai_memory_access(outcome_recorded);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_memories_timestamp
BEFORE UPDATE ON ai_memories
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_ai_memory_relationships_timestamp
BEFORE UPDATE ON ai_memory_relationships
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_ai_memory_access_timestamp
BEFORE UPDATE ON ai_memory_access
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
