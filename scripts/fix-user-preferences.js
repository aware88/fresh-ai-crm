/**
 * Fix User Preferences Script
 * 
 * This script updates user preferences for existing users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('🔧 Fixing user preferences...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // Get the Bulk Nutrition user and organization
    const { data: users } = await supabase.auth.admin.listUsers();
    const bulkUser = users.users.find(u => u.email === 'tim.mak@bulknutrition.eu');
    
    const { data: bulkOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', 'bulk-nutrition')
      .single();
    
    if (bulkUser && bulkOrg) {
      // Update existing user preferences
      const { error: updateError } = await supabase
        .from('user_preferences')
        .update({
          current_organization_id: bulkOrg.id,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', bulkUser.id);
      
      if (updateError) {
        console.error('❌ Error updating user preferences:', updateError);
      } else {
        console.log('✅ Updated user preferences for tim.mak@bulknutrition.eu');
      }
    }
    
    // Check current state
    console.log('\n📊 Current State:');
    console.log('==========================================');
    
    const { data: memberships } = await supabase
      .from('organization_members')
      .select(`
        user_id,
        role,
        organizations(name, slug),
        users(email)
      `);
    
    for (const membership of memberships || []) {
      console.log(`• ${membership.users?.email || 'Unknown'}`);
      console.log(`  - Organization: ${membership.organizations?.name}`);
      console.log(`  - Role: ${membership.role}`);
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
main().catch(console.error);