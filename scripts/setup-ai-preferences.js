#!/usr/bin/env node

/**
 * AI Email Preferences Setup Script
 * 
 * This script sets up the AI email preferences system:
 * 1. Creates the database table
 * 2. Sets up default preferences for existing users
 * 3. Validates the system is working
 */

import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function main() {
  console.log('🚀 Setting up AI Email Preferences System...\n');

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
    // Step 1: Run database migration
    console.log('📄 Running database migration...');
    const migrationSQL = readFileSync(
      join(__dirname, '../sql-migrations/create-ai-email-preferences-table.sql'),
      'utf8'
    );

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql_string: migrationSQL
    });

    if (migrationError) {
      console.error('❌ Migration failed:', migrationError);
      process.exit(1);
    }

    console.log('✅ Database migration completed successfully');

    // Step 2: Check if table was created
    console.log('🔍 Verifying table creation...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('user_ai_email_preferences')
      .select('count(*)', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Table verification failed:', tableError);
      process.exit(1);
    }

    console.log('✅ Table verified successfully');

    // Step 3: Get existing users
    console.log('👥 Setting up default preferences for existing users...');
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
      console.error('❌ Failed to fetch users:', usersError);
      process.exit(1);
    }

    console.log(`📊 Found ${users.users.length} users to set up`);

    // Step 4: Create default preferences for each user
    let setupCount = 0;
    for (const user of users.users) {
      try {
        // Check if user already has preferences
        const { data: existingPrefs } = await supabase
          .from('user_ai_email_preferences')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (existingPrefs) {
          console.log(`⏭️  Skipping ${user.email} (already has preferences)`);
          continue;
        }

        // Create default preferences
        const { error: insertError } = await supabase
          .from('user_ai_email_preferences')
          .insert({
            user_id: user.id,
            ai_enabled: true,
            response_style: 'professional',
            response_tone: 'helpful',
            response_length: 'optimal',
            email_filters: [],
            response_rules: [],
            exclusion_rules: [],
            content_rules: [],
            global_ai_instructions: 'Be helpful, professional, and provide accurate information. Always maintain a respectful tone.',
            preferences_source: 'system_default',
            created_by: user.id
          });

        if (insertError) {
          console.error(`❌ Failed to set up preferences for ${user.email}:`, insertError);
          continue;
        }

        console.log(`✅ Set up preferences for ${user.email}`);
        setupCount++;

      } catch (error) {
        console.error(`❌ Error processing user ${user.email}:`, error);
      }
    }

    console.log(`\n🎉 Setup completed successfully!`);
    console.log(`   📊 ${setupCount} users configured with default preferences`);
    console.log(`   📋 ${users.users.length - setupCount} users already had preferences`);

    // Step 5: Test the system
    console.log('\n🧪 Running system validation...');

    // Test the service
    const testUser = users.users[0];
    if (testUser) {
      const { data: testPrefs, error: testError } = await supabase
        .from('user_ai_email_preferences')
        .select('*')
        .eq('user_id', testUser.id)
        .single();

      if (testError || !testPrefs) {
        console.error('❌ System validation failed - cannot retrieve preferences');
        process.exit(1);
      }

      console.log('✅ System validation passed');
      console.log(`   ✓ Can retrieve preferences for ${testUser.email}`);
      console.log(`   ✓ AI enabled: ${testPrefs.ai_enabled}`);
      console.log(`   ✓ Response style: ${testPrefs.response_style}`);
      console.log(`   ✓ Total rules: ${testPrefs.total_rules_count || 0}`);
    }

    console.log('\n🎊 AI Email Preferences System is ready to use!');
    console.log('\n📖 Next steps:');
    console.log('   1. Restart your Next.js application');
    console.log('   2. Visit /settings/email-ai to configure preferences');
    console.log('   3. Users can now chat with AI to set up their email handling rules');
    console.log('\n✨ Features enabled:');
    console.log('   • Conversational preference setup');
    console.log('   • Email filtering and routing');
    console.log('   • Custom AI instructions');
    console.log('   • User-specific response styles');
    console.log('   • Automatic preference application to ALL AI agents');

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

// Run the setup
main().catch(console.error); 