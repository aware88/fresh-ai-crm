-- Transparency - User Control & Visibility Schema
-- Phase 3 implementation

-- Agent activities logging
CREATE TABLE IF NOT EXISTS ai_agent_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  activity_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE
);

-- Agent thought process logging
CREATE TABLE IF NOT EXISTS ai_agent_thoughts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  activity_id UUID REFERENCES ai_agent_activities(id),
  thought_step INTEGER NOT NULL,
  reasoning TEXT NOT NULL,
  alternatives JSONB,
  confidence FLOAT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE
);

-- User-configurable agent settings
CREATE TABLE IF NOT EXISTS ai_agent_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  user_id UUID,
  agent_id UUID,
  setting_key VARCHAR(100) NOT NULL,
  setting_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT fk_organization
    FOREIGN KEY (organization_id)
    REFERENCES organizations(id)
    ON DELETE CASCADE,
    
  -- Either global (null user_id), user-specific, or agent-specific
  CONSTRAINT check_setting_scope CHECK (
    (user_id IS NULL AND agent_id IS NULL) OR
    (user_id IS NOT NULL AND agent_id IS NULL) OR
    (user_id IS NULL AND agent_id IS NOT NULL)
  )
);

-- Add indexes
CREATE INDEX idx_agent_activities_org_id ON ai_agent_activities(organization_id);
CREATE INDEX idx_agent_activities_agent_id ON ai_agent_activities(agent_id);
CREATE INDEX idx_agent_thoughts_activity_id ON ai_agent_thoughts(activity_id);
CREATE INDEX idx_agent_settings_org_user ON ai_agent_settings(organization_id, user_id);
CREATE INDEX idx_agent_settings_org_agent ON ai_agent_settings(organization_id, agent_id);

-- Add RLS policies
ALTER TABLE ai_agent_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_thoughts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_agent_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY ai_agent_activities_org_isolation ON ai_agent_activities
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);
  
CREATE POLICY ai_agent_thoughts_org_isolation ON ai_agent_thoughts
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);
  
CREATE POLICY ai_agent_settings_org_isolation ON ai_agent_settings
  USING (organization_id = auth.jwt() ->> 'organization_id'::text);
