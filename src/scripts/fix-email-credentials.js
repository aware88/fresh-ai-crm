/**
 * Email Credentials Fix Script
 * 
 * This script helps reset email account credentials that are having authentication issues.
 * Run this script when you see IMAP authentication errors in the logs.
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with service role key for admin access
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Simple Base64 encryption for passwords (matches the app's current encryption)
function encryptPassword(password) {
  return Buffer.from(password).toString('base64');
}

async function updateEmailCredentials(email, newPassword) {
  try {
    console.log(`Updating credentials for email account: ${email}`);
    
    // Find the account
    const { data: accounts, error: findError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('email', email);
    
    if (findError) {
      console.error('Error finding account:', findError);
      return false;
    }
    
    if (!accounts || accounts.length === 0) {
      console.error('No account found with email:', email);
      return false;
    }
    
    // Encrypt the new password
    const encryptedPassword = encryptPassword(newPassword);
    
    // Update each matching account
    for (const account of accounts) {
      const { error: updateError } = await supabase
        .from('email_accounts')
        .update({ 
          password_encrypted: encryptedPassword,
          last_sync_error: null, // Clear any previous sync errors
          is_active: true // Ensure the account is active
        })
        .eq('id', account.id);
      
      if (updateError) {
        console.error(`Error updating account ${account.id}:`, updateError);
        return false;
      }
      
      console.log(`Successfully updated account ${account.id} for ${email}`);
    }
    
    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}

async function main() {
  // Get command line arguments
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node fix-email-credentials.js <email> <password>');
    console.log('Example: node fix-email-credentials.js user@example.com mypassword123');
    process.exit(1);
  }
  
  const email = args[0];
  const password = args[1];
  
  console.log('Starting email credentials update...');
  const success = await updateEmailCredentials(email, password);
  
  if (success) {
    console.log('✅ Email credentials updated successfully!');
    console.log('You can now try to sync your email account again.');
  } else {
    console.log('❌ Failed to update email credentials.');
    console.log('Please check the error messages above and try again.');
  }
  
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

