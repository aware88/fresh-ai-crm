#!/usr/bin/env node

/**
 * Check what email tables exist in the database
 */

const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

async function checkEmailTables() {
  console.log('🔍 Checking existing email tables...');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('\n📊 Checking for email tables...');

    // Check if our new optimized tables were created
    const optimizedTableNames = ['email_index', 'email_content_cache', 'email_threads'];
    console.log('\n✅ Checking optimized email tables:');
    
    for (const tableName of optimizedTableNames) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`   ❌ ${tableName} - Not found`);
        } else {
          console.log(`   🚀 ${tableName} - Exists (${count || 0} records)`);
        }
      } catch (err) {
        console.log(`   ❌ ${tableName} - Error: ${err.message}`);
      }
    }

    // Check for the original emails table specifically
    try {
      const { count: emailCount, error: emailError } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true });
      
      if (emailError) {
        console.log('\n❌ Original "emails" table not found');
        console.log('   This means your emails are stored in a different table or structure');
      } else {
        console.log(`\n✅ Original "emails" table found with ${emailCount} records`);
      }
    } catch (err) {
      console.log('\n❌ Could not access "emails" table:', err.message);
    }

  } catch (error) {
    console.error('Failed to check tables:', error);
  }
}

if (require.main === module) {
  checkEmailTables().catch(console.error);
}

module.exports = checkEmailTables;
