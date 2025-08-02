/**
 * Connect Withcar User Script
 * 
 * This script should be run AFTER tim.mak88@gmail.com signs up
 * It will connect them to the existing Withcar organization
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('🚗 Connecting tim.mak88@gmail.com to Withcar organization...');
  
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
    // Check if tim.mak88@gmail.com exists
    const { data: users } = await supabase.auth.admin.listUsers();
    const withcarUser = users.users.find(u => u.email === 'tim.mak88@gmail.com');
    
    if (!withcarUser) {
      console.error('❌ User tim.mak88@gmail.com not found');
      console.log('📝 Please ensure tim.mak88@gmail.com has signed up first');
      process.exit(1);
    }
    
    const userId = withcarUser.id;
    console.log(`✅ Found user: tim.mak88@gmail.com (${userId})`);
    
    // Get Withcar organization
    const { data: withcarOrg } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'withcar')
      .single();
    
    if (!withcarOrg) {
      console.error('❌ Withcar organization not found');
      process.exit(1);
    }
    
    const orgId = withcarOrg.id;
    console.log(`✅ Found Withcar organization: ${orgId}`);
    
    // Check if user is already a member
    const { data: membership } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .single();
    
    if (membership) {
      console.log(`✅ User is already a member with role: ${membership.role}`);
    } else {
      // Add user as admin
      const { error: addMemberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: orgId,
          role: 'admin'
        });
      
      if (addMemberError) {
        console.error('❌ Error adding user to Withcar:', addMemberError);
        process.exit(1);
      }
      
      console.log('✅ Added tim.mak88@gmail.com to Withcar as admin');
    }
    
    // Set user preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: orgId,
        updated_at: new Date().toISOString()
      });
    
    if (prefsError) {
      console.error('❌ Error setting user preferences:', prefsError);
    } else {
      console.log('✅ Set user preferences for Withcar');
    }
    
    // Update organization ownership
    const { error: updateOrgError } = await supabase
      .from('organizations')
      .update({ created_by: userId })
      .eq('id', orgId);
    
    if (updateOrgError) {
      console.error('❌ Error updating organization ownership:', updateOrgError);
    } else {
      console.log('✅ Updated Withcar organization ownership');
    }
    
    console.log('\n🎉 Withcar user connection complete!');
    console.log('\n📊 Summary:');
    console.log(`• User: tim.mak88@gmail.com`);
    console.log(`• Organization: Withcar`);
    console.log(`• Role: admin`);
    console.log(`• Dashboard: Will show Withcar-specific navigation`);
    console.log('\n✅ tim.mak88@gmail.com can now log in and see the Withcar dashboard!');
    
  } catch (error) {
    console.error('❌ Connection failed:', error);
    process.exit(1);
  }
}

// Run the connection
main().catch(console.error);