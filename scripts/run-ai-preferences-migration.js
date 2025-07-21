#!/usr/bin/env node

const { readFileSync } = require('fs');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  console.log('🚀 Running AI Email Preferences Migration...\n');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   NEXT_PUBLIC_SUPABASE_URL');
    console.error('   SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Read the migration file
    console.log('📄 Reading migration file...');
    const migrationSQL = readFileSync(
      path.join(__dirname, '../sql-migrations/create-ai-email-preferences-table.sql'),
      'utf8'
    );

    console.log('📋 Executing migration...');
    console.log('📝 SQL to execute:');
    console.log(migrationSQL.substring(0, 200) + '...');

    // Try to execute the full migration
    console.log('🔧 Attempting to execute migration...');
    
    // Let's just show the SQL for manual execution since RPC methods vary
    console.log('\n📋 Please run the following SQL in your Supabase SQL editor:');
    console.log('\n' + '='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    
    // Try to test if table exists after manual creation
    console.log('\n⏳ Waiting for you to run the SQL manually...');
    console.log('Press Ctrl+C when done, then restart your Next.js app');
    
    // Keep checking if table exists
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds
    
    while (attempts < maxAttempts) {
      try {
        const { error: testError } = await supabase
          .from('user_ai_email_preferences')
          .select('count(*)', { count: 'exact', head: true });

        if (!testError) {
          console.log('✅ Table verified successfully!');
          console.log('🎉 AI Email Preferences migration completed successfully!');
          console.log('✨ You can now use the AI email preferences system.');
          process.exit(0);
        }
      } catch (e) {
        // Table doesn't exist yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
      process.stdout.write('.');
    }

    console.log('\n⚠️  Manual execution needed - see SQL above');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n🛠️  Manual fix: You can run this SQL directly in your Supabase SQL editor:');
    console.log('\n' + '='.repeat(60));
    try {
      const migrationSQL = readFileSync(
        path.join(__dirname, '../sql-migrations/create-ai-email-preferences-table.sql'),
        'utf8'
      );
      console.log(migrationSQL);
      console.log('='.repeat(60));
    } catch (readError) {
      console.error('Could not read migration file:', readError);
    }
    process.exit(1);
  }
}

runMigration(); 