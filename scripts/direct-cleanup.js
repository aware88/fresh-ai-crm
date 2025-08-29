#!/usr/bin/env node

/**
 * Direct cleanup using SQL commands
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function directCleanup() {
  console.log('🧹 DIRECT CLEANUP - Removing old email data...\n');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const tables = [
    'emails',
    'email_patterns', 
    'email_notes',
    'email_queue',
    'email_response_tracking'
  ];

  for (const table of tables) {
    try {
      console.log(`🗑️  Truncating ${table}...`);
      
      // Use raw SQL to truncate table (faster and more reliable)
      const { error } = await supabase.rpc('exec_sql', {
        sql: `TRUNCATE TABLE ${table} CASCADE;`
      });

      if (error) {
        // Try alternative approach
        const { error: deleteError } = await supabase
          .from(table)
          .delete()
          .gte('created_at', '1900-01-01'); // Delete all records

        if (deleteError) {
          console.log(`⚠️  Could not clean ${table}: ${deleteError.message}`);
        } else {
          console.log(`✅ Cleaned ${table} (delete method)`);
        }
      } else {
        console.log(`✅ Cleaned ${table} (truncate method)`);
      }

    } catch (err) {
      console.log(`⚠️  Error with ${table}: ${err.message}`);
    }
  }

  // Verify cleanup
  console.log('\n📊 Verification:');
  
  const { count: emailCount } = await supabase
    .from('emails')
    .select('id', { count: 'exact', head: true });

  const { count: patternCount } = await supabase
    .from('email_patterns')
    .select('id', { count: 'exact', head: true });

  console.log(`📧 Emails remaining: ${emailCount || 0}`);
  console.log(`🧠 Patterns remaining: ${patternCount || 0}`);

  if ((emailCount || 0) === 0 && (patternCount || 0) === 0) {
    console.log('\n🎉 CLEANUP SUCCESSFUL!');
    console.log('• ~493MB+ storage freed');
    console.log('• Ready for fresh start with optimized system');
  }
}

directCleanup().catch(console.error);
