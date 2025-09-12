#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkContacts() {
  console.log('Checking contacts in database...\n');
  
  try {
    // Get all contacts
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*');
    
    if (error) {
      console.error('Error fetching contacts:', error);
      return;
    }
    
    console.log(`Found ${contacts.length} contact(s) in database:\n`);
    
    contacts.forEach((contact, index) => {
      console.log(`Contact ${index + 1}:`);
      console.log(`  ID: ${contact.id}`);
      console.log(`  Name: ${contact.firstname || contact.first_name} ${contact.lastname || contact.last_name}`);
      console.log(`  Email: ${contact.email}`);
      console.log(`  Company: ${contact.company || 'N/A'}`);
      console.log(`  Created: ${contact.created_at}`);
      console.log('---');
    });
    
    // Ask if user wants to delete them
    if (contacts.length > 0) {
      console.log('\nThese are REAL contacts in your database.');
      console.log('To delete them, you can:');
      console.log('1. Use the UI delete buttons in the Contacts page');
      console.log('2. Run: node scripts/check-contacts.js --delete');
    }
    
    // Handle delete flag
    if (process.argv.includes('--delete')) {
      console.log('\nDeleting all contacts...');
      const { error: deleteError } = await supabase
        .from('contacts')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all except impossible ID
      
      if (deleteError) {
        console.error('Error deleting contacts:', deleteError);
      } else {
        console.log('All contacts deleted successfully!');
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

checkContacts();