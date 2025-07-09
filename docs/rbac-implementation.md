# Role-Based Access Control (RBAC) Implementation

This document describes the enhanced RBAC system implemented for CRM Mind.

## Overview

The RBAC system provides granular permission control for users within organizations. It allows:

- System-wide roles that apply across all organizations
- Organization-specific roles with custom permissions
- Fine-grained permission checks at both UI and API levels
- Secure role assignment and management

## Database Schema

The RBAC system consists of four main tables:

1. **roles** - Defines roles that can be assigned to users
   - System roles (is_system_role = true) apply across all organizations
   - Organization roles are specific to an organization

2. **permissions** - Defines individual permissions
   - Each permission has a resource_type (e.g., "contact", "organization")
   - Each permission has an action (e.g., "read", "create", "update", "delete")

3. **role_permissions** - Junction table linking roles to permissions

4. **user_roles** - Junction table assigning roles to users

## Default Roles

The system comes with the following default roles:

1. **Super Admin** - Has all permissions system-wide
2. **Organization Admin** - Has all permissions within an organization
3. **Member** - Basic access with read permissions and limited write permissions
4. **Viewer** - Read-only access to organization resources

## Usage

### Frontend

Use the `PermissionGate` component to conditionally render UI elements based on permissions:

```tsx
<PermissionGate resourceType="contact" action="create">
  <Button>Create Contact</Button>
</PermissionGate>
```

For multiple permission checks:

```tsx
<PermissionGate 
  permissions={[
    ["contact", "create"],
    ["contact", "update"]
  ]}
  requireAll={false} // User needs any of these permissions
>
  <Button>Manage Contacts</Button>
</PermissionGate>
```

For admin-only features:

```tsx
<AdminOnly>
  <Button>Admin Feature</Button>
</AdminOnly>
```

### Backend

Use the permission middleware to protect API routes:

```typescript
export const POST = withPermission(
  async (req) => {
    // Your route handler
    return NextResponse.json({ success: true });
  },
  { resourceType: "contact", action: "create" }
);
```

For multiple permission checks:

```typescript
export const POST = withPermission(
  async (req) => {
    // Your route handler
    return NextResponse.json({ success: true });
  },
  [
    { resourceType: "contact", action: "create" },
    { resourceType: "contact", action: "update" }
  ],
  false // User needs any of these permissions
);
```

## Management UI

The RBAC system includes two main management components:

1. **RoleManagement** - For creating and managing roles and their permissions
2. **UserRoleAssignment** - For assigning roles to users

Add these components to your settings pages:

```tsx
// Organization settings page
<RoleManagement organizationId={organizationId} />

// Team management page
<UserRoleAssignment organizationId={organizationId} users={organizationUsers} />
```

## Installation

To apply the RBAC migrations to your database:

1. Ensure your Supabase environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Run the migration script:
   ```bash
   ./scripts/apply-rbac-migrations.sh
   ```

## Extending the System

### Adding New Permissions

To add new permissions, insert them into the `permissions` table:

```sql
INSERT INTO permissions (name, description, resource_type, action)
VALUES ('custom:read', 'View custom resource', 'custom', 'read');
```

### Creating Custom Roles

Use the `RoleService` to create custom roles programmatically:

```typescript
const roleService = new RoleService();
const newRole = await roleService.createRole(
  'Custom Role',
  'Description of the custom role',
  organizationId,
  permissionIds
);
```

## Security Considerations

- All tables have Row Level Security (RLS) policies to prevent unauthorized access
- Role assignment is protected by organization membership checks
- System roles can only be managed by system administrators
- All role assignments and revocations are logged in the audit log
