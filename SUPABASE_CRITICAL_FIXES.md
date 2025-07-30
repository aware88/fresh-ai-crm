# 🚨 CRITICAL DATABASE FIXES NEEDED

## Apply these SQL commands in Supabase Dashboard → SQL Editor:

### 1. Fix user_preferences table (Add missing current_organization_id column)

```sql
-- Add the missing current_organization_id column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS current_organization_id UUID REFERENCES public.organizations(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_current_org 
ON public.user_preferences(current_organization_id);

-- Update RLS policy to allow access to current_organization_id
DROP POLICY IF EXISTS user_preferences_select_policy ON public.user_preferences;
CREATE POLICY user_preferences_select_policy ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_preferences_update_policy ON public.user_preferences;
CREATE POLICY user_preferences_update_policy ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
```

### 2. Ensure user_preferences table exists with all required columns

```sql
-- Create user_preferences table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_organization_id UUID REFERENCES public.organizations(id),
  theme VARCHAR(50) DEFAULT 'light',
  email_notifications BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT true,
  language VARCHAR(10) DEFAULT 'en',
  timezone VARCHAR(100) DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
```

### 3. Fix organization_members policies (CRITICAL - causing infinite recursion)

```sql
-- Drop ALL existing policies first
DROP POLICY IF EXISTS organization_members_select_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_service_role_policy ON public.organization_members;

-- Create simple, non-recursive policies
CREATE POLICY organization_members_select_policy ON public.organization_members
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY organization_members_insert_policy ON public.organization_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY organization_members_update_policy ON public.organization_members
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY organization_members_delete_policy ON public.organization_members
  FOR DELETE USING (auth.uid() = user_id);

-- Service role bypass policy
CREATE POLICY organization_members_service_role_policy ON public.organization_members
  FOR ALL USING (current_setting('role') = 'service_role');
```

### 4. Create default user preferences for existing users

```sql
-- Insert default preferences for users who don't have them
INSERT INTO public.user_preferences (user_id, current_organization_id)
SELECT 
  u.id as user_id,
  o.id as current_organization_id
FROM auth.users u
LEFT JOIN public.organizations o ON o.created_by = u.id
WHERE u.id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

## After applying these fixes:

1. **Refresh your browser** completely (hard refresh: Cmd+Shift+R)
2. **Test the Email tab** - should redirect to settings without errors
3. **Check browser console** - should see fewer/no errors

## Priority: CRITICAL
These fixes resolve:
- ✅ Organization members infinite recursion
- ✅ Missing user_preferences.current_organization_id column
- ✅ Database policy conflicts
- ✅ User preference creation for existing users