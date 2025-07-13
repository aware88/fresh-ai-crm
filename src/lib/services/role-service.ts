// Use types only, lazy-load the actual client
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import type { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Check if we're in a build environment
const isBuildEnv = () => {
  // Enhanced detection for Northflank, Vercel, Netlify and other cloud build environments
  return (process.env.NODE_ENV === 'production' && 
         typeof window === 'undefined' && 
         (process.env.NEXT_PHASE === 'phase-production-build' || 
          process.env.NEXT_PHASE === 'phase-production-server' ||
          process.env.VERCEL_ENV === 'production' ||
          process.env.NETLIFY === 'true' ||
          process.env.CI === 'true' ||
          process.env.BUILD_ENV === 'true' ||
          // Northflank specific environment detection
          process.env.NORTHFLANK === 'true' ||
          process.env.KUBERNETES_SERVICE_HOST !== undefined));
};

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  resource_type: string;
  action: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  organization_id: string | null;
  is_system_role: boolean;
  created_at: string;
  updated_at: string;
  permissions?: Permission[];
}

export interface UserRole {
  id: string;
  user_id: string;
  role_id: string;
  assigned_by: string | null;
  created_at: string;
  updated_at: string;
  role?: Role;
}

// Mock client for build-time or when env vars are missing
const createMockClient = () => {
  return {
    from: (table: string) => ({
      select: (columns: string = '*') => ({
        eq: (column: string, value: any) => ({
          single: () => Promise.resolve({ data: null, error: null }),
          order: (column: string) => ({
            limit: (limit: number) => Promise.resolve({ data: [], error: null })
          })
        }),
        order: (column: string) => ({
          limit: (limit: number) => Promise.resolve({ data: [], error: null })
        }),
        in: (column: string, values: any[]) => Promise.resolve({ data: [], error: null }),
        or: (filter: string) => ({
          order: (column: string) => Promise.resolve({ data: [], error: null })
        })
      }),
      insert: (data: any) => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'mock-id' }, error: null })
        })
      }),
      update: (data: any) => ({
        eq: (column: string, value: any) => ({
          select: () => ({
            single: () => Promise.resolve({ data: { id: value }, error: null })
          })
        })
      }),
      delete: () => ({
        eq: (column: string, value: any) => Promise.resolve({ data: null, error: null })
      })
    }),
    rpc: (functionName: string, params?: any) => Promise.resolve({ data: [], error: null }),
    auth: {
      getUser: () => Promise.resolve({ data: { user: null }, error: null })
    }
  } as unknown as SupabaseClient<Database>;
};

export class RoleService {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseClient?: SupabaseClient<Database>) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
      return;
    }
    
    // Initialize with mock client - will be replaced with real client asynchronously
    this.supabase = createMockClient();
    
    // Asynchronously initialize the real client if not in build environment
    this.initSupabaseClient().catch(error => {
      console.error('Error initializing Supabase client:', error);
    });
  }
  
  // Lazy-initialize the Supabase client
  private async initSupabaseClient(): Promise<void> {
    // Always use mock during build
    if (isBuildEnv()) {
      console.log('Using mock client in build environment');
      return;
    }
    
    // Use mock if environment variables aren't configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.log('Using mock client due to missing environment variables');
      return;
    }
    
    try {
      // Dynamically import Supabase
      const { createServerComponentClient } = await import('@supabase/auth-helpers-nextjs');
      this.supabase = createServerComponentClient<Database>({ cookies });
    } catch (error) {
      console.error('Error creating Supabase client:', error);
    }
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('permissions')
      .select('*')
      .order('resource_type', { ascending: true })
      .order('action', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get all roles, optionally filtered by organization
   */
  async getRoles(organizationId?: string): Promise<Role[]> {
    let query = this.supabase
      .from('roles')
      .select(`
        *,
        permissions:role_permissions(permission_id)
      `);

    if (organizationId) {
      query = query.or(`organization_id.eq.${organizationId},is_system_role.eq.true`);
    }

    const { data, error } = await query.order('name');

    if (error) throw error;

    // Process the data to get permission details
    const roles = data || [];
    for (const role of roles) {
      if (role.permissions && role.permissions.length > 0) {
        const permissionIds = role.permissions.map((p: any) => p.permission_id);
        const { data: permissionsData } = await this.supabase
          .from('permissions')
          .select('*')
          .in('id', permissionIds);

        role.permissions = permissionsData || [];
      } else {
        role.permissions = [];
      }
    }

    return roles;
  }

  /**
   * Get a specific role by ID
   */
  async getRole(roleId: string): Promise<Role | null> {
    const { data, error } = await this.supabase
      .from('roles')
      .select(`
        *,
        permissions:role_permissions(permission_id)
      `)
      .eq('id', roleId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    // Get permission details
    if (data.permissions && data.permissions.length > 0) {
      const permissionIds = data.permissions.map((p: any) => p.permission_id);
      const { data: permissionsData } = await this.supabase
        .from('permissions')
        .select('*')
        .in('id', permissionIds);

      data.permissions = permissionsData || [];
    } else {
      data.permissions = [];
    }

    return data;
  }

  /**
   * Create a new role
   */
  async createRole(
    name: string,
    description: string | null,
    organizationId: string,
    permissionIds: string[]
  ): Promise<Role> {
    // First create the role
    const { data: roleData, error: roleError } = await this.supabase
      .from('roles')
      .insert({
        name,
        description,
        organization_id: organizationId,
        is_system_role: false,
      })
      .select()
      .single();

    if (roleError) throw roleError;

    // Then assign permissions to the role
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleData.id,
        permission_id: permissionId,
      }));

      const { error: permError } = await this.supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    return { ...roleData, permissions: [] };
  }

  /**
   * Update an existing role
   */
  async updateRole(
    roleId: string,
    name: string,
    description: string | null,
    permissionIds: string[]
  ): Promise<Role> {
    // First update the role
    const { data: roleData, error: roleError } = await this.supabase
      .from('roles')
      .update({
        name,
        description,
        updated_at: new Date().toISOString(),
      })
      .eq('id', roleId)
      .select()
      .single();

    if (roleError) throw roleError;

    // Delete existing permissions
    const { error: deleteError } = await this.supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) throw deleteError;

    // Then assign new permissions to the role
    if (permissionIds.length > 0) {
      const rolePermissions = permissionIds.map(permissionId => ({
        role_id: roleId,
        permission_id: permissionId,
      }));

      const { error: permError } = await this.supabase
        .from('role_permissions')
        .insert(rolePermissions);

      if (permError) throw permError;
    }

    return { ...roleData, permissions: [] };
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
    return true;
  }

  /**
   * Get roles assigned to a user
   */
  async getUserRoles(userId: string, organizationId?: string): Promise<UserRole[]> {
    let query = this.supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('user_id', userId);

    if (organizationId) {
      query = query.or(`role.organization_id.eq.${organizationId},role.is_system_role.eq.true`);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<UserRole> {
    const { data, error } = await this.supabase.rpc('assign_role_to_user', {
      p_user_id: userId,
      p_role_id: roleId,
      p_assigned_by: (await this.supabase.auth.getUser()).data.user?.id,
    });

    if (error) throw error;

    // Get the created user role
    const { data: userRoleData, error: fetchError } = await this.supabase
      .from('user_roles')
      .select(`
        *,
        role:roles(*)
      `)
      .eq('user_id', userId)
      .eq('role_id', roleId)
      .single();

    if (fetchError) throw fetchError;
    return userRoleData;
  }

  /**
   * Revoke a role from a user
   */
  async revokeRoleFromUser(userId: string, roleId: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('revoke_role_from_user', {
      p_user_id: userId,
      p_role_id: roleId,
      p_revoked_by: (await this.supabase.auth.getUser()).data.user?.id,
    });

    if (error) throw error;
    return !!data;
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(userId: string, resourceType: string, action: string): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('has_permission', {
      p_user_id: userId,
      p_resource_type: resourceType,
      p_action: action,
    });

    if (error) throw error;
    return !!data;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<{ resource_type: string; action: string }[]> {
    const { data, error } = await this.supabase.rpc('get_user_permissions', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || [];
  }
}
