-- Drop existing policies if they exist
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_policy') THEN
    DROP POLICY IF EXISTS notifications_select_policy ON notifications;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_insert_policy') THEN
    DROP POLICY IF EXISTS notifications_insert_policy ON notifications;
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_policy') THEN
    DROP POLICY IF EXISTS notifications_update_policy ON notifications;
  END IF;
  
  -- Drop trigger if it exists
  IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_notifications_updated_at') THEN
    DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
  END IF;
  
  -- Drop function if it exists
  DROP FUNCTION IF EXISTS update_notifications_updated_at();
END $$;

-- Create notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN (
    -- Subscription notification types
    'subscription_created',
    'subscription_updated',
    'subscription_cancelled',
    'subscription_payment_failed',
    'subscription_payment_succeeded',
    'subscription_trial_ending',
    'subscription_tier_changed',
    
    -- Metakocka integration notification types
    'metakocka_connected',
    'metakocka_sync_completed',
    'metakocka_sync_failed',
    'metakocka_error_resolved',
    'metakocka_credentials_expired',
    
    -- White-label notification types
    'domain_connected',
    'domain_verification_needed',
    'domain_verification_succeeded',
    'domain_verification_failed',
    'branding_updated',
    
    -- System notification types
    'system_maintenance',
    'system_update',
    'feature_announcement',
    
    -- User notification types
    'user_invited',
    'user_joined',
    'user_role_changed',
    'password_reset'
  )),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for faster queries (only if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_user_id') THEN
    CREATE INDEX idx_notifications_user_id ON notifications(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_organization_id') THEN
    CREATE INDEX idx_notifications_organization_id ON notifications(organization_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_read') THEN
    CREATE INDEX idx_notifications_read ON notifications(read);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_notifications_created_at') THEN
    CREATE INDEX idx_notifications_created_at ON notifications(created_at);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create or replace policies
DO $$
BEGIN
  -- Create policies if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_select_policy') THEN
    CREATE POLICY notifications_select_policy ON notifications 
      FOR SELECT 
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_insert_policy') THEN
    CREATE POLICY notifications_insert_policy ON notifications 
      FOR INSERT 
      WITH CHECK (false); -- Only allow through service role
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_update_policy') THEN
    CREATE POLICY notifications_update_policy ON notifications 
      FOR UPDATE 
      USING (auth.uid() = user_id);
  END IF;

  -- Add system admin policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_admin_policy') THEN
    CREATE POLICY notifications_admin_policy ON notifications
      FOR ALL
      TO authenticated
      USING (user_has_role(auth.uid(), 'System Administrator'));
  END IF;

  -- Add organization admin policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notifications_org_admin_policy') THEN
    CREATE POLICY notifications_org_admin_policy ON notifications
      FOR SELECT
      TO authenticated
      USING (
        user_has_role(auth.uid(), 'Organization Administrator') AND
        organization_id IN (
          SELECT organization_id FROM organization_users WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Create or replace function for updated_at trigger
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create or replace trigger
CREATE OR REPLACE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW
EXECUTE FUNCTION update_notifications_updated_at();

-- Create notification templates table
CREATE TABLE IF NOT EXISTS notification_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(50) NOT NULL UNIQUE,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  action_url_template TEXT,
  default_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification_templates
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for notification_templates
CREATE POLICY notification_templates_select_policy ON notification_templates
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY notification_templates_modify_policy ON notification_templates
  FOR ALL
  TO authenticated
  USING (user_has_permission(auth.uid(), 'admin.notifications.manage'));

-- Insert default notification templates with idempotency
DO $$
BEGIN
  -- Subscription notification templates
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_created') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_created', 'Subscription Created', 'Your {{tier_name}} subscription has been created successfully.', '/app/settings/billing', '{"icon": "credit-card", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_updated') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_updated', 'Subscription Updated', 'Your subscription details have been updated.', '/app/settings/billing', '{"icon": "refresh-cw", "color": "blue"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_cancelled') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_cancelled', 'Subscription Cancelled', 'Your subscription has been cancelled and will end on {{end_date}}.', '/app/settings/billing', '{"icon": "x-circle", "color": "red"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_payment_failed') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_payment_failed', 'Payment Failed', 'We were unable to process your subscription payment. Please update your payment method.', '/app/settings/billing/payment', '{"icon": "alert-triangle", "color": "red"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_payment_succeeded') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_payment_succeeded', 'Payment Successful', 'Your subscription payment of {{amount}} has been processed successfully.', '/app/settings/billing', '{"icon": "check-circle", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_trial_ending') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_trial_ending', 'Trial Ending Soon', 'Your trial period will end in {{days_remaining}} days. Add a payment method to continue your subscription.', '/app/settings/billing/payment', '{"icon": "clock", "color": "orange"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'subscription_tier_changed') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('subscription_tier_changed', 'Subscription Tier Changed', 'Your subscription has been changed from {{old_tier}} to {{new_tier}}.', '/app/settings/billing', '{"icon": "arrow-up-right", "color": "blue"}');
  END IF;
  
  -- Metakocka integration templates
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'metakocka_connected') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('metakocka_connected', 'Metakocka Connected', 'Your Metakocka integration has been set up successfully.', '/app/settings/integrations/metakocka', '{"icon": "link", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'metakocka_sync_completed') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('metakocka_sync_completed', 'Sync Completed', 'Metakocka data synchronization completed successfully. {{items_synced}} items were synchronized.', '/app/settings/integrations/metakocka/logs', '{"icon": "check-circle", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'metakocka_sync_failed') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('metakocka_sync_failed', 'Sync Failed', 'Metakocka data synchronization failed. Please check the error logs.', '/app/settings/integrations/metakocka/logs', '{"icon": "alert-circle", "color": "red"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'metakocka_error_resolved') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('metakocka_error_resolved', 'Error Resolved', 'A Metakocka integration error has been resolved.', '/app/settings/integrations/metakocka/logs', '{"icon": "check", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'metakocka_credentials_expired') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('metakocka_credentials_expired', 'Credentials Expired', 'Your Metakocka API credentials have expired. Please update them to continue synchronization.', '/app/settings/integrations/metakocka', '{"icon": "key", "color": "orange"}');
  END IF;
  
  -- White-label templates
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'domain_connected') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('domain_connected', 'Domain Connected', 'Your custom domain {{domain}} has been connected successfully.', '/app/settings/domains', '{"icon": "globe", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'domain_verification_needed') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('domain_verification_needed', 'Domain Verification Required', 'Please verify ownership of your domain {{domain}} by adding the provided DNS records.', '/app/settings/domains/verify/{{domain_id}}', '{"icon": "alert-circle", "color": "orange"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'domain_verification_succeeded') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('domain_verification_succeeded', 'Domain Verified', 'Your domain {{domain}} has been verified successfully.', '/app/settings/domains', '{"icon": "check-circle", "color": "green"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'domain_verification_failed') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('domain_verification_failed', 'Domain Verification Failed', 'Verification of domain {{domain}} failed. Please check your DNS settings.', '/app/settings/domains/verify/{{domain_id}}', '{"icon": "x-circle", "color": "red"}');
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM notification_templates WHERE type = 'branding_updated') THEN
    INSERT INTO notification_templates (type, title_template, message_template, action_url_template, default_metadata)
    VALUES ('branding_updated', 'Branding Updated', 'Your organization branding has been updated successfully.', '/app/settings/branding', '{"icon": "image", "color": "blue"}');
  END IF;
END $$;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, notification_type)
);

-- Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policy for notification_preferences
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_preferences_select_policy') THEN
    CREATE POLICY notification_preferences_select_policy ON notification_preferences
      FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_preferences_update_policy') THEN
    CREATE POLICY notification_preferences_update_policy ON notification_preferences
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_preferences_insert_policy') THEN
    CREATE POLICY notification_preferences_insert_policy ON notification_preferences
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'notification_preferences_admin_policy') THEN
    CREATE POLICY notification_preferences_admin_policy ON notification_preferences
      FOR ALL
      TO authenticated
      USING (user_has_role(auth.uid(), 'System Administrator'));
  END IF;
END $$;

-- Create function to get notification preference
CREATE OR REPLACE FUNCTION get_notification_preference(
  p_user_id UUID,
  p_type VARCHAR(50)
) RETURNS TABLE (email_enabled BOOLEAN, in_app_enabled BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    np.email_enabled, 
    np.in_app_enabled
  FROM notification_preferences np
  WHERE np.user_id = p_user_id AND np.notification_type = p_type
  UNION
  SELECT TRUE, TRUE
  WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences
    WHERE user_id = p_user_id AND notification_type = p_type
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  p_user_id UUID,
  p_organization_id UUID,
  p_type VARCHAR(50),
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_template notification_templates%ROWTYPE;
  v_title TEXT;
  v_message TEXT;
  v_action_url TEXT;
  v_notification_id UUID;
  v_placeholder TEXT;
  v_replacement TEXT;
  v_preference RECORD;
BEGIN
  -- Get user preference
  SELECT * INTO v_preference FROM get_notification_preference(p_user_id, p_type);
  
  -- Check if in-app notifications are enabled for this user
  IF NOT v_preference.in_app_enabled THEN
    RETURN NULL; -- Skip notification if disabled
  END IF;
  
  -- Get template
  SELECT * INTO v_template FROM notification_templates WHERE type = p_type;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Notification template not found for type: %', p_type;
  END IF;
  
  -- Process title template
  v_title := v_template.title_template;
  
  -- Process message template
  v_message := v_template.message_template;
  
  -- Process action URL template
  v_action_url := v_template.action_url_template;
  
  -- Replace placeholders in templates with values from metadata
  FOR v_placeholder, v_replacement IN SELECT * FROM jsonb_each_text(p_metadata)
  LOOP
    v_title := REPLACE(v_title, '{{' || v_placeholder || '}}', v_replacement);
    v_message := REPLACE(v_message, '{{' || v_placeholder || '}}', v_replacement);
    IF v_action_url IS NOT NULL THEN
      v_action_url := REPLACE(v_action_url, '{{' || v_placeholder || '}}', v_replacement);
    END IF;
  END LOOP;
  
  -- Insert notification
  INSERT INTO notifications (
    user_id,
    organization_id,
    title,
    message,
    type,
    action_url,
    metadata
  ) VALUES (
    p_user_id,
    p_organization_id,
    v_title,
    v_message,
    p_type,
    v_action_url,
    jsonb_build_object('template_metadata', v_template.default_metadata) || p_metadata
  ) RETURNING id INTO v_notification_id;
  
  -- Queue email notification if enabled
  IF v_preference.email_enabled THEN
    -- Add to email queue (this would be implemented in a separate migration)
    -- The email_queue table would be created in another migration
    -- INSERT INTO email_queue (user_id, subject, body, metadata)
    -- VALUES (p_user_id, v_title, v_message, jsonb_build_object('notification_id', v_notification_id));
  END IF;
  
  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to send notification to all users in an organization
CREATE OR REPLACE FUNCTION send_organization_notification(
  p_organization_id UUID,
  p_type VARCHAR(50),
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS SETOF UUID AS $$
DECLARE
  v_user_id UUID;
  v_notification_id UUID;
BEGIN
  FOR v_user_id IN 
    SELECT user_id FROM organization_users WHERE organization_id = p_organization_id
  LOOP
    v_notification_id := send_notification(v_user_id, p_organization_id, p_type, p_metadata);
    IF v_notification_id IS NOT NULL THEN
      RETURN NEXT v_notification_id;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_as_read(
  p_user_id UUID,
  p_notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET read = TRUE, updated_at = NOW()
    WHERE user_id = p_user_id AND id = ANY(p_notification_ids) AND read = FALSE;
  END IF;
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
