/**
 * Script to directly add data to the database
 * Run with: node add-real-data.js
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function addRealData() {
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

    if (!organizationId) {
      console.error('❌ No organization found for user. Cannot proceed.');
      return;
    }

    const timestamp = new Date().toISOString();
    
    // 1. Add contacts - first check schema
    const { data: contactColumns } = await supabase
      .from('contacts')
      .select()
      .limit(1);
    
    console.log('📋 Checking contacts schema...');
    
    // Try different column combinations for contacts
    const contactsOptions = [
      // Option 1: firstname/lastname
      Array(10).fill(0).map((_, i) => ({
        firstname: `Contact ${i + 1}`,
        lastname: `Sample`,
        email: `contact${i + 1}@example.com`,
        phone: `+1555${100000 + i}`,
        organization_id: organizationId
      })),
      
      // Option 2: first_name/last_name
      Array(10).fill(0).map((_, i) => ({
        first_name: `Contact ${i + 1}`,
        last_name: `Sample`,
        email: `contact${i + 1}@example.com`,
        phone: `+1555${100000 + i}`,
        organization_id: organizationId
      })),
      
      // Option 3: name only
      Array(10).fill(0).map((_, i) => ({
        name: `Contact ${i + 1} Sample`,
        email: `contact${i + 1}@example.com`,
        phone: `+1555${100000 + i}`,
        organization_id: organizationId
      }))
    ];
    
    // Try each option until one works
    let contactsAdded = false;
    for (const contacts of contactsOptions) {
      try {
        const { error } = await supabase.from('contacts').insert(contacts);
        if (!error) {
          console.log('✅ Added 10 contacts successfully');
          contactsAdded = true;
          break;
        }
      } catch (error) {
        console.log('❌ Contact option failed:', error.message);
      }
    }
    
    if (!contactsAdded) {
      console.log('❌ Failed to add contacts with any schema option');
    }

    // 2. Add email account - first check schema
    const { data: emailColumns } = await supabase
      .from('email_accounts')
      .select()
      .limit(1);
    
    console.log('📋 Checking email_accounts schema...');
    
    // Create email account based on schema
    const emailAccount = {
      email: 'demo@example.com',
      provider_type: 'imap',
      is_active: true,
      organization_id: organizationId,
      user_id: userId,
      created_at: timestamp,
      updated_at: timestamp,
    };
    
    // Add optional fields if they exist in schema
    if (emailColumns && emailColumns[0]) {
      if ('display_name' in emailColumns[0]) emailAccount.display_name = 'Demo Account';
      if ('created_by' in emailColumns[0]) emailAccount.created_by = userId;
      if ('updated_by' in emailColumns[0]) emailAccount.updated_by = userId;
      if ('access_token' in emailColumns[0]) emailAccount.access_token = 'sample_token';
      if ('refresh_token' in emailColumns[0]) emailAccount.refresh_token = 'sample_refresh_token';
      if ('token_expires_at' in emailColumns[0]) emailAccount.token_expires_at = new Date(Date.now() + 86400000).toISOString();
    }

    // Contacts are now handled in the schema detection code above

    // Insert email account
    const { data: emailData, error: emailError } = await supabase
      .from('email_accounts')
      .insert(emailAccount);

    if (emailError) {
      console.error('❌ Error inserting email account:', emailError);
    } else {
      console.log('✅ Added email account successfully');
    }

    console.log('✅ Data insertion complete. Please refresh your dashboard!');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addRealData();
