/**
 * Delete User Script
 *
 * This script deletes a user account and associated data from the system.
 * Usage: node delete-user.js <user_email>
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Read arguments
const userEmail = process.argv[2];

// Validate input
if (!userEmail) {
  console.error('Usage: node delete-user.js <user_email>');
  process.exit(1);
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  try {
    console.log(`Deleting user account: ${userEmail}`);
    
    // Find the user by email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', userEmail)
      .single();
    
    if (userError || !userData) {
      console.error(`User not found: ${userEmail}`);
      console.error(userError);
      process.exit(1);
    }
    
    const userId = userData.id;
    console.log(`Found user with ID: ${userId}`);
    
    // Find organization(s) created by the user
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id')
      .eq('created_by', userId);
    
    if (orgError) {
      console.error('Error finding organizations:', orgError);
    } else if (orgData && orgData.length > 0) {
      console.log(`Found ${orgData.length} organization(s) to delete`);
      
      for (const org of orgData) {
        // Delete organization-related data (cascade should handle most relationships)
        console.log(`Deleting organization with ID: ${org.id}`);
        
        // Delete feature flags for organization
        const { error: featureError } = await supabase
          .from('feature_flags')
          .delete()
          .eq('organization_id', org.id);
          
        if (featureError) {
          console.error(`Error deleting feature flags for org ${org.id}:`, featureError);
        } else {
          console.log(`✅ Deleted feature flags for organization: ${org.id}`);
        }
        
        // Delete organization itself
        const { error: deleteOrgError } = await supabase
          .from('organizations')
          .delete()
          .eq('id', org.id);
          
        if (deleteOrgError) {
          console.error(`Error deleting organization ${org.id}:`, deleteOrgError);
        } else {
          console.log(`✅ Deleted organization: ${org.id}`);
        }
      }
    }
    
    // Delete Metakocka credentials
    const { error: credError } = await supabase
      .from('metakocka_credentials')
      .delete()
      .eq('user_id', userId);
      
    if (credError) {
      console.error('Error deleting Metakocka credentials:', credError);
    } else {
      console.log(`✅ Deleted Metakocka credentials for user: ${userId}`);
    }
    
    // Delete user from auth.users (requires admin access)
    const { error: authError } = await supabase.auth.admin.deleteUser(userId);
    
    if (authError) {
      console.error('Error deleting user from auth.users:', authError);
    } else {
      console.log(`✅ Deleted user from auth system: ${userId}`);
    }
    
    // Finally delete the user from public.users
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteUserError) {
      console.error('Error deleting user:', deleteUserError);
    } else {
      console.log(`✅ Deleted user: ${userId}`);
    }
    
    console.log('User deletion completed!');
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

main();
