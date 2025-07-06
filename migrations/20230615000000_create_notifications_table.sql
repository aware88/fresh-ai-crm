-- Migration: Create notifications table
-- Description: Creates a table for storing user notifications including subscription events

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Add RLS policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all notifications
CREATE POLICY "Service role can manage all notifications"
  ON notifications FOR ALL
  USING (auth.role() = 'service_role');

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();
