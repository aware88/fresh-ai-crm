#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixEmailThreadsTable() {
  console.log('🔧 Fixing email_threads table schema...\n');

  try {
    // First, check what columns exist
    const { data: columns, error: columnsError } = await supabase
      .rpc('get_table_columns', { table_name: 'email_threads' })
      .catch(() => ({ data: null, error: 'Function not found' }));

    if (columnsError || !columns) {
      console.log('⚠️ Cannot check existing columns, will attempt to add them anyway\n');
    } else {
      console.log('📋 Current columns:', columns.map(c => c.column_name).join(', '), '\n');
    }

    // Add subject column if it doesn't exist
    console.log('➕ Adding subject column if missing...');
    const { error: subjectError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS subject TEXT;`
    }).catch(async () => {
      // If the RPC doesn't exist, try direct query
      return await supabase.from('email_threads').select('subject').limit(1);
    });

    if (subjectError) {
      console.log('⚠️ Could not add subject column (may already exist)');
    } else {
      console.log('✅ Subject column ready');
    }

    // Add email_count column if it doesn't exist
    console.log('➕ Adding email_count column if missing...');
    const { error: countError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE email_threads ADD COLUMN IF NOT EXISTS email_count INTEGER DEFAULT 1;`
    }).catch(async () => {
      // If the RPC doesn't exist, try direct query
      return await supabase.from('email_threads').select('email_count').limit(1);
    });

    if (countError) {
      console.log('⚠️ Could not add email_count column (may already exist)');
    } else {
      console.log('✅ Email_count column ready');
    }

    // Make thread_id nullable
    console.log('🔧 Making thread_id nullable...');
    const { error: threadIdError } = await supabase.rpc('exec_sql', {
      sql: `ALTER TABLE email_threads ALTER COLUMN thread_id DROP NOT NULL;`
    }).catch(() => ({ error: 'Could not modify' }));

    if (threadIdError) {
      console.log('⚠️ Could not modify thread_id constraint (may already be nullable)');
    } else {
      console.log('✅ Thread_id is now nullable');
    }

    // Update thread_id where it's null
    console.log('🔄 Updating null thread_ids...');
    const { data: updateData, error: updateError } = await supabase
      .from('email_threads')
      .update({ thread_id: supabase.raw('id') })
      .is('thread_id', null);

    if (updateError) {
      console.log('⚠️ Could not update thread_ids:', updateError.message);
    } else {
      console.log('✅ Thread_ids updated');
    }

    // Test by selecting from the table
    console.log('\n📊 Testing table structure...');
    const { data: testData, error: testError } = await supabase
      .from('email_threads')
      .select('id, thread_id, subject, email_count, created_at, updated_at')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError);
      console.log('\n⚠️ The columns might not have been added properly.');
      console.log('You may need to run this SQL manually in Supabase:');
      console.log('```sql');
      console.log('ALTER TABLE email_threads');
      console.log('ADD COLUMN IF NOT EXISTS subject TEXT,');
      console.log('ADD COLUMN IF NOT EXISTS email_count INTEGER DEFAULT 1;');
      console.log('```');
    } else {
      console.log('✅ Table structure looks good!');
      if (testData && testData.length > 0) {
        console.log('Sample row:', JSON.stringify(testData[0], null, 2));
      }
    }

    console.log('\n✨ Done! The email_threads table should now have the required columns.');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('\n📝 Please run this SQL manually in your Supabase SQL editor:');
    console.log('```sql');
    console.log('-- Add missing columns to email_threads');
    console.log('ALTER TABLE email_threads');
    console.log('ADD COLUMN IF NOT EXISTS subject TEXT,');
    console.log('ADD COLUMN IF NOT EXISTS email_count INTEGER DEFAULT 1;');
    console.log('');
    console.log('-- Make thread_id nullable');
    console.log('ALTER TABLE email_threads');
    console.log('ALTER COLUMN thread_id DROP NOT NULL;');
    console.log('');
    console.log('-- Update null thread_ids');
    console.log('UPDATE email_threads');
    console.log('SET thread_id = id');
    console.log('WHERE thread_id IS NULL;');
    console.log('```');
  }
}

// Run the fix
fixEmailThreadsTable().catch(console.error);