/**
 * Manual Organization Setup Test
 * 
 * This script can be run in the browser console after signing up as an organization admin
 * to verify that the organization was created correctly and roles were assigned properly.
 * 
 * How to use:
 * 1. Sign up as an organization admin on the sign-up page
 * 2. After successful sign-up, open the browser console
 * 3. Copy and paste this entire script into the console
 * 4. The test will run and display the results
 */

async function testOrganizationSetup() {
  console.log('=== Organization Setup Verification Test ===');
  
  // Step 1: Check if user is authenticated
  console.log('\n1. Checking authentication status...');
  const { data: { session } } = await window.supabase.auth.getSession();
  
  if (!session) {
    console.error('❌ Not authenticated. Please sign in first.');
    return;
  }
  
  console.log('✅ Authenticated as: ' + session.user.email);
  const userId = session.user.id;
  console.log('User ID: ' + userId);
  
  // Step 2: Check user metadata for organization admin flag
  console.log('\n2. Checking user metadata...');
  const userMetadata = session.user.user_metadata;
  
  if (userMetadata.is_organization_admin) {
    console.log('✅ User is marked as organization admin in metadata');
  } else {
    console.log('❓ User is not marked as organization admin in metadata');
  }
  
  // Step 3: Fetch user's organizations
  console.log('\n3. Fetching user organizations...');
  const { data: userOrgs, error: userOrgsError } = await window.supabase
    .from('user_organizations')
    .select('organization_id, role')
    .eq('user_id', userId);
  
  if (userOrgsError) {
    console.error('❌ Failed to fetch user organizations:', userOrgsError);
  } else if (!userOrgs || userOrgs.length === 0) {
    console.error('❌ User is not associated with any organizations');
  } else {
    console.log(`✅ User belongs to ${userOrgs.length} organization(s):`);
    console.table(userOrgs);
    
    // Step 4: Fetch organization details
    console.log('\n4. Fetching organization details...');
    const orgIds = userOrgs.map(org => org.organization_id);
    
    for (const orgId of orgIds) {
      const { data: org, error: orgError } = await window.supabase
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .single();
      
      if (orgError) {
        console.error(`❌ Failed to fetch organization ${orgId}:`, orgError);
      } else {
        console.log('✅ Organization details:');
        console.table(org);
        
        // Check subscription plan
        if (org.subscription_tier) {
          console.log(`✅ Organization has subscription plan: ${org.subscription_tier} (${org.subscription_status})`);
        } else {
          console.log('❌ Organization does not have a subscription plan');
        }
      }
    }
  }
  
  // Step 5: Check user roles
  console.log('\n5. Checking user roles...');
  const { data: roles, error: rolesError } = await window.supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);
  
  if (rolesError) {
    console.error('❌ Failed to fetch user roles:', rolesError);
  } else if (!roles || roles.length === 0) {
    console.error('❌ User has no roles assigned');
  } else {
    console.log(`✅ User has ${roles.length} role(s) assigned`);
    
    // Fetch role details
    const roleIds = roles.map(r => r.role_id);
    const { data: roleDetails, error: roleDetailsError } = await window.supabase
      .from('roles')
      .select('*')
      .in('id', roleIds);
    
    if (roleDetailsError) {
      console.error('❌ Failed to fetch role details:', roleDetailsError);
    } else {
      console.log('✅ Role details:');
      console.table(roleDetails);
      
      // Check for admin and owner roles
      const roleNames = roleDetails.map(r => r.name);
      const hasAdminRole = roleNames.includes('admin');
      const hasOwnerRole = roleNames.includes('owner');
      
      if (hasAdminRole) {
        console.log('✅ User has admin role');
      } else {
        console.log('❌ User does not have admin role');
      }
      
      if (hasOwnerRole) {
        console.log('✅ User has owner role');
      } else {
        console.log('❌ User does not have owner role');
      }
    }
  }
  
  // Step 6: Check permissions
  console.log('\n6. Checking user permissions...');
  try {
    const response = await fetch('/api/users/permissions', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    
    if (!response.ok) {
      console.error('❌ Failed to fetch permissions:', response.statusText);
    } else {
      const permissionsData = await response.json();
      console.log('✅ User permissions:');
      console.log(permissionsData.permissions);
      
      // Check for admin permissions
      const hasAdminPermissions = permissionsData.permissions.some(p => p.includes('admin.'));
      if (hasAdminPermissions) {
        console.log('✅ User has admin permissions');
      } else {
        console.log('❌ User does not have admin permissions');
      }
    }
  } catch (error) {
    console.error('❌ Error checking permissions:', error);
  }
  
  console.log('\n=== Test Complete ===');
}

// Run the test
testOrganizationSetup().catch(error => {
  console.error('Test failed with error:', error);
});
