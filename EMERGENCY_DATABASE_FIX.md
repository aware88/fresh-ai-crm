# 🚨 EMERGENCY DATABASE FIX - DISABLE RLS TEMPORARILY

## **CRITICAL: The policies are still causing infinite recursion. We need to DISABLE RLS temporarily to get sign-in working.**

### **STEP 1: Completely Disable RLS on Problem Tables**

```sql
-- DISABLE RLS completely on organization_members table
ALTER TABLE public.organization_members DISABLE ROW LEVEL SECURITY;

-- DISABLE RLS completely on user_preferences table  
ALTER TABLE public.user_preferences DISABLE ROW LEVEL SECURITY;

-- DISABLE RLS completely on organizations table
ALTER TABLE public.organizations DISABLE ROW LEVEL SECURITY;
```

### **STEP 2: Drop ALL Existing Policies**

```sql
-- Drop ALL policies from organization_members
DROP POLICY IF EXISTS "Enable read access for users" ON public.organization_members;
DROP POLICY IF EXISTS "Enable insert for users" ON public.organization_members;
DROP POLICY IF EXISTS "Enable update for users" ON public.organization_members;
DROP POLICY IF EXISTS "Enable delete for users" ON public.organization_members;

-- Drop ALL policies from user_preferences
DROP POLICY IF EXISTS "Enable read access for users" ON public.user_preferences;
DROP POLICY IF EXISTS "Enable insert for users" ON public.user_preferences;
DROP POLICY IF EXISTS "Enable update for users" ON public.user_preferences;

-- Drop ALL policies from organizations
DROP POLICY IF EXISTS "Enable read access for organization members" ON public.organizations;
```

### **STEP 3: Fix User Preferences Duplicate Issue**

```sql
-- Find and remove duplicate user_preferences
DELETE FROM public.user_preferences 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM public.user_preferences 
    GROUP BY user_id
);

-- Ensure unique constraint exists
ALTER TABLE public.user_preferences 
DROP CONSTRAINT IF EXISTS user_preferences_user_id_key;

ALTER TABLE public.user_preferences 
ADD CONSTRAINT user_preferences_user_id_key UNIQUE (user_id);
```

### **STEP 4: Test Sign-in**

After running the above SQL:

1. **Clear browser cache completely** (Cmd+Shift+R)
2. **Try signing in again**
3. **Check if you can access the dashboard**

## **WHY THIS WORKS:**

- **No RLS = No policy recursion**
- **No duplicate user preferences = No JSON error**
- **Clean sign-in flow**

## **SECURITY NOTE:**

This temporarily disables security policies. Once sign-in is working, we can re-enable RLS with simpler, non-recursive policies.

## **NEXT STEPS AFTER SIGN-IN WORKS:**

We'll create much simpler policies that don't cause recursion.