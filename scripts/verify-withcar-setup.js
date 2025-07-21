const { createClient } = require('@supabase/supabase-js');

async function verifyWithcarSetup() {
  console.log('🔍 Verifying Withcar organization setup for tim.mak88@gmail.com...\n');

  // Initialize Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    return false;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // 1. Check if user exists
    console.log('1. Checking user account...');
    const { data: users, error: userError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000
    });

    if (userError) {
      console.error('❌ Error fetching users:', userError);
      return false;
    }

    const user = users.users.find(u => u.email === 'tim.mak88@gmail.com');
    if (!user) {
      console.error('❌ User tim.mak88@gmail.com not found in auth system');
      console.log('💡 Please create user account first in Supabase Auth dashboard');
      return false;
    }

    console.log(`✅ User found: ${user.email} (ID: ${user.id})`);
    const userId = user.id;

    // 2. Check if Withcar organization exists
    console.log('\n2. Checking Withcar organization...');
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('name', 'Withcar')
      .maybeSingle();

    if (orgError) {
      console.error('❌ Error checking Withcar organization:', orgError);
      return false;
    }

    let orgId;
    if (!orgData) {
      console.log('⚠️  Withcar organization not found, creating...');
      
      // Create organization with minimal required fields
      const { data: newOrg, error: createOrgError } = await supabase
        .from('organizations')
        .insert({
          name: 'Withcar',
          slug: 'withcar',
          created_by: userId
        })
        .select()
        .single();

      if (createOrgError) {
        console.error('❌ Error creating Withcar organization:', createOrgError);
        return false;
      }

      orgId = newOrg.id;
      console.log(`✅ Created Withcar organization (ID: ${orgId})`);
    } else {
      orgId = orgData.id;
      console.log(`✅ Withcar organization exists (ID: ${orgId})`);
    }

    // 3. Check if user is member of organization
    console.log('\n3. Checking organization membership...');
    const { data: memberData, error: memberError } = await supabase
      .from('organization_members')
      .select('*')
      .eq('user_id', userId)
      .eq('organization_id', orgId)
      .maybeSingle();

    if (memberError && memberError.code !== 'PGRST116') {
      console.error('❌ Error checking organization membership:', memberError);
      return false;
    }

    if (!memberData) {
      console.log('⚠️  User not in Withcar organization, adding...');
      
      const { error: addMemberError } = await supabase
        .from('organization_members')
        .insert({
          user_id: userId,
          organization_id: orgId,
          role: 'admin'
        });

      if (addMemberError) {
        console.error('❌ Error adding user to organization:', addMemberError);
        return false;
      }

      console.log('✅ Added tim.mak88@gmail.com to Withcar organization as admin');
    } else {
      console.log(`✅ User is member of Withcar organization (role: ${memberData.role})`);
    }

    // 4. Check email accounts
    console.log('\n4. Checking email accounts...');
    const { data: emailAccounts, error: emailError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (emailError) {
      console.error('❌ Error checking email accounts:', emailError);
    } else {
      console.log(`✅ Found ${emailAccounts?.length || 0} active email accounts:`);
      emailAccounts?.forEach(account => {
        console.log(`   - ${account.email} (${account.provider_type})`);
      });
    }

    // 5. Check Metakocka credentials setup
    console.log('\n5. Checking Metakocka integration settings...');
    const { data: metakockaCredentials, error: metakockaError } = await supabase
      .from('metakocka_credentials')
      .select('*')
      .eq('organization_id', orgId)
      .maybeSingle();

    if (metakockaError && metakockaError.code !== 'PGRST116') {
      console.error('❌ Error checking Metakocka credentials:', metakockaError);
    } else if (!metakockaCredentials) {
      console.log('⚠️  Metakocka credentials not configured yet');
      console.log('💡 You can add them tomorrow at: /settings/integrations/metakocka');
    } else {
      console.log('✅ Metakocka credentials configured');
      console.log(`   Company ID: ${metakockaCredentials.company_id}`);
      console.log(`   API Endpoint: ${metakockaCredentials.api_endpoint || 'Default'}`);
    }

    console.log('\n🎉 Withcar setup verification complete!');
    console.log('\n📋 Summary:');
    console.log(`✅ User: tim.mak88@gmail.com (${userId})`);
    console.log(`✅ Organization: Withcar (${orgId})`);
    console.log(`✅ Membership: admin role`);
    console.log(`✅ Email accounts: ${emailAccounts?.length || 0} connected`);
    console.log(`${metakockaCredentials ? '✅' : '⚠️'} Metakocka: ${metakockaCredentials ? 'configured' : 'pending setup'}`);

    return true;

  } catch (error) {
    console.error('💥 Error during verification:', error);
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  verifyWithcarSetup().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { verifyWithcarSetup }; 