# Organization Setup Implementation Guide

## Overview

This document details the technical implementation of the streamlined organization setup process in Fresh AI CRM. It covers the code changes, API endpoints, and integration points required to support both individual users and organization-based multi-tenant usage.

## Architecture Components

The organization setup implementation consists of the following key components:

1. **Enhanced Sign-Up Form**: A tabbed interface allowing users to choose between individual and organization sign-up
2. **Organization API**: Backend endpoint for creating and managing organizations
3. **Role Service**: Service for assigning and managing user roles
4. **Subscription Service**: Service for managing subscription tiers and feature access

## Code Implementation

### 1. Enhanced Sign-Up Form

The sign-up form (`SignUpForm.tsx`) was enhanced to support both individual and organization sign-up flows:

```typescript
// Key components of the enhanced sign-up form
export default function SignUpForm() {
  // State for user details
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  
  // State for organization details
  const [signupTab, setSignupTab] = useState('individual');
  const [isAdmin, setIsAdmin] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgSlug, setOrgSlug] = useState('');
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');

  // Auto-generate slug from organization name
  const handleOrgNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setOrgName(name);
    
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(name));
    }
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Step 1: Create user account
    const { data: userData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          is_organization_admin: isAdmin && signupTab === 'organization',
          full_name: `${firstName} ${lastName}`.trim()
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    // Step 2: Create organization if applicable
    if (isAdmin && signupTab === 'organization' && userData.user) {
      try {
        const response = await fetch('/api/admin/organizations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: orgName,
            slug: orgSlug,
            admin_user_id: userData.user.id,
            subscription_plan: subscriptionPlan
          })
        });
        
        // Handle response and errors
      } catch (orgError) {
        // Error handling
      }
    }
  };
}
```

### 2. Organization API Endpoint

The organization API endpoint (`/api/admin/organizations/route.ts`) was enhanced to support organization creation during sign-up:

```typescript
// POST /api/admin/organizations - Create a new organization
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, admin_user_id, subscription_plan } = body;
    let isSignupFlow = false;
    
    // Check if this is from sign-up flow or admin panel
    if (!admin_user_id) {
      // Regular admin flow - check permissions
      const auth = await requirePermission('admin.organizations.create');
      if (!auth.success) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }
    } else {
      isSignupFlow = true;
    }

    // Validate input and check slug uniqueness
    
    // Prepare organization data with subscription plan if provided
    const orgData: any = { name, slug };
    if (subscription_plan) {
      orgData.subscription_tier = subscription_plan;
      orgData.subscription_status = 'active';
    }

    // Create the organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .insert(orgData)
      .select()
      .single();
    
    // Assign admin role to user if from sign-up flow
    if (isSignupFlow && admin_user_id && organization) {
      // Add user to organization with admin role
      await supabase
        .from('user_organizations')
        .insert({
          user_id: admin_user_id,
          organization_id: organization.id,
          role: 'admin'
        });
      
      // Get and assign admin and owner roles
      const { data: adminRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();
        
      const { data: ownerRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'owner')
        .single();
      
      // Assign roles to user
      if (adminRole?.id) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: admin_user_id,
            role_id: adminRole.id
          });
      }
      
      if (ownerRole?.id) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: admin_user_id,
            role_id: ownerRole.id
          });
      }
    }

    return NextResponse.json({ organization }, { status: 201 });
  } catch (error) {
    console.error('Error in organization creation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Database Schema

The organization setup relies on the following database tables:

### Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Organizations Table

```sql
CREATE TABLE user_organizations (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, organization_id)
);
```

### Roles Table

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### User Roles Table

```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

## Integration with Subscription System

The organization setup integrates with the existing subscription system, which includes:

1. **Subscription Tiers**: Free, Starter, Pro, Business, Enterprise
2. **Feature Flags**: Control access to features based on subscription tier
3. **Usage Limits**: Enforce user and contact limits based on subscription tier

During organization creation, the selected subscription plan is assigned to the organization, which determines the available features and limits.

## Multi-tenant Data Isolation

The Fresh AI CRM system maintains strict multi-tenant data isolation through:

1. **Row-Level Security (RLS)**: Database policies that restrict data access based on user and organization
2. **Organization Context**: API endpoints include organization context in requests
3. **Role-Based Access Control**: Permissions are enforced based on user roles within organizations

## Testing

The organization setup implementation can be tested using the following approaches:

1. **End-to-End Testing**: Test the complete sign-up flow from user creation to organization setup
2. **API Testing**: Test the organization API endpoint with various input scenarios
3. **Role Assignment Testing**: Verify that roles are correctly assigned to users

## Deployment Considerations

When deploying the organization setup implementation, consider the following:

1. **Database Migrations**: Ensure all required tables and relationships exist
2. **Environment Variables**: Configure authentication and API endpoints correctly
3. **Error Handling**: Implement robust error handling for edge cases
4. **Monitoring**: Set up monitoring for organization creation and role assignment

## Future Enhancements

Potential future enhancements to the organization setup process include:

1. **Multi-step Onboarding**: Guide users through organization setup with a multi-step wizard
2. **Team Invitation**: Allow admins to invite team members during initial setup
3. **Template Selection**: Provide organization templates with pre-configured settings
4. **SSO Integration**: Support single sign-on for enterprise organizations
5. **Custom Domains**: Allow organizations to use custom domains for their workspace

## Conclusion

The streamlined organization setup implementation provides a seamless experience for users to create and manage organizations within Fresh AI CRM. By integrating user creation, organization setup, and role assignment into a single flow, the system reduces friction and improves the onboarding experience while maintaining proper security and access controls.
