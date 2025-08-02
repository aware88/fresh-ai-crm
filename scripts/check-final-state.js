/**
 * Check Final State Script
 * 
 * This script checks the final state of all organizations and users
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('📊 Checking final state...');
  
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
    // Get all users with their organizations
    const { data: users } = await supabase.auth.admin.listUsers();
    
    console.log('\n👥 Users and Organizations:');
    console.log('==========================================');
    
    for (const user of users.users) {
      console.log(`• ${user.email} (${user.id})`);
      
      // Get organization memberships
      const { data: memberships } = await supabase
        .from('organization_members')
        .select(`
          role,
          organizations(name, slug)
        `)
        .eq('user_id', user.id);
      
      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          console.log(`  - ${membership.organizations.name} (${membership.role})`);
        }
      } else {
        console.log(`  - No organizations`);
      }
      
      // Get user preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('current_organization_id')
        .eq('user_id', user.id)
        .single();
      
      if (prefs && prefs.current_organization_id) {
        const { data: currentOrg } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', prefs.current_organization_id)
          .single();
        
        console.log(`  - Current: ${currentOrg?.name || 'Unknown'}`);
      }
      
      console.log('');
    }
    
    // Summary for dashboard behavior
    console.log('\n🎯 Dashboard Behavior:');
    console.log('==========================================');
    
    const bulkUser = users.users.find(u => u.email === 'tim.mak@bulknutrition.eu');
    if (bulkUser) {
      const { data: bulkMembership } = await supabase
        .from('organization_members')
        .select('organizations(name, slug)')
        .eq('user_id', bulkUser.id)
        .single();
      
      if (bulkMembership && bulkMembership.organizations.slug === 'bulk-nutrition') {
        console.log('✅ tim.mak@bulknutrition.eu → Full dashboard (default navigation)');
      }
    }
    
    console.log('⏳ tim.mak88@gmail.com → Withcar dashboard (when signs up)');
    
    console.log('\n📝 Next Steps:');
    console.log('1. tim.mak@bulknutrition.eu can log in now');
    console.log('2. tim.mak88@gmail.com needs to sign up with organization "Withcar"');
    console.log('3. Dashboard will automatically detect organization and show appropriate navigation');
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
main().catch(console.error);