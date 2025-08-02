/**
 * Setup Withcar User and Organization Connection
 * 
 * This script ensures tim.mak88@gmail.com is properly connected to the Withcar organization
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function main() {
  console.log('🚗 Setting up Withcar user and organization connection...');
  
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
    // 1. Check if tim.mak88@gmail.com exists in auth.users
    console.log('📋 Step 1: Checking if tim.mak88@gmail.com exists...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      process.exit(1);
    }
    
    const user = users.users.find(u => u.email === 'tim.mak88@gmail.com');
    
    if (!user) {
      console.error('❌ User tim.mak88@gmail.com not found in auth system');
      console.log('📝 Please sign up tim.mak88@gmail.com first through the web interface');
      process.exit(1);
    }
    
    const userId = user.id;
    console.log(`✅ Found user: tim.mak88@gmail.com (${userId})`);
    
    // 2. Find or create Withcar organization
    console.log('📋 Step 2: Finding or creating Withcar organization...');
    
    let { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .eq('name', 'Withcar')
      .single();
    
    let orgId;
    
    if (orgError && orgError.code === 'PGRST116') {
      // Organization doesn't exist, create it
      console.log('Creating new Withcar organization...');
      
      const { data: newOrgData, error: newOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Withcar',
          slug: 'withcar',
          subscription_tier: 'business',
          subscription_status: 'active',
          created_by: userId
        })
        .select('id')
        .single();
      
      if (newOrgError) {
        console.error('❌ Error creating organization:', newOrgError);
        process.exit(1);
      }
      
      orgId = newOrgData.id;
      console.log(`✅ Created new Withcar organization with ID: ${orgId}`);
    } else if (orgError) {
      console.error('❌ Error finding organization:', orgError);
      process.exit(1);
    } else {
      orgId = orgData.id;
      console.log(`✅ Found existing Withcar organization with ID: ${orgId}`);
    }
    
    // 3. Check if user is already a member of the organization
    console.log('📋 Step 3: Checking organization membership...');
    
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('user_id, role')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .single();
    
    if (membershipError && membershipError.code === 'PGRST116') {
      // User is not a member, add them as admin
      console.log('Adding tim.mak88@gmail.com to Withcar organization as admin...');
      
      const { error: addMemberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: orgId,
          role: 'admin'
        });
      
      if (addMemberError) {
        console.error('❌ Error adding user to organization:', addMemberError);
        process.exit(1);
      }
      
      console.log('✅ Added tim.mak88@gmail.com to Withcar organization as admin');
    } else if (membershipError) {
      console.error('❌ Error checking membership:', membershipError);
      process.exit(1);
    } else {
      console.log(`✅ User is already a member with role: ${membership.role}`);
    }
    
    // 4. Update user preferences to set current organization
    console.log('📋 Step 4: Setting user preferences...');
    
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .upsert({
        user_id: userId,
        current_organization_id: orgId,
        updated_at: new Date().toISOString()
      });
    
    if (prefsError) {
      console.error('❌ Error setting user preferences:', prefsError);
      // Don't exit, this is not critical
    } else {
      console.log('✅ Set user preferences to use Withcar organization');
    }
    
    // 5. Summary
    console.log('\n🎉 Withcar user setup complete!');
    console.log('\n📊 Setup Summary:');
    console.log(`• User: tim.mak88@gmail.com (${userId})`);
    console.log(`• Organization: Withcar (${orgId})`);
    console.log(`• Role: admin`);
    console.log(`• Dashboard: Will show Withcar-specific navigation`);
    
    console.log('\n✅ tim.mak88@gmail.com can now log in and will see the Withcar dashboard!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run the setup
main().catch(console.error);