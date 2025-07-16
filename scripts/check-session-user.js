const { createClient } = require('@supabase/supabase-js');

async function checkSessionUser() {
  try {
    console.log('Checking session user...');
    
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
    
    // Check what user ID the Google account is linked to
    const { data: emailAccounts, error: emailError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('provider_type', 'google')
      .eq('is_active', true);
    
    if (emailError) {
      console.error('Error fetching email accounts:', emailError.message);
      return;
    }
    
    if (emailAccounts.length === 0) {
      console.log('No Google accounts found');
      return;
    }
    
    const googleAccount = emailAccounts[0];
    console.log(`Google account user ID: ${googleAccount.user_id}`);
    console.log(`Google account email: ${googleAccount.email}`);
    
    // Check if there's a user in the auth.users table with this ID
    const { data: authUsers, error: authError } = await supabase.auth.admin.getUserById(googleAccount.user_id);
    
    if (authError) {
      console.error('Error fetching auth user:', authError.message);
      
      // Try to create a user with this ID
      console.log('Attempting to create user in auth.users...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: googleAccount.email,
        email_confirm: true,
        user_metadata: {
          full_name: googleAccount.display_name || googleAccount.email.split('@')[0],
          provider: 'google'
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError.message);
      } else {
        console.log('✅ Created user:', newUser.user);
      }
    } else {
      console.log('✅ Auth user exists:', authUsers.user);
    }
    
    // Check if we need to create NextAuth adapter tables
    console.log('\nChecking NextAuth tables...');
    
    // Try to create the users table if it doesn't exist
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT,
        email TEXT UNIQUE,
        "emailVerified" TIMESTAMPTZ,
        image TEXT,
        created_at TIMESTAMPTZ DEFAULT now(),
        updated_at TIMESTAMPTZ DEFAULT now()
      );
    `;
    
    const { error: createUsersError } = await supabase.rpc('exec_sql', { sql: createUsersTable });
    if (createUsersError) {
      console.error('Error creating users table:', createUsersError.message);
    } else {
      console.log('✅ Users table created/exists');
    }
    
    // Insert the user into the users table
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .upsert({
        id: googleAccount.user_id,
        name: googleAccount.display_name || googleAccount.email.split('@')[0],
        email: googleAccount.email,
        emailVerified: new Date().toISOString(),
        image: null
      })
      .select();
    
    if (insertError) {
      console.error('Error inserting user:', insertError.message);
    } else {
      console.log('✅ User inserted/updated in users table:', insertResult[0]);
    }
    
  } catch (error) {
    console.error('Error checking session user:', error);
  }
}

checkSessionUser(); 