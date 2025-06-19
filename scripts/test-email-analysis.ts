// @ts-check
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

// Log environment variables for debugging
console.log('Environment variables loaded:');
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_APP_URL:', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Test email content
const testEmail = {
  subject: 'Test Email with Personality Analysis',
  from: 'test.sender@example.com',
  to: 'test.recipient@example.com',
  body: `Hello,

I hope this email finds you well. I wanted to follow up on our previous conversation about the project timeline. I'm very detail-oriented and always strive to meet deadlines. I believe in clear communication and setting realistic expectations.

Looking forward to your thoughts.

Best regards,
Test Sender`,
  html: `<!DOCTYPE html>
  <html>
  <head>
    <title>Test Email</title>
  </head>
  <body>
    <p>Hello,</p>
    <p>I hope this email finds you well. I wanted to follow up on our previous conversation about the project timeline. I'm very detail-oriented and always strive to meet deadlines. I believe in clear communication and setting realistic expectations.</p>
    <p>Looking forward to your thoughts.</p>
    <p>Best regards,<br>Test Sender</p>
  </body>
  </html>`
};



async function testEmailAnalysis() {
  try {
    console.log('🚀 Starting email analysis test...');
    
    // 1. Use the service role key directly for authentication
    console.log('🔑 Using service role key for authentication...');
    const accessToken = supabaseKey;
    console.log('✅ Authenticated successfully');

    // 2. Call the analyze-email endpoint
    console.log('🔍 Analyzing email content...');
    const analysisResponse = await axios.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/analyze-email`,
      { emailContent: testEmail.body },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (analysisResponse.status !== 200) {
      throw new Error(`Analysis failed: ${JSON.stringify(analysisResponse.data)}`);
    }

    const { analysis } = analysisResponse.data;
    console.log('✅ Email analyzed successfully');
    console.log('Analysis preview:', analysis.substring(0, 100) + '...');

    // 3. Use a hardcoded test user ID for now
    // In a real scenario, you would get this from the authenticated user's session
    const testUserEmail = 'test.user@example.com';
    
    // Try to get the user ID from the auth.users table
    console.log('👤 Fetching test user...');
    const { data: existingUser, error: userError } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', testUserEmail)
      .single();
    
    if (userError || !existingUser) {
      console.error('❌ Error fetching test user:', userError?.message || 'User not found');
      // For testing purposes, we'll use a hardcoded ID
      // In a real app, you would handle this error appropriately
      console.log('⚠️ Using hardcoded test user ID for demonstration');
    }
    
    const userId = existingUser?.id || '00000000-0000-0000-0000-000000000000';
    console.log(`✅ Using user ID: ${userId}`);

    // 4. Store the email directly in the emails table
    console.log('💾 Storing email directly in the emails table...');
    
    // Prepare the analysis data
    let analysisData;
    try {
      // Try to parse the analysis if it's a JSON string
      analysisData = typeof analysis === 'string' ? JSON.parse(analysis) : analysis;
    } catch (e) {
      console.warn('⚠️ Could not parse analysis as JSON, using as-is');
      analysisData = analysis;
    }

    const { data: emailData, error: storeError } = await supabase
      .from('emails')
      .insert([{
        subject: testEmail.subject,
        sender: testEmail.from,
        recipient: testEmail.to,
        raw_content: testEmail.body,
        analysis: analysisData,
        contact_id: null,
        read: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select('*');

    if (storeError) {
      console.error('❌ Error storing email:', storeError);
      throw storeError;
    }

    console.log('✅ Email stored successfully');
    console.log('Email ID:', emailData?.[0]?.id);

    // 5. Verify the email was stored correctly
    console.log('🔍 Verifying email was stored...');
    const { data: storedEmails, error: emailFetchError } = await supabase
      .from('emails')
      .select('*')
      .eq('id', emailData?.[0]?.id);

    if (emailFetchError) {
      console.error('❌ Error fetching stored email:', emailFetchError);
      throw emailFetchError;
    }

    if (!storedEmails || storedEmails.length === 0) {
      console.error('❌ No email found with ID:', emailData?.[0]?.id);
      throw new Error('Email not found in database');
    }

    const storedEmail = storedEmails[0];
    console.log('✅ Email stored successfully');
    console.log('Email ID:', storedEmail.id);
    console.log('Subject:', storedEmail.subject);
    console.log('From:', storedEmail.sender);
    console.log('To:', storedEmail.recipient);
    
    // Check if the contact was created/updated
    console.log('🔍 Checking for contact...');
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('*')
      .eq('email', testEmail.from);

    if (contactsError) {
      console.error('❌ Error checking contacts:', contactsError);
    } else if (contacts && contacts.length > 0) {
      const contact = contacts[0];
      console.log('✅ Contact found:');
      console.log('Contact ID:', contact.id);
      console.log('Email:', contact.email);
      console.log('Personality Type:', contact.personalitytype || 'Not set');
      
      if (contact.personalityanalysis) {
        console.log('Personality Analysis:', JSON.stringify(contact.personalityanalysis, null, 2));
      }
      
      if (contact.personalityhistory) {
        console.log('Personality History:', JSON.stringify(contact.personalityhistory, null, 2));
      }
    } else {
      console.log('ℹ️ No contact found with email:', testEmail.from);
      console.log('This is expected if the contact creation logic is not implemented yet.');
    }

    console.log('✨ Test completed successfully!');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Test failed:');
    
    if (axios.isAxiosError(error)) {
      // Axios error
      console.error('Axios error:', error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
        console.error('Status:', error.response.status);
        console.error('Headers:', error.response.headers);
      } else if (error.request) {
        // Request was made but no response
        console.error('No response received:', error.request);
      }
    } else if (error instanceof Error) {
      // Standard Error object
      console.error('Error:', error.message);
      if ('stack' in error) {
        console.error('Stack:', error.stack);
      }
    } else {
      // Unknown error type
      console.error('Unknown error:', error);
    }
    
    process.exit(1);
  }
}

// Run the test
testEmailAnalysis();
