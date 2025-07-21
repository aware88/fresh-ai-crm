-- Drop existing policies on organization_members that might be causing recursion
DROP POLICY IF EXISTS organization_members_select_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_service_role_policy ON public.organization_members;

-- Create simple, non-recursive policies
-- Policy for SELECT: Users can only view their own memberships
CREATE POLICY organization_members_select_policy ON public.organization_members
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Policy for INSERT: Only authenticated users can insert their own memberships
CREATE POLICY organization_members_insert_policy ON public.organization_members
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
  );

-- Policy for UPDATE: Users can only update their own memberships
CREATE POLICY organization_members_update_policy ON public.organization_members
  FOR UPDATE USING (
    auth.uid() = user_id
  );

-- Policy for DELETE: Users can only delete their own memberships
CREATE POLICY organization_members_delete_policy ON public.organization_members
  FOR DELETE USING (
    auth.uid() = user_id
  );

-- Create a separate policy for service role to bypass these restrictions
-- This allows admin operations without recursion
CREATE POLICY organization_members_service_role_policy ON public.organization_members
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );
