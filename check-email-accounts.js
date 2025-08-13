/**
 * Script to check email accounts in the database
 * Run with: node check-email-accounts.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkEmailAccounts() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    return;
  }

  // Create Supabase client with service role key for admin access
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log('🔑 Connected to Supabase with admin privileges');

  try {
    // Get user ID - replace with your actual user ID if needed
    const userId = '5f7cf338-4ac1-4bd9-960a-d12dc6ffdb03';
    
    // Get organization ID from user preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', userId)
      .single();
    
    const organizationId = preferences?.current_organization_id;
    console.log(`🏢 User organization: ${organizationId || 'none'}`);

    // Check email accounts by organization ID
    if (organizationId) {
      const { data: orgAccounts, error: orgError } = await supabase
        .from('email_accounts')
        .select('*')
        .eq('organization_id', organizationId);
      
      console.log(`📧 Organization email accounts: ${orgAccounts?.length || 0}`);
      if (orgAccounts && orgAccounts.length > 0) {
        console.log('   First account:', {
          id: orgAccounts[0].id,
          email: orgAccounts[0].email,
          provider: orgAccounts[0].provider_type
        });
      }
      if (orgError) {
        console.error('   Error:', orgError);
      }
    }

    // Check email accounts by user ID
    const { data: userAccounts, error: userError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('user_id', userId);
    
    console.log(`📧 User email accounts: ${userAccounts?.length || 0}`);
    if (userAccounts && userAccounts.length > 0) {
      console.log('   First account:', {
        id: userAccounts[0].id,
        email: userAccounts[0].email,
        provider: userAccounts[0].provider_type
      });
    }
    if (userError) {
      console.error('   Error:', userError);
    }

    // Check all email accounts (admin view)
    const { data: allAccounts, error: allError } = await supabase
      .from('email_accounts')
      .select('*');
    
    console.log(`📧 All email accounts in database: ${allAccounts?.length || 0}`);
    if (allAccounts && allAccounts.length > 0) {
      console.log('   Accounts:', allAccounts.map(acc => ({
        id: acc.id,
        email: acc.email,
        user_id: acc.user_id,
        organization_id: acc.organization_id
      })));
    }
    if (allError) {
      console.error('   Error:', allError);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkEmailAccounts();

