-- Drop existing policies on organization_members that might be causing recursion
DROP POLICY IF EXISTS organization_members_select_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_insert_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_update_policy ON public.organization_members;
DROP POLICY IF EXISTS organization_members_delete_policy ON public.organization_members;

-- Create non-recursive policies
-- Policy for SELECT: Users can view organizations they are members of
CREATE POLICY organization_members_select_policy ON public.organization_members
  FOR SELECT USING (
    -- User can see their own memberships
    auth.uid() = user_id
    -- Or user is an admin of the organization
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.created_by = auth.uid()
    )
  );

-- Policy for INSERT: Users can only add themselves or be added by organization admins
CREATE POLICY organization_members_insert_policy ON public.organization_members
  FOR INSERT WITH CHECK (
    -- User can add themselves (if invited)
    auth.uid() = user_id
    -- Or user is an admin of the organization
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.created_by = auth.uid()
    )
  );

-- Policy for UPDATE: Users can update their own membership or be updated by organization admins
CREATE POLICY organization_members_update_policy ON public.organization_members
  FOR UPDATE USING (
    -- User can update their own membership
    auth.uid() = user_id
    -- Or user is an admin of the organization
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.created_by = auth.uid()
    )
  );

-- Policy for DELETE: Users can remove themselves or be removed by organization admins
CREATE POLICY organization_members_delete_policy ON public.organization_members
  FOR DELETE USING (
    -- User can remove themselves
    auth.uid() = user_id
    -- Or user is an admin of the organization
    OR EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = organization_id AND o.created_by = auth.uid()
    )
  );
