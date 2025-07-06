-- AI Memory System Database Schema

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Memory Table
-- Stores individual memory entries with vector embeddings for semantic search
CREATE TABLE ai_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  content_embedding VECTOR(1536), -- OpenAI embedding dimension
  metadata JSONB NOT NULL DEFAULT '{}',
  memory_type TEXT NOT NULL,
  importance_score FLOAT NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI Memory Relationships Table
-- Tracks relationships between memories for context building
CREATE TABLE ai_memory_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  source_memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  target_memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  strength FLOAT NOT NULL DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(source_memory_id, target_memory_id, relationship_type)
);

-- AI Memory Access Table
-- Tracks when and how memories are accessed, and the outcomes
CREATE TABLE ai_memory_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  memory_id UUID NOT NULL REFERENCES ai_memories(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  access_type TEXT NOT NULL,
  context TEXT,
  outcome TEXT,
  outcome_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_ai_memories_organization_id ON ai_memories(organization_id);
CREATE INDEX idx_ai_memories_user_id ON ai_memories(user_id);
CREATE INDEX idx_ai_memories_memory_type ON ai_memories(memory_type);
CREATE INDEX idx_ai_memories_created_at ON ai_memories(created_at);
CREATE INDEX idx_ai_memory_relationships_organization_id ON ai_memory_relationships(organization_id);
CREATE INDEX idx_ai_memory_relationships_source_memory_id ON ai_memory_relationships(source_memory_id);
CREATE INDEX idx_ai_memory_relationships_target_memory_id ON ai_memory_relationships(target_memory_id);
CREATE INDEX idx_ai_memory_access_organization_id ON ai_memory_access(organization_id);
CREATE INDEX idx_ai_memory_access_memory_id ON ai_memory_access(memory_id);
CREATE INDEX idx_ai_memory_access_user_id ON ai_memory_access(user_id);
CREATE INDEX idx_ai_memory_access_created_at ON ai_memory_access(created_at);

-- Create vector index for semantic search
CREATE INDEX idx_ai_memories_content_embedding ON ai_memories USING ivfflat (content_embedding vector_cosine_ops);

-- Row Level Security (RLS) Policies
-- Ensure multi-tenant isolation

-- AI Memories RLS
ALTER TABLE ai_memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_memories_organization_isolation ON ai_memories
  FOR ALL
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);

-- AI Memory Relationships RLS
ALTER TABLE ai_memory_relationships ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_memory_relationships_organization_isolation ON ai_memory_relationships
  FOR ALL
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);

-- AI Memory Access RLS
ALTER TABLE ai_memory_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_memory_access_organization_isolation ON ai_memory_access
  FOR ALL
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);
