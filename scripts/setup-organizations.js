/**
 * Setup Organizations Script
 * 
 * This script sets up both Bulk Nutrition and Withcar organizations
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('🏢 Setting up organizations...');
  
  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    // 1. Set up Bulk Nutrition for tim.mak@bulknutrition.eu
    console.log('📋 Step 1: Setting up Bulk Nutrition organization...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }
    
    const bulkUser = users.users.find(u => u.email === 'tim.mak@bulknutrition.eu');
    
    if (!bulkUser) {
      console.error('❌ User tim.mak@bulknutrition.eu not found');
      process.exit(1);
    }
    
    const bulkUserId = bulkUser.id;
    console.log(`✅ Found user: tim.mak@bulknutrition.eu (${bulkUserId})`);
    
    // Get Bulk Nutrition organization
    const { data: bulkOrg, error: bulkOrgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'bulk-nutrition')
      .single();
    
    if (bulkOrgError) {
      console.error('❌ Error finding Bulk Nutrition organization:', bulkOrgError);
      process.exit(1);
    }
    
    const bulkOrgId = bulkOrg.id;
    console.log(`✅ Found Bulk Nutrition organization: ${bulkOrgId}`);
    
    // Check if user is already a member
    const { data: bulkMembership, error: bulkMembershipError } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('user_id', bulkUserId)
      .eq('organization_id', bulkOrgId)
      .single();
    
    if (bulkMembershipError && bulkMembershipError.code === 'PGRST116') {
      // User is not a member, add them as admin
      console.log('Adding tim.mak@bulknutrition.eu to Bulk Nutrition as admin...');
      
      const { error: addBulkMemberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: bulkUserId,
          organization_id: bulkOrgId,
          role: 'admin'
        });
      
      if (addBulkMemberError) {
        console.error('❌ Error adding user to Bulk Nutrition:', addBulkMemberError);
        process.exit(1);
      }
      
      console.log('✅ Added tim.mak@bulknutrition.eu to Bulk Nutrition as admin');
    } else if (bulkMembershipError) {
      console.error('❌ Error checking Bulk Nutrition membership:', bulkMembershipError);
      process.exit(1);
    } else {
      console.log(`✅ User is already a member of Bulk Nutrition with role: ${bulkMembership.role}`);
    }
    
    // Set user preferences for Bulk Nutrition
    const { error: bulkPrefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: bulkUserId,
        current_organization_id: bulkOrgId,
        updated_at: new Date().toISOString()
      });
    
    if (bulkPrefsError) {
      console.error('❌ Error setting Bulk Nutrition user preferences:', bulkPrefsError);
    } else {
      console.log('✅ Set user preferences for Bulk Nutrition');
    }
    
    // 2. Update organization created_by for Bulk Nutrition
    console.log('📋 Step 2: Updating Bulk Nutrition organization ownership...');
    
    const { error: updateBulkOrgError } = await supabase
      .from('organizations')
      .update({ created_by: bulkUserId })
      .eq('id', bulkOrgId);
    
    if (updateBulkOrgError) {
      console.error('❌ Error updating Bulk Nutrition organization:', updateBulkOrgError);
    } else {
      console.log('✅ Updated Bulk Nutrition organization ownership');
    }
    
    // 3. Prepare message for Withcar setup
    console.log('\n📋 Step 3: Withcar setup instructions...');
    
    const { data: withcarOrg, error: withcarOrgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('slug', 'withcar')
      .single();
    
    if (withcarOrgError) {
      console.error('❌ Error finding Withcar organization:', withcarOrgError);
    } else {
      console.log(`✅ Withcar organization ready: ${withcarOrg.id}`);
      console.log('⚠️  Waiting for tim.mak88@gmail.com to sign up...');
    }
    
    // Summary
    console.log('\n🎉 Organization setup complete!');
    console.log('\n📊 Setup Summary:');
    console.log('==========================================');
    console.log('✅ Bulk Nutrition:');
    console.log(`   • User: tim.mak@bulknutrition.eu`);
    console.log(`   • Organization: Bulk Nutrition (${bulkOrgId})`);
    console.log(`   • Role: admin`);
    console.log(`   • Dashboard: Will show full navigation (default)`);
    
    console.log('\n⏳ Withcar (pending):');
    console.log(`   • User: tim.mak88@gmail.com (needs to sign up)`);
    console.log(`   • Organization: Withcar (${withcarOrg?.id || 'ready'})`);
    console.log(`   • Role: admin (when user signs up)`);
    console.log(`   • Dashboard: Will show Withcar-specific navigation`);
    
    console.log('\n📝 Next Steps:');
    console.log('1. tim.mak@bulknutrition.eu can log in and see full dashboard');
    console.log('2. tim.mak88@gmail.com needs to sign up as organization admin');
    console.log('3. When signing up, tim.mak88@gmail.com should:');
    console.log('   - Select "Organization Admin" tab');
    console.log('   - Enter organization name: "Withcar"');
    console.log('   - System will connect to existing Withcar organization');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main().catch(console.error);