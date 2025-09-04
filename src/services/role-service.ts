import { createServerClient } from '@/lib/supabase/server';
import { Role, Permission, RoleWithPermissions, RoleType } from '@/types/roles';

export class RoleService {
  /**
   * Get all roles
   */
  static async getAllRoles(): Promise<Role[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching roles:', error);
      throw new Error('Failed to fetch roles');
    }

    return data as Role[];
  }

  /**
   * Get roles for an organization
   */
  static async getOrganizationRoles(organizationId: string): Promise<Role[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('organization_id', organizationId)
      .order('name');

    if (error) {
      console.error('Error fetching organization roles:', error);
      throw new Error('Failed to fetch organization roles');
    }

    return data as Role[];
  }

  /**
   * Get a role by ID with its permissions
   */
  static async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const supabase = await createServerClient();
    
    // Get the role
    const { data: role, error: roleError } = await supabase
      .from('roles')
      .select('*')
      .eq('id', roleId)
      .single();

    if (roleError) {
      console.error('Error fetching role:', roleError);
      throw new Error('Failed to fetch role');
    }

    if (!role) return null;

    // Get the role's permissions
    const { data: permissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId);

    if (permissionsError) {
      console.error('Error fetching role permissions:', permissionsError);
      throw new Error('Failed to fetch role permissions');
    }

    // Extract permissions from the nested structure
    const formattedPermissions = permissions.map(p => p.permissions) as Permission[];

    return {
      ...role,
      permissions: formattedPermissions
    } as RoleWithPermissions;
  }

  /**
   * Create a new role
   */
  static async createRole(role: Partial<Role>): Promise<Role> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('roles')
      .insert(role)
      .select('*')
      .single();

    if (error) {
      console.error('Error creating role:', error);
      throw new Error('Failed to create role');
    }

    return data as Role;
  }

  /**
   * Update a role
   */
  static async updateRole(roleId: string, updates: Partial<Role>): Promise<Role> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('roles')
      .update(updates)
      .eq('id', roleId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating role:', error);
      throw new Error('Failed to update role');
    }

    return data as Role;
  }

  /**
   * Delete a role
   */
  static async deleteRole(roleId: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('roles')
      .delete()
      .eq('id', roleId);

    if (error) {
      console.error('Error deleting role:', error);
      throw new Error('Failed to delete role');
    }
  }

  /**
   * Assign permissions to a role
   */
  static async assignPermissionsToRole(roleId: string, permissionIds: string[]): Promise<void> {
    const supabase = await createServerClient();
    
    // First, remove all existing permissions for this role
    const { error: deleteError } = await supabase
      .from('role_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      console.error('Error removing existing permissions:', deleteError);
      throw new Error('Failed to update role permissions');
    }

    // Then, add the new permissions
    const rolePermissions = permissionIds.map(permissionId => ({
      role_id: roleId,
      permission_id: permissionId
    }));

    const { error: insertError } = await supabase
      .from('role_permissions')
      .insert(rolePermissions);

    if (insertError) {
      console.error('Error assigning permissions to role:', insertError);
      throw new Error('Failed to assign permissions to role');
    }
  }

  /**
   * Get all permissions
   */
  static async getAllPermissions(): Promise<Permission[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error fetching permissions:', error);
      throw new Error('Failed to fetch permissions');
    }

    return data as Permission[];
  }

  /**
   * Get permissions for a role
   */
  static async getRolePermissions(roleId: string): Promise<Permission[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .eq('role_id', roleId);

    if (error) {
      console.error('Error fetching role permissions:', error);
      throw new Error('Failed to fetch role permissions');
    }

    // Extract permissions from the nested structure
    return data.map(p => p.permissions) as Permission[];
  }

  /**
   * Get user roles
   */
  static async getUserRoles(userId: string): Promise<Role[]> {
    const supabase = await createServerClient();
    const { data, error } = await supabase
      .from('user_roles')
      .select('roles(*)')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user roles:', error);
      throw new Error('Failed to fetch user roles');
    }

    // Extract roles from the nested structure
    return data.map(ur => ur.roles) as Role[];
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId: string): Promise<Permission[]> {
    const supabase = await createServerClient();
    
    // Get all roles for the user
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role_id')
      .eq('user_id', userId);

    if (rolesError) {
      console.error('Error fetching user roles:', rolesError);
      throw new Error('Failed to fetch user roles');
    }

    if (userRoles.length === 0) return [];

    // Get all permissions for those roles
    const roleIds = userRoles.map(ur => ur.role_id);
    const { data: rolePermissions, error: permissionsError } = await supabase
      .from('role_permissions')
      .select('permissions(*)')
      .in('role_id', roleIds);

    if (permissionsError) {
      console.error('Error fetching role permissions:', permissionsError);
      throw new Error('Failed to fetch role permissions');
    }

    // Extract permissions and remove duplicates
    const permissionsMap = new Map<string, Permission>();
    rolePermissions.forEach(rp => {
      const permission = rp.permissions as Permission;
      permissionsMap.set(permission.id, permission);
    });

    return Array.from(permissionsMap.values());
  }

  /**
   * Assign a role to a user
   */
  static async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role_id: roleId });

    if (error) {
      console.error('Error assigning role to user:', error);
      throw new Error('Failed to assign role to user');
    }
  }

  /**
   * Remove a role from a user
   */
  static async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role_id', roleId);

    if (error) {
      console.error('Error removing role from user:', error);
      throw new Error('Failed to remove role from user');
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async userHasPermission(userId: string, permissionName: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.some(p => p.name === permissionName);
  }

  /**
   * Check if a user is a system admin
   */
  static async isSystemAdmin(userId: string): Promise<boolean> {
    try {
      const supabase = await createServerClient();
      
      // Get user roles
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(*)')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error checking if user is system admin:', rolesError);
        // If it's a permission error, assume user is not a system admin
        if (rolesError.code === '42501') {
          console.warn('Permission denied accessing user roles, assuming user is not system admin');
          return false;
        }
        throw new Error('Failed to check if user is system admin');
      }

      if (!userRoles || userRoles.length === 0) {
        return false;
      }

      // Check if any role is a system admin role
      return userRoles.some(ur => (ur.roles as Role).type === RoleType.SYSTEM_ADMIN);
    } catch (error) {
      console.error('Exception in isSystemAdmin:', error);
      // In case of any error, assume user is not a system admin for security
      return false;
    }
  }

  /**
   * Check if a user is an organization admin
   */
  static async isOrganizationAdmin(userId: string, organizationId: string): Promise<boolean> {
    try {
      const supabase = await createServerClient();
      
      // Get user roles for the specific organization
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select('roles(*)')
        .eq('user_id', userId);

      if (rolesError) {
        console.error('Error checking if user is organization admin:', rolesError);
        // If it's a permission error, assume user is not an admin
        if (rolesError.code === '42501') {
          console.warn('Permission denied accessing user roles, assuming user is not admin');
          return false;
        }
        throw new Error('Failed to check if user is organization admin');
      }

      if (!userRoles || userRoles.length === 0) {
        return false;
      }

      // Check if any role is an organization admin role for this organization
      return userRoles.some(ur => {
        const role = ur.roles as Role;
        return role.type === RoleType.ORGANIZATION_ADMIN && role.organization_id === organizationId;
      });
    } catch (error) {
      console.error('Exception in isOrganizationAdmin:', error);
      // In case of any error, assume user is not an admin for security
      return false;
    }
  }
}
