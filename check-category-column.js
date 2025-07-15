// Script to check if notification_templates table has a category column
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Error: Supabase URL and anon key are required.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCategoryColumn() {
  try {
    console.log('Checking if notification_templates table has a category column...');
    
    // Query to check if the table exists
    const { data: tableExists, error: tableError } = await supabase
      .from('notification_templates')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('Error: Table notification_templates might not exist:', tableError.message);
      process.exit(1);
    }
    
    console.log('Table notification_templates exists.');
    
    // Try to select the category column specifically
    const { data, error } = await supabase
      .from('notification_templates')
      .select('category')
      .limit(1);
    
    if (error) {
      console.error('Error: The category column does not exist in notification_templates table.');
      console.error('Error details:', error.message);
      
      // Suggest a fix
      console.log('\nSuggested fix:');
      console.log('Run the following SQL in your Supabase SQL editor:');
      console.log('\nALTER TABLE public.notification_templates ADD COLUMN category TEXT NOT NULL DEFAULT \'general\';');
      console.log('CREATE INDEX notification_templates_category_idx ON public.notification_templates (category);');
    } else {
      console.log('Success: The category column exists in notification_templates table.');
      console.log('Sample data:', data);
    }
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

checkCategoryColumn(); 