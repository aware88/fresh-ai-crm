import { SupabaseClient } from '@supabase/supabase-js';

export interface Role {
  id: string;
  name: string;
  description: string;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource_type: string;
  action: string;
  created_at: string;
  updated_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at: string;
}

export class RoleService {
  private supabase: SupabaseClient;

  constructor(supabaseClient: SupabaseClient) {
    this.supabase = supabaseClient;
  }

  /**
   * Get all roles for an organization
   */
  async getRoles(organizationId: string): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('organization_id', organizationId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a specific role by ID
   */
  async getRole(roleId: string): Promise<Role | null> {
    const { data, error } = await this.supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Create a new role
   */
  async createRole(role: Omit<Role, 'id' | 'created_at' | 'updated_at'>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .insert(role)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update a role
   */
  async updateRole(roleId: string, updates: Partial<Omit<Role, 'id' | 'created_at' | 'updated_at'>>): Promise<Role> {
    const { data, error } = await this.supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Delete a role
   */
  async deleteRole(roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) throw error;
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('permissions')
      .select('*')
      .order('resource_type');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get permissions for a role
   */
  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const { data, error } = await this.supabase
      .from('role_permissions')
      .select('permission_id, permissions:permission_id(*)')
      .eq('role_id', roleId);

    if (error) throw error;
    return data?.map(item => item.permissions) || [];
  }

  /**
   * Assign a permission to a role
   */
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('role_permissions')
      .insert({ role_id: roleId, permission_id: permissionId });

    if (error) throw error;
  }

  /**
   * Remove a permission from a role
   */
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    const { error } = await this.supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId)
      .eq('permission_id', permissionId);

    if (error) throw error;
  }

  /**
   * Get users with a specific role
   */
  async getUsersWithRole(roleId: string): Promise<UserRole[]> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('*, users:user_id(email, display_name, avatar_url)')
      .eq('role_id', roleId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Assign a role to a user
   */
  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId });

    if (error) throw error;
  }

  /**
   * Remove a role from a user
   */
  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const { error } = await this.supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) throw error;
  }

  /**
   * Get roles for a user
   */
  async getUserRoles(userId: string): Promise<Role[]> {
    const { data, error } = await this.supabase
      .from('user_roles')
      .select('role_id, roles:role_id(*)')
      .eq('user_id', userId);

    if (error) throw error;
    return data?.map(item => item.roles) || [];
  }
}
