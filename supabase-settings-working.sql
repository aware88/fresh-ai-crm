-- =====================================================
-- ARIS Settings Tables - WORKING VERSION
-- =====================================================

-- =====================================================
-- 1. USER PREFERENCES TABLE (minimal version)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
    ON public.user_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences"
    ON public.user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
    ON public.user_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 2. DISPLAY PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.display_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email_sort TEXT DEFAULT 'newest' CHECK (email_sort IN ('newest', 'oldest', 'sender', 'subject')),
    email_preview_length INTEGER DEFAULT 2,
    email_view TEXT DEFAULT 'threaded' CHECK (email_view IN ('threaded', 'flat', 'compact')),
    dashboard_layout TEXT DEFAULT 'grid' CHECK (dashboard_layout IN ('grid', 'list', 'compact')),
    widget_emails BOOLEAN DEFAULT true,
    widget_contacts BOOLEAN DEFAULT true,
    widget_tasks BOOLEAN DEFAULT true,
    widget_analytics BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

ALTER TABLE public.display_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own display preferences" ON public.display_preferences;
CREATE POLICY "Users can view their own display preferences"
    ON public.display_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own display preferences" ON public.display_preferences;
CREATE POLICY "Users can insert their own display preferences"
    ON public.display_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own display preferences" ON public.display_preferences;
CREATE POLICY "Users can update their own display preferences"
    ON public.display_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 3. NOTIFICATION TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'general',
    title_template TEXT NOT NULL,
    message_template TEXT NOT NULL,
    action_url_template TEXT,
    default_metadata JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view notification templates" ON public.notification_templates;
CREATE POLICY "Authenticated users can view notification templates"
    ON public.notification_templates FOR SELECT
    USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id, notification_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view their own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert their own notification preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update their own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

-- =====================================================
-- 5. INSERT DEFAULT NOTIFICATION TEMPLATES
-- =====================================================
INSERT INTO public.notification_templates (type, category, title_template, message_template, action_url_template) VALUES
('email_received', 'email', 'New Email from {sender}', 'You have received a new email from {sender} with subject: {subject}', '/dashboard/email'),
('email_replied', 'email', 'Email Reply Sent', 'Your reply to {recipient} has been sent successfully', '/dashboard/email'),
('contact_created', 'contacts', 'New Contact Added', 'Contact {name} has been added to your CRM', '/dashboard/contacts'),
('task_created', 'tasks', 'New Task Assigned', 'Task "{title}" has been assigned to you', '/dashboard/tasks'),
('system_maintenance', 'system', 'System Maintenance', 'System maintenance scheduled for {date}', '/dashboard'),
('integration_connected', 'integrations', 'Integration Connected', '{service} has been successfully connected', '/settings/integrations')
ON CONFLICT (type) DO NOTHING;

-- =====================================================
-- 6. SIMPLE VIEWS
-- =====================================================
CREATE OR REPLACE VIEW public.user_preferences_with_defaults AS
SELECT 
    u.id as user_id,
    COALESCE(up.theme, 'system') as theme,
    COALESCE(up.created_at, now()) as created_at,
    COALESCE(up.updated_at, now()) as updated_at
FROM auth.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id;

CREATE OR REPLACE VIEW public.display_preferences_with_defaults AS
SELECT 
    u.id as user_id,
    COALESCE(dp.email_sort, 'newest') as email_sort,
    COALESCE(dp.email_preview_length, 2) as email_preview_length,
    COALESCE(dp.email_view, 'threaded') as email_view,
    COALESCE(dp.dashboard_layout, 'grid') as dashboard_layout,
    COALESCE(dp.widget_emails, true) as widget_emails,
    COALESCE(dp.widget_contacts, true) as widget_contacts,
    COALESCE(dp.widget_tasks, true) as widget_tasks,
    COALESCE(dp.widget_analytics, true) as widget_analytics,
    COALESCE(dp.created_at, now()) as created_at,
    COALESCE(dp.updated_at, now()) as updated_at
FROM auth.users u
LEFT JOIN public.display_preferences dp ON u.id = dp.user_id; 