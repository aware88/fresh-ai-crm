/**
 * User Data Cleanup Script
 * 
 * This script helps clean up all data related to a user for testing purposes.
 * Run this AFTER deleting the user from Supabase Auth dashboard.
 */

import { createClient } from '@supabase/supabase-js';

// Replace with your actual values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function cleanupUserData(userEmail) {
  console.log(`🧹 Cleaning up data for user: ${userEmail}`);
  
  try {
    // Note: Since the user is already deleted from auth.users, 
    // we need to clean up by email or other identifiers
    
    // Clean up contacts
    const { data: contacts, error: contactsError } = await supabase
      .from('contacts')
      .select('id')
      .eq('created_by_email', userEmail); // Assuming you track creator email
    
    if (contacts && contacts.length > 0) {
      const { error: deleteContactsError } = await supabase
        .from('contacts')
        .delete()
        .eq('created_by_email', userEmail);
      
      if (deleteContactsError) {
        console.error('Error deleting contacts:', deleteContactsError);
      } else {
        console.log(`✅ Deleted ${contacts.length} contacts`);
      }
    }
    
    // Clean up emails
    const { data: emails, error: emailsError } = await supabase
      .from('emails')
      .select('id')
      .eq('recipient', userEmail)
      .or(`sender.eq.${userEmail}`);
    
    if (emails && emails.length > 0) {
      const { error: deleteEmailsError } = await supabase
        .from('emails')
        .delete()
        .or(`recipient.eq.${userEmail},sender.eq.${userEmail}`);
      
      if (deleteEmailsError) {
        console.error('Error deleting emails:', deleteEmailsError);
      } else {
        console.log(`✅ Deleted ${emails.length} emails`);
      }
    }
    
    // Clean up email accounts
    const { data: emailAccounts, error: emailAccountsError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('email', userEmail);
    
    if (emailAccounts && emailAccounts.length > 0) {
      const { error: deleteEmailAccountsError } = await supabase
        .from('email_accounts')
        .delete()
        .eq('email', userEmail);
      
      if (deleteEmailAccountsError) {
        console.error('Error deleting email accounts:', deleteEmailAccountsError);
      } else {
        console.log(`✅ Deleted ${emailAccounts.length} email accounts`);
      }
    }
    
    console.log('🎉 User data cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Get email from command line argument
const userEmail = process.argv[2];

if (!userEmail) {
  console.log('Usage: node cleanup-user-data.js <user-email>');
  console.log('Example: node cleanup-user-data.js user@example.com');
  process.exit(1);
}

cleanupUserData(userEmail); 