const { createClient } = require('@supabase/supabase-js');

async function checkDatabaseState() {
  try {
    console.log('Checking database state...');
    
    // Try to read from test.env file
    const fs = require('fs');
    const path = require('path');
    
    let supabaseUrl, supabaseKey;
    
    try {
      const envFile = fs.readFileSync(path.join(__dirname, '..', 'test.env'), 'utf8');
      const envLines = envFile.split('\n');
      
      for (const line of envLines) {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
          supabaseUrl = line.split('=')[1];
        } else if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
          supabaseKey = line.split('=')[1];
        }
      }
    } catch (error) {
      console.error('Could not read test.env file:', error.message);
      return;
    }
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase credentials in test.env');
      return;
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Check email_accounts table
    console.log('\n=== EMAIL ACCOUNTS TABLE ===');
    const { data: emailAccounts, error: emailError } = await supabase
      .from('email_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (emailError) {
      console.error('Error fetching email accounts:', emailError.message);
    } else {
      console.log(`Found ${emailAccounts.length} email accounts:`);
      emailAccounts.forEach(account => {
        console.log(`- ${account.email} (${account.provider_type}) - Active: ${account.is_active}`);
        console.log(`  User ID: ${account.user_id}`);
        console.log(`  Has tokens: access_token=${!!account.access_token}, refresh_token=${!!account.refresh_token}`);
        console.log(`  Created: ${account.created_at}`);
        console.log('');
      });
    }
    
    // Check emails table
    console.log('\n=== EMAILS TABLE ===');
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id, subject, sender, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (emailsError) {
      console.error('Error fetching emails:', emailsError.message);
    } else {
      console.log(`Found ${emails.length} emails:`);
      emails.forEach(email => {
        console.log(`- "${email.subject}" from ${email.sender} (${email.created_at})`);
      });
    }
    
    // Check NextAuth tables
    console.log('\n=== NEXTAUTH TABLES ===');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (accountsError) {
      console.error('Error fetching NextAuth accounts:', accountsError.message);
    } else {
      console.log(`Found ${accounts.length} NextAuth accounts:`);
      accounts.forEach(account => {
        console.log(`- ${account.provider} for user ${account.userId} (${account.providerAccountId})`);
      });
    }
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (usersError) {
      console.error('Error fetching NextAuth users:', usersError.message);
    } else {
      console.log(`Found ${users.length} NextAuth users:`);
      users.forEach(user => {
        console.log(`- ${user.email} (${user.id})`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database state:', error);
  }
}

checkDatabaseState(); 