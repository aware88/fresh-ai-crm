# Role-Based Access Control (RBAC) System

## Overview
This document provides an overview of the RBAC implementation in the Fresh AI CRM system. The RBAC system controls access to resources based on the roles assigned to users.

## Database Schema

### Tables
1. `roles` - Stores role definitions
   - `id` - UUID primary key
   - `name` - Role name (unique)
   - `description` - Role description
   - `organization_id` - Reference to the organization
   - `created_at` - Timestamp of creation

2. `permissions` - Defines available permissions
   - `id` - UUID primary key
   - `resource_type` - The resource being accessed (e.g., 'organization.users')
   - `action` - The action being performed (e.g., 'read', 'write')
   - `description` - Permission description

3. `role_permissions` - Maps roles to permissions
   - `role_id` - Reference to role
   - `permission_id` - Reference to permission

4. `user_roles` - Maps users to roles
   - `user_id` - Reference to user
   - `role_id` - Reference to role

## Key Components

### Backend
1. **Database Functions**
   - `has_permission(user_id, permission_string)` - Checks if a user has a specific permission
   - `get_user_permissions(user_id)` - Gets all permissions for a user

2. **API Middleware**
   - `withPermission` - Protects API routes based on permissions
   - `withPermissions` - Protects API routes requiring multiple permissions

### Frontend
1. **Hooks**
   - `usePermissions` - Hook to check user permissions

2. **Components**
   - `PermissionGate` - Conditionally renders content based on permissions
   - `RBACNavigation` - Navigation component for RBAC management
   - `withPermissionCheck` - HOC for protecting routes

3. **Pages**
   - `/admin/roles` - Role management
   - `/admin/roles/create` - Create new roles
   - `/admin/roles/[id]` - Edit roles and assign permissions
   - `/admin/users/roles` - Manage user role assignments

## Usage Examples

### Checking Permissions in React Components
```typescript
import { usePermissions } from '@/hooks/usePermissions';

function ProtectedComponent() {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission('organization.users.read')) {
    return <div>Access Denied</div>;
  }
  
  return <div>Protected Content</div>;
}
```

### Protecting API Routes
```typescript
import { withPermission } from '@/middleware/withPermission';

export default withPermission('organization.users.manage')(
  async function handler(req, res) {
    // Your protected route logic here
  }
);
```

### Using PermissionGate Component
```typescript
import { PermissionGate } from '@/components/PermissionGate';

function UserList() {
  return (
    <PermissionGate permission="organization.users.read">
      <UserTable />
    </PermissionGate>
  );
}
```

## Testing the RBAC System

### Test Users
1. **Admin User**
   - Has all permissions
   - Can manage roles and user assignments

2. **Regular User**
   - Limited permissions based on assigned roles
   - Can only access permitted resources

### Test Cases
1. **Role Management**
   - Create a new role
   - Assign permissions to the role
   - Update role details
   - Delete a role

2. **User Role Assignment**
   - Assign a role to a user
   - Remove a role from a user
   - Verify permission inheritance

3. **Permission Verification**
   - Test API route protection
   - Test UI component rendering based on permissions
   - Test navigation visibility

## Troubleshooting

### Common Issues
1. **Permission Denied Errors**
   - Verify the user has the required role
   - Check if the role has the necessary permissions
   - Ensure the user is logged in

2. **Role Assignment Not Working**
   - Verify the role exists
   - Check for any validation errors
   - Ensure the user is part of the organization

### Debugging
1. Check the browser console for errors
2. Verify network requests in the browser's developer tools
3. Check the server logs for any database errors

## Security Considerations
1. Always verify permissions on the server side
2. Use the principle of least privilege
3. Regularly audit role assignments
4. Keep the permission system simple and maintainable
