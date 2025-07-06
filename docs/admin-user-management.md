# Admin User Management System

## Overview

The Admin User Management system provides a comprehensive set of features for managing users across the CRM Mind platform. This system is designed for administrators to efficiently manage user accounts, roles, permissions, and monitor user activity.

## Features

### User Listing and Search
- View all users across the platform
- Search users by name, email, or organization
- Filter users by role, status, or organization
- Sort users by various attributes

### User Details
- View comprehensive user information
- See user's organization affiliation
- Monitor user activity logs
- View user's role and permissions

### User Management
- Create new user accounts
- Invite users to the platform
- Assign users to organizations
- Assign and modify user roles
- Activate/deactivate user accounts

### Activity Monitoring
- Track user actions across the platform
- View detailed activity logs
- Filter activities by type or date range
- Export activity logs for compliance purposes

## Technical Implementation

### Database Schema

#### Users Table
```sql
-- Existing users table with role and organization fields
```

#### User Activity Logs Table
```sql
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL
);
```

### API Endpoints

#### User Management
- `GET /api/admin/users` - List all users with pagination and filtering
- `GET /api/admin/users/:id` - Get detailed information about a specific user
- `PATCH /api/admin/users/:id` - Update user information (role, organization, status)
- `DELETE /api/admin/users/:id` - Deactivate a user account

#### User Invitations
- `POST /api/admin/users/invite` - Invite a new user to the platform

#### User Activity
- `GET /api/admin/users/:id/activity` - Get activity logs for a specific user

### Frontend Components

#### User List Page
- `UserList.tsx` - Main component for displaying and managing users
- `UserFilters.tsx` - Component for filtering the user list
- `InviteUserButton.tsx` - Component for inviting new users

#### User Detail Page
- `UserDetail.tsx` - Main component for displaying user details
- `UserHeader.tsx` - Component for displaying user header information
- `UserRoleForm.tsx` - Component for managing user roles
- `UserActivity.tsx` - Component for displaying user activity logs

### Activity Logging

The system uses a comprehensive activity logging mechanism to track user actions:

```typescript
logActivity({
  user_id: currentUser.id,
  action: 'update',
  entity_type: 'user',
  entity_id: targetUser.id,
  details: { changes },
  organization_id: targetUser.organization_id
});
```

## Security Considerations

### Access Control
- Only system administrators can access the user management features
- Row-level security policies restrict access to user data
- Organization administrators can only manage users within their organization

### Audit Logging
- All administrative actions are logged for audit purposes
- Logs include the actor, action, target, and detailed changes
- Logs are protected by row-level security policies

## Usage Examples

### Inviting a New User
1. Navigate to the Users page in the Admin dashboard
2. Click "Invite User"
3. Enter the user's email address
4. Select the user's organization and role
5. Click "Send Invitation"

### Changing a User's Role
1. Navigate to the user's detail page
2. Click "Edit Role"
3. Select the new role from the dropdown
4. Click "Save Changes"

### Viewing User Activity
1. Navigate to the user's detail page
2. Scroll to the Activity Log section
3. View the user's recent activities
4. Use filters to narrow down specific actions if needed

## Future Enhancements

1. **Advanced Permission System**: Implement a more granular permission system beyond basic roles
2. **Two-Factor Authentication**: Add 2FA support for enhanced security
3. **Bulk User Management**: Add support for managing multiple users at once
4. **Custom User Fields**: Allow organizations to define custom user fields
5. **Advanced Analytics**: Provide insights into user behavior and system usage
