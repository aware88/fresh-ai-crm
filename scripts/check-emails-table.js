const { createClient } = require('@supabase/supabase-js');

async function checkEmailsTable() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Checking emails table...\n');
    
    // Check if table exists and get some sample data
    const { data: emailsData, error: emailsError } = await supabase
      .from('emails')
      .select('*')
      .limit(3);
    
    if (emailsError) {
      console.error('❌ Error querying emails table:', emailsError);
      
      if (emailsError.code === '42P01') {
        console.log('💡 emails table does not exist. You need to create it.');
        return;
      }
      
      console.log('💡 There might be an issue with the table structure or permissions.');
      return;
    }
    
    console.log('✅ emails table exists!');
    console.log(`📊 Found ${emailsData?.length || 0} emails in the table`);
    
    if (emailsData && emailsData.length > 0) {
      console.log('\n📧 Sample email data:');
      console.log('Columns present:', Object.keys(emailsData[0]));
      console.log('\nFirst email:');
      console.log({
        id: emailsData[0].id,
        subject: emailsData[0].subject,
        sender: emailsData[0].sender,
        created_at: emailsData[0].created_at,
        user_id: emailsData[0].user_id ? 'present' : 'missing'
      });
    } else {
      console.log('📭 No emails found in the table (empty table)');
    }
    
    // Check if contacts table exists and has data
    console.log('\n🔍 Checking contacts table...');
    const { data: contactsData, error: contactsError } = await supabase
      .from('contacts')
      .select('id, firstname, lastname, email, notes')
      .not('notes', 'is', null)
      .limit(3);
    
    if (contactsError) {
      console.error('❌ Error querying contacts table:', contactsError);
    } else {
      console.log(`✅ contacts table exists with ${contactsData?.length || 0} contacts having notes`);
      
      if (contactsData && contactsData.length > 0) {
        console.log('\n👥 Sample contact with notes:');
        console.log({
          id: contactsData[0].id,
          name: `${contactsData[0].firstname || ''} ${contactsData[0].lastname || ''}`.trim(),
          email: contactsData[0].email,
          has_notes: contactsData[0].notes ? 'yes' : 'no'
        });
      }
    }
    
    // Check email_accounts table
    console.log('\n🔍 Checking email_accounts table...');
    const { data: accountsData, error: accountsError } = await supabase
      .from('email_accounts')
      .select('id, email, provider_type, is_active')
      .limit(3);
    
    if (accountsError) {
      console.error('❌ Error querying email_accounts table:', accountsError);
    } else {
      console.log(`✅ email_accounts table exists with ${accountsData?.length || 0} accounts`);
      
      if (accountsData && accountsData.length > 0) {
        console.log('\n📧 Connected email accounts:');
        accountsData.forEach(account => {
          console.log(`- ${account.email} (${account.provider_type}) - ${account.is_active ? 'active' : 'inactive'}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Exception checking tables:', error);
  }
}

checkEmailsTable(); 