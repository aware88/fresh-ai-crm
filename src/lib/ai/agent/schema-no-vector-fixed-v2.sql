-- Sales Agent Core Schema (Phase 2) - No Vector Extension Version
-- First, enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Agent Personalities Table
-- Stores personality profiles for sales agents
CREATE TABLE IF NOT EXISTS agent_personalities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  tone TEXT[] NOT NULL DEFAULT '{}',
  communication_style TEXT NOT NULL,
  empathy_level FLOAT NOT NULL CHECK (empathy_level >= 0 AND empathy_level <= 1),
  assertiveness_level FLOAT NOT NULL CHECK (assertiveness_level >= 0 AND assertiveness_level <= 1),
  formality_level FLOAT NOT NULL CHECK (formality_level >= 0 AND formality_level <= 1),
  humor_level FLOAT NOT NULL CHECK (humor_level >= 0 AND humor_level <= 1),
  expertise_areas TEXT[] NOT NULL DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for agent_personalities
ALTER TABLE agent_personalities ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY agent_personalities_organization_isolation ON agent_personalities
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Agent Configurations Table
-- Stores configuration settings for sales agents
CREATE TABLE IF NOT EXISTS agent_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  personality_id UUID NOT NULL REFERENCES agent_personalities(id),
  default_goals TEXT[] NOT NULL DEFAULT '{}',
  allowed_actions TEXT[] NOT NULL DEFAULT '{}',
  memory_access_level TEXT NOT NULL DEFAULT 'READ_ONLY',
  decision_confidence_threshold FLOAT NOT NULL DEFAULT 0.7 CHECK (decision_confidence_threshold >= 0 AND decision_confidence_threshold <= 1),
  max_message_length INTEGER NOT NULL DEFAULT 2000,
  response_time_target_ms INTEGER NOT NULL DEFAULT 5000,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for agent_configs
ALTER TABLE agent_configs ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY agent_configs_organization_isolation ON agent_configs
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Agent Memory Preferences Table
-- Stores memory-related preferences for each agent
CREATE TABLE IF NOT EXISTS agent_memory_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
  memory_types_to_create TEXT[] NOT NULL DEFAULT '{}',
  memory_types_to_access TEXT[] NOT NULL DEFAULT '{}',
  min_confidence_to_store FLOAT NOT NULL DEFAULT 0.6 CHECK (min_confidence_to_store >= 0 AND min_confidence_to_store <= 1),
  min_importance_to_access FLOAT NOT NULL DEFAULT 0.5 CHECK (min_importance_to_access >= 0 AND min_importance_to_access <= 1),
  max_memories_per_context INTEGER NOT NULL DEFAULT 10,
  recency_weight FLOAT NOT NULL DEFAULT 0.3 CHECK (recency_weight >= 0 AND recency_weight <= 1),
  relevance_weight FLOAT NOT NULL DEFAULT 0.5 CHECK (relevance_weight >= 0 AND relevance_weight <= 1),
  importance_weight FLOAT NOT NULL DEFAULT 0.2 CHECK (importance_weight >= 0 AND importance_weight <= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT weights_sum_to_one CHECK (ABS(recency_weight + relevance_weight + importance_weight - 1.0) < 0.001)
);

-- Add RLS policy for agent_memory_preferences
ALTER TABLE agent_memory_preferences ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY agent_memory_preferences_organization_isolation ON agent_memory_preferences
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Conversation Contexts Table
-- Stores the current state and context of conversations
CREATE TABLE IF NOT EXISTS conversation_contexts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  conversation_id UUID NOT NULL,  -- Changed from TEXT to UUID to match expected type
  current_goal TEXT,
  contact_history TEXT,
  recent_interactions TEXT[],
  relevant_memories TEXT[],
  conversation_state TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, conversation_id)
);

-- Add RLS policy for conversation_contexts
ALTER TABLE conversation_contexts ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY conversation_contexts_organization_isolation ON conversation_contexts
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Agent Decisions Table
-- Stores decisions made by agents during conversations
CREATE TABLE IF NOT EXISTS agent_decisions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,  -- Changed from TEXT to UUID to match
  decision_type TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  confidence_score FLOAT NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  selected_action TEXT NOT NULL,
  alternative_actions TEXT[],
  memory_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for agent_decisions
ALTER TABLE agent_decisions ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY agent_decisions_organization_isolation ON agent_decisions
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Agent Messages Table
-- Stores messages sent by agents
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agent_configs(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,  -- Changed from TEXT to UUID to match
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  sentiment TEXT,
  intent TEXT,
  decision_id UUID REFERENCES agent_decisions(id) ON DELETE SET NULL,
  memory_ids UUID[],
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for agent_messages
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY agent_messages_organization_isolation ON agent_messages
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Contact Messages Table
-- Stores messages sent by contacts
CREATE TABLE IF NOT EXISTS contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  conversation_id UUID NOT NULL,  -- Changed from TEXT to UUID to match
  content TEXT NOT NULL,
  sentiment TEXT,
  intent TEXT,
  memory_ids UUID[],
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add RLS policy for contact_messages
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY contact_messages_organization_isolation ON contact_messages
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Contact Personality Profiles Table
-- Stores personality profiles for contacts to help agents tailor their approach
CREATE TABLE IF NOT EXISTS contact_personality_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  communication_preferences TEXT[] NOT NULL DEFAULT '{}',
  personality_traits JSONB NOT NULL DEFAULT '{}',
  emotional_triggers TEXT[] NOT NULL DEFAULT '{}',
  buying_motivations TEXT[] NOT NULL DEFAULT '{}',
  objection_patterns TEXT[] NOT NULL DEFAULT '{}',
  confidence_score FLOAT NOT NULL DEFAULT 0.5 CHECK (confidence_score >= 0 AND confidence_score <= 1),
  last_updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, contact_id)
);

-- Add RLS policy for contact_personality_profiles
ALTER TABLE contact_personality_profiles ENABLE ROW LEVEL SECURITY;

-- Fixed RLS policy with proper casting
CREATE POLICY contact_personality_profiles_organization_isolation ON contact_personality_profiles
  USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_agent_personalities_org ON agent_personalities(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_org ON agent_configs(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_configs_personality ON agent_configs(personality_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_preferences_org ON agent_memory_preferences(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_preferences_agent ON agent_memory_preferences(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_org ON conversation_contexts(organization_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_agent ON conversation_contexts(agent_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_contact ON conversation_contexts(contact_id);
CREATE INDEX IF NOT EXISTS idx_conversation_contexts_conv_id ON conversation_contexts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_org ON agent_decisions(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_agent ON agent_decisions(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_decisions_conv_id ON agent_decisions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_org ON agent_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_agent ON agent_messages(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_contact ON agent_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_agent_messages_conv_id ON agent_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_org ON contact_messages(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_contact ON contact_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_conv_id ON contact_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_contact_personality_profiles_org ON contact_personality_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_contact_personality_profiles_contact ON contact_personality_profiles(contact_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_agent_personalities_timestamp
BEFORE UPDATE ON agent_personalities
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_agent_configs_timestamp
BEFORE UPDATE ON agent_configs
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_agent_memory_preferences_timestamp
BEFORE UPDATE ON agent_memory_preferences
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_conversation_contexts_timestamp
BEFORE UPDATE ON conversation_contexts
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_contact_personality_profiles_timestamp
BEFORE UPDATE ON contact_personality_profiles
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();
