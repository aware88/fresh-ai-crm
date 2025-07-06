# Admin Role System Documentation

## Overview

The CRM Mind admin role system provides a flexible and secure way to manage permissions across the application. It supports multiple levels of administration:

- **System Administrators**: Have complete access to all features and organizations
- **Organization Administrators**: Have full control over their own organization
- **Custom Roles**: Can be created with specific permissions for specialized tasks

## Database Schema

The role system is built on the following database tables:

### `roles`

Stores role definitions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Role name |
| description | TEXT | Role description |
| type | role_type | 'system_admin', 'organization_admin', or 'custom' |
| organization_id | UUID | Reference to organizations table (null for system roles) |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `permissions`

Stores individual permissions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Permission name (e.g., 'admin.users.view') |
| description | TEXT | Permission description |
| created_at | TIMESTAMP | Creation timestamp |
| updated_at | TIMESTAMP | Last update timestamp |

### `role_permissions`

Junction table linking roles to permissions.

| Column | Type | Description |
|--------|------|-------------|
| role_id | UUID | Reference to roles table |
| permission_id | UUID | Reference to permissions table |
| created_at | TIMESTAMP | Creation timestamp |

### `user_roles`

Junction table linking users to roles.

| Column | Type | Description |
|--------|------|-------------|
| user_id | UUID | Reference to users table |
| role_id | UUID | Reference to roles table |
| created_at | TIMESTAMP | Creation timestamp |

## Default Roles and Permissions

The system comes with two default roles:

1. **System Administrator**: Has all permissions
2. **Organization Administrator**: Has all organization-related permissions

Permissions are organized into categories:

- **Admin**: Permissions for system administration (`admin.*`)
- **Organization**: Permissions for organization management (`organization.*`)
- **User**: Permissions for user management
- **Subscription**: Permissions for subscription management

## Implementation

### Backend Services

#### `RoleService`

The `RoleService` class provides methods for managing roles and permissions:

- Role CRUD operations
- Permission assignment
- User role management
- Permission checking

```typescript
// Example: Check if a user has a specific permission
const hasPermission = await RoleService.userHasPermission(userId, 'admin.access');
```

#### Authentication Middleware

The authentication middleware provides functions for checking user permissions:

- `requireAuth()`: Ensures the user is authenticated
- `requireSystemAdmin()`: Ensures the user is a system administrator
- `requirePermission(permissionName)`: Ensures the user has a specific permission
- `requireOrganizationAdmin(organizationId)`: Ensures the user is an administrator for a specific organization

```typescript
// Example: Require admin access permission
const auth = await requirePermission('admin.access');
if (!auth.success) {
  // Handle unauthorized access
}
```

### API Endpoints

The role system provides API endpoints for managing roles and permissions:

- `GET /api/admin/roles`: Get all roles or roles for a specific organization
- `POST /api/admin/roles`: Create a new role
- `GET /api/admin/roles/[id]`: Get a specific role with its permissions
- `PUT /api/admin/roles/[id]`: Update a role
- `DELETE /api/admin/roles/[id]`: Delete a role

## Usage Guidelines

### Creating Custom Roles

Custom roles can be created for specific use cases:

```typescript
// Example: Create a custom role for content managers
const role = await RoleService.createRole({
  name: 'Content Manager',
  description: 'Can manage content but not users or settings',
  type: RoleType.CUSTOM,
  organization_id: organizationId
});

// Assign specific permissions
await RoleService.assignPermissionsToRole(role.id, [
  'organization.content.view',
  'organization.content.edit'
]);
```

### Checking Permissions in UI Components

Use the `RoleService` to check permissions in UI components:

```typescript
// Example: Conditionally render an admin button
const [hasPermission, setHasPermission] = useState(false);

useEffect(() => {
  async function checkPermission() {
    const result = await fetch('/api/admin/check-permission?name=admin.users.edit');
    const data = await result.json();
    setHasPermission(data.hasPermission);
  }
  checkPermission();
}, []);

return (
  <div>
    {hasPermission && <button>Edit User</button>}
  </div>
);
```

## Best Practices

1. **Use Predefined Permission Names**: Always use the predefined permission names from the database to ensure consistency.

2. **Check Permissions at Multiple Levels**: Validate permissions both in the UI and in API endpoints.

3. **System Admin Override**: Remember that system administrators bypass all permission checks.

4. **Organization Isolation**: Ensure that organization-specific roles can only access their own organization's data.

5. **Audit Role Changes**: Log all changes to roles and permissions for security auditing.

## Testing

A test script is provided in `src/tests/admin/role-service.test.js` to verify the role-based access control implementation. It tests:

- Users with no roles have no permissions
- System administrators have all permissions
- Organization administrators have only organization-related permissions

To run the tests:

```bash
node src/tests/admin/role-service.test.js
```
