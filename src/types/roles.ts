// Role and permission types for the admin panel

export enum RoleType {
  SYSTEM_ADMIN = 'system_admin',
  ORGANIZATION_ADMIN = 'organization_admin',
  CUSTOM = 'custom'
}

export interface Permission {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
  type: RoleType;
  organization_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface RoleWithPermissions extends Role {
  permissions: Permission[];
}

export interface UserRole {
  user_id: string;
  role_id: string;
  created_at: string;
}

export interface RolePermission {
  role_id: string;
  permission_id: string;
  created_at: string;
}

// Permission categories for UI organization
export enum PermissionCategory {
  ADMIN = 'admin',
  ORGANIZATION = 'organization',
  USER = 'user',
  SUBSCRIPTION = 'subscription'
}

export interface PermissionWithCategory extends Permission {
  category: PermissionCategory;
}

// Helper function to categorize permissions
export function categorizePermission(permission: Permission): PermissionWithCategory {
  const name = permission.name;
  let category: PermissionCategory;
  
  if (name.startsWith('admin.')) {
    category = PermissionCategory.ADMIN;
  } else if (name.startsWith('organization.')) {
    category = PermissionCategory.ORGANIZATION;
  } else if (name.includes('user')) {
    category = PermissionCategory.USER;
  } else if (name.includes('subscription')) {
    category = PermissionCategory.SUBSCRIPTION;
  } else {
    category = PermissionCategory.ADMIN;
  }
  
  return {
    ...permission,
    category
  };
}

// Helper function to check if a user has a specific permission
export function hasPermission(userPermissions: string[], requiredPermission: string): boolean {
  return userPermissions.includes(requiredPermission);
}
