# 🚨 CRITICAL: Complete Database Fix for Sign-in Issues

## **IMMEDIATE ACTION REQUIRED**

The sign-in loop issue is caused by database policy problems. Apply these SQL fixes in **Supabase Dashboard → SQL Editor**:

### **1. Fix Organization Members Policies (CRITICAL)**

```sql
-- Drop ALL existing policies completely
DROP POLICY IF EXISTS organization_members_select_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_service_role_policy ON public.organization_members;

-- Disable RLS temporarily to reset everything
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies
CREATE POLICY "Enable read access for users" ON public.organization_members
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users" ON public.organization_members
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users" ON public.organization_members
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Enable delete for users" ON public.organization_members
    FOR DELETE USING (auth.uid() = user_id);
```

### **2. Fix User Preferences Table (CRITICAL)**

```sql
-- Ensure user_preferences table exists with correct structure
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- Drop existing policies
DROP POLICY IF EXISTS user_preferences_select_policy ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_insert_policy ON public.user_preferences;
DROP POLICY IF EXISTS user_preferences_update_policy ON public.user_preferences;

-- Create simple policies
CREATE POLICY "Enable read access for users" ON public.user_preferences
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Enable insert for users" ON public.user_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable update for users" ON public.user_preferences
    FOR UPDATE USING (auth.uid() = user_id);
```

### **3. Create Default User Preferences for Existing Users**

```sql
-- Insert default preferences for users who don't have them
INSERT INTO public.user_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM public.user_preferences)
ON CONFLICT (user_id) DO NOTHING;
```

### **4. Create Default Organization for Users**

```sql
-- Create organizations table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  description TEXT,
  logo_url TEXT,
  primary_color VARCHAR(7) DEFAULT '#4285F4',
  secondary_color VARCHAR(7) DEFAULT '#34A853',
  domain VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(50) DEFAULT 'active',
  subscription_start_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  subscription_end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Create simple policies for organizations
CREATE POLICY "Enable read access for organization members" ON public.organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid()
        )
    );

-- Insert default organization for users who don't have one
INSERT INTO public.organizations (name, slug, created_by)
SELECT 
    'Default Organization',
    'default-' || substr(id::text, 1, 8),
    id
FROM auth.users 
WHERE id NOT IN (
    SELECT DISTINCT created_by 
    FROM public.organizations 
    WHERE created_by IS NOT NULL
)
ON CONFLICT DO NOTHING;

-- Create organization memberships for users (only for orgs with valid created_by)
INSERT INTO public.organization_members (organization_id, user_id, role)
SELECT 
    o.id,
    o.created_by,
    'owner'
FROM public.organizations o
WHERE o.created_by IS NOT NULL 
AND o.created_by NOT IN (
    SELECT user_id 
    FROM public.organization_members 
    WHERE organization_id = o.id
    AND user_id IS NOT NULL
)
ON CONFLICT DO NOTHING;
```

### **5. Update User Preferences with Organization IDs**

```sql
-- Update user preferences to link to their default organization
UPDATE public.user_preferences 
SET current_organization_id = (
    SELECT om.organization_id 
    FROM public.organization_members om 
    WHERE om.user_id = user_preferences.user_id 
    LIMIT 1
)
WHERE current_organization_id IS NULL;
```

## **After Applying These Fixes:**

1. **Clear browser cache completely** (Cmd+Shift+R)
2. **Try signing in again**
3. **Check console for errors**
4. **Test settings pages**

## **Priority: CRITICAL**
This should resolve:
- ✅ Sign-in redirect loops
- ✅ Organization members infinite recursion
- ✅ User preferences errors
- ✅ Settings page access issues