/**
 * Test script for role-based access control
 */

// Import required modules
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data
let testUserId;
let testOrgId;
let systemAdminRoleId;
let orgAdminRoleId;
let customRoleId;

// Helper functions
async function createTestUser() {
  const { data, error } = await supabase.auth.admin.createUser({
    email: `test-user-${Date.now()}@example.com`,
    password: 'password123',
    email_confirm: true
  });
  
  if (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
  
  return data.user.id;
}

async function createTestOrganization() {
  const { data, error } = await supabase
    .from('organizations')
    .insert({
      name: `Test Organization ${Date.now()}`,
      slug: `test-org-${Date.now()}`
    })
    .select('id')
    .single();
  
  if (error) {
    console.error('Error creating test organization:', error);
    throw error;
  }
  
  return data.id;
}

async function getRoleByName(name) {
  const { data, error } = await supabase
    .from('roles')
    .select('id')
    .eq('name', name)
    .single();
  
  if (error) {
    console.error(`Error getting role ${name}:`, error);
    throw error;
  }
  
  return data.id;
}

async function assignRoleToUser(userId, roleId) {
  const { error } = await supabase
    .from('user_roles')
    .insert({
      user_id: userId,
      role_id: roleId
    });
  
  if (error) {
    console.error('Error assigning role to user:', error);
    throw error;
  }
}

async function checkUserHasPermission(userId, permissionName) {
  // First get all roles for the user
  const { data: userRoles, error: rolesError } = await supabase
    .from('user_roles')
    .select('role_id')
    .eq('user_id', userId);

  if (rolesError) {
    console.error('Error fetching user roles:', rolesError);
    throw rolesError;
  }

  if (userRoles.length === 0) return false;

  // Get the permission ID
  const { data: permission, error: permError } = await supabase
    .from('permissions')
    .select('id')
    .eq('name', permissionName)
    .single();

  if (permError) {
    console.error('Error fetching permission:', permError);
    throw permError;
  }

  // Check if any role has this permission
  const roleIds = userRoles.map(ur => ur.role_id);
  const { data: rolePermissions, error: permissionsError } = await supabase
    .from('role_permissions')
    .select('*')
    .in('role_id', roleIds)
    .eq('permission_id', permission.id);

  if (permissionsError) {
    console.error('Error fetching role permissions:', permissionsError);
    throw permissionsError;
  }

  return rolePermissions.length > 0;
}

async function cleanup() {
  // Clean up user roles
  if (testUserId) {
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', testUserId);
  }
  
  // We don't delete the roles or permissions as they are part of the system
  
  // Clean up test organization
  if (testOrgId) {
    await supabase
      .from('organizations')
      .delete()
      .eq('id', testOrgId);
  }
  
  // Clean up test user
  if (testUserId) {
    await supabase.auth.admin.deleteUser(testUserId);
  }
}

async function runTests() {
  try {
    console.log('Starting role-based access control tests...');
    
    // Setup test data
    testUserId = await createTestUser();
    console.log(`Created test user with ID: ${testUserId}`);
    
    testOrgId = await createTestOrganization();
    console.log(`Created test organization with ID: ${testOrgId}`);
    
    // Get role IDs
    systemAdminRoleId = await getRoleByName('System Administrator');
    console.log(`System Admin role ID: ${systemAdminRoleId}`);
    
    orgAdminRoleId = await getRoleByName('Organization Administrator');
    console.log(`Organization Admin role ID: ${orgAdminRoleId}`);
    
    // Test 1: User with no roles should have no permissions
    console.log('\nTest 1: User with no roles');
    const hasAdminAccess1 = await checkUserHasPermission(testUserId, 'admin.access');
    console.log(`User has admin.access permission: ${hasAdminAccess1}`);
    console.assert(hasAdminAccess1 === false, 'User should not have admin access');
    
    // Test 2: Assign system admin role and check permissions
    console.log('\nTest 2: User with system admin role');
    await assignRoleToUser(testUserId, systemAdminRoleId);
    console.log(`Assigned System Admin role to user`);
    
    const hasAdminAccess2 = await checkUserHasPermission(testUserId, 'admin.access');
    console.log(`User has admin.access permission: ${hasAdminAccess2}`);
    console.assert(hasAdminAccess2 === true, 'User should have admin access');
    
    const hasOrgSettings = await checkUserHasPermission(testUserId, 'organization.settings.edit');
    console.log(`User has organization.settings.edit permission: ${hasOrgSettings}`);
    console.assert(hasOrgSettings === true, 'System admin should have organization settings permission');
    
    // Remove system admin role
    await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', testUserId)
      .eq('role_id', systemAdminRoleId);
    console.log('Removed System Admin role from user');
    
    // Test 3: Assign organization admin role and check permissions
    console.log('\nTest 3: User with organization admin role');
    await assignRoleToUser(testUserId, orgAdminRoleId);
    console.log(`Assigned Organization Admin role to user`);
    
    const hasAdminAccess3 = await checkUserHasPermission(testUserId, 'admin.access');
    console.log(`User has admin.access permission: ${hasAdminAccess3}`);
    console.assert(hasAdminAccess3 === false, 'Org admin should not have admin access');
    
    const hasOrgSettings2 = await checkUserHasPermission(testUserId, 'organization.settings.edit');
    console.log(`User has organization.settings.edit permission: ${hasOrgSettings2}`);
    console.assert(hasOrgSettings2 === true, 'Org admin should have organization settings permission');
    
    console.log('\nAll tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    // Clean up
    await cleanup();
    console.log('\nTest cleanup completed');
  }
}

// Run the tests
runTests();
