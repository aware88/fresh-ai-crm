// Simple script to test authentication
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testAuthentication() {
  console.log('Testing Supabase authentication...');
  
  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('ERROR: Supabase environment variables must be set');
    console.log('Current config:');
    console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Not set');
    console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Not set');
    return;
  }

  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    // Check if we have a session
    console.log('Checking for existing session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError.message);
      return;
    }

    if (!session) {
      console.log('No active session found.');
      
      // Try to sign in with test credentials if provided
      if (process.env.TEST_EMAIL && process.env.TEST_PASSWORD) {
        console.log(`Attempting to sign in with test account: ${process.env.TEST_EMAIL}`);
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: process.env.TEST_EMAIL,
          password: process.env.TEST_PASSWORD,
        });
        
        if (signInError) {
          console.error('Sign in failed:', signInError.message);
          return;
        }
        
        if (signInData.session) {
          console.log('✓ Successfully signed in!');
          console.log('User:', signInData.user.email);
        }
      } else {
        console.log('No test credentials provided. Add TEST_EMAIL and TEST_PASSWORD to .env.local to test sign-in.');
      }
    } else {
      console.log('✓ Active session found!');
      console.log('User:', session.user.email);
      
      // Test fetching profile data
      console.log('\nFetching user profile...');
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        console.error('Error fetching profile:', profileError.message);
      } else if (profile) {
        console.log('✓ Profile found:');
        console.log('- ID:', profile.id);
        console.log('- Email:', profile.email);
        console.log('- Name:', profile.full_name || '(not set)');
      } else {
        console.log('No profile found for this user.');
      }
    }

    // Test fetching emails
    console.log('\nTesting API access to emails table...');
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id, subject, sender')
      .limit(3);
    
    if (emailsError) {
      console.error('Error fetching emails:', emailsError.message);
    } else {
      console.log(`✓ Successfully fetched ${emails.length} emails`);
      if (emails.length > 0) {
        console.log('Sample email subjects:');
        emails.forEach((email, i) => {
          console.log(`${i+1}. ${email.subject || '(No subject)'} from ${email.sender || 'unknown'}`);
        });
      } else {
        console.log('No emails found in the database.');
      }
    }
    
  } catch (error) {
    console.error('Unexpected error:', error.message);
    console.error('Full error:', error);
  }
}

// Run the test
testAuthentication().catch(console.error);
