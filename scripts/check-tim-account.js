#!/usr/bin/env node

/**
 * Check Tim's Account - Debug why he's seeing Zarfin name
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

class TimAccountChecker {
  async run() {
    console.log('🔍 Checking Tim\'s account: tim.mak@bulknutrition.eu\n');

    try {
      // Find Tim's user record
      const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error listing users:', listError);
        return;
      }

      const timUser = users.find(user => user.email === 'tim.mak@bulknutrition.eu');
      
      if (!timUser) {
        console.log('❌ Tim\'s account not found in auth.users');
        console.log('📋 Available users:');
        users.forEach(user => {
          console.log(`   - ${user.email}`);
        });
        return;
      }

      console.log('✅ Found Tim\'s account:');
      console.log(`   🆔 ID: ${timUser.id}`);
      console.log(`   📧 Email: ${timUser.email}`);
      console.log(`   📝 Metadata:`, JSON.stringify(timUser.user_metadata, null, 2));
      console.log(`   ⏰ Created: ${timUser.created_at}`);
      console.log(`   ✅ Confirmed: ${timUser.email_confirmed_at ? 'Yes' : 'No'}`);
      console.log('');

      // Check if Tim has any organization memberships
      const { data: memberships, error: membershipError } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          organizations (
            id,
            name,
            slug
          )
        `)
        .eq('user_id', timUser.id);

      if (membershipError) {
        console.warn('⚠️  Could not check organization memberships:', membershipError);
      } else {
        console.log('🏢 Organization memberships:');
        if (memberships.length === 0) {
          console.log('   📝 No organization memberships found');
        } else {
          memberships.forEach(membership => {
            console.log(`   - ${membership.organizations.name} (${membership.organizations.slug})`);
            console.log(`     Role: ${membership.role}`);
            console.log(`     ID: ${membership.organizations.id}`);
          });
        }
        console.log('');
      }

      // Check user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', timUser.id)
        .single();

      if (prefError) {
        console.log('📝 No user preferences found (this is normal)');
      } else {
        console.log('⚙️  User preferences:');
        console.log(`   Current org: ${preferences.current_organization_id}`);
        console.log(`   Theme: ${preferences.theme}`);
        console.log('');
      }

    } catch (error) {
      console.error('❌ Unexpected error:', error);
    }
  }
}

// Run the checker
const checker = new TimAccountChecker();
checker.run().catch(console.error);