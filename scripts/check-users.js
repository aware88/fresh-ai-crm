/**
 * Check Current Users Script
 * 
 * This script lists all current users in the system
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('👥 Checking current users in the system...');
  
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
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }
    
    console.log(`\n📊 Found ${users.users.length} users:`);
    console.log('==========================================');
    
    for (const user of users.users) {
      console.log(`• ${user.email} (${user.id})`);
      console.log(`  - Confirmed: ${user.email_confirmed_at ? '✅' : '❌'}`);
      console.log(`  - Created: ${new Date(user.created_at).toLocaleDateString()}`);
      
      // Check if user has organization memberships
      const { data: memberships } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name, slug)')
        .eq('user_id', user.id);
      
      if (memberships && memberships.length > 0) {
        console.log(`  - Organizations:`);
        for (const membership of memberships) {
          console.log(`    - ${membership.organizations.name} (${membership.role})`);
        }
      } else {
        console.log(`  - Organizations: None`);
      }
      console.log('');
    }
    
    // Check for specific users we're interested in
    console.log('\n🔍 Checking specific users:');
    console.log('==========================================');
    
    const timMakGmail = users.users.find(u => u.email === 'tim.mak88@gmail.com');
    const timMakBulk = users.users.find(u => u.email === 'tim.mak@bulknutrition.eu');
    
    console.log(`tim.mak88@gmail.com: ${timMakGmail ? '✅ Found' : '❌ Not found'}`);
    console.log(`tim.mak@bulknutrition.eu: ${timMakBulk ? '✅ Found' : '❌ Not found'}`);
    
    // Check organizations
    console.log('\n🏢 Current Organizations:');
    console.log('==========================================');
    
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, slug, created_by');
    
    if (orgsError) {
      console.error('❌ Error fetching organizations:', orgsError);
    } else {
      for (const org of orgs) {
        console.log(`• ${org.name} (${org.slug})`);
        console.log(`  - ID: ${org.id}`);
        console.log(`  - Created by: ${org.created_by}`);
        
        // Get member count
        const { count } = await supabase
          .from('organization_members')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', org.id);
        
        console.log(`  - Members: ${count || 0}`);
        console.log('');
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
main().catch(console.error);