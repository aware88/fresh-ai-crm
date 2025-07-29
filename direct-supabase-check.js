#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDirectSupabase() {
  console.log('🔍 DIRECT SUPABASE CHECK');
  console.log('='.repeat(50));
  
  try {
    // Try to check if the problematic views exist by querying them directly
    const problematicViews = [
      'user_preferences_with_defaults',
      'display_preferences_with_defaults', 
      'user_learning_stats',
      'ai_improvement_insights',
      'organization_member_stats',
      'contact_intelligence_summary'
    ];
    
    console.log('\n🔍 TESTING DIRECT VIEW ACCESS:');
    for (const viewName of problematicViews) {
      try {
        const { data, error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log(`  ❌ ${viewName}: DOES NOT EXIST`);
          } else {
            console.log(`  ⚠️  ${viewName}: EXISTS but ERROR - ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${viewName}: EXISTS and ACCESSIBLE`);
        }
      } catch (err) {
        console.log(`  ❌ ${viewName}: ERROR - ${err.message}`);
      }
    }
    
    // Check the problematic tables
    const problematicTables = [
      'autonomous_actions_log',
      'agent_performance_metrics'
    ];
    
    console.log('\n🔍 TESTING DIRECT TABLE ACCESS:');
    for (const tableName of problematicTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log(`  ❌ ${tableName}: DOES NOT EXIST`);
          } else {
            console.log(`  ⚠️  ${tableName}: EXISTS but ERROR - ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${tableName}: EXISTS and ACCESSIBLE`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ERROR - ${err.message}`);
      }
    }
    
    // Check some known tables that should exist
    const knownTables = ['users', 'organizations', 'organization_members', 'contacts', 'emails'];
    
    console.log('\n🔍 TESTING KNOWN TABLES:');
    for (const tableName of knownTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
          
        if (error) {
          if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
            console.log(`  ❌ ${tableName}: DOES NOT EXIST`);
          } else {
            console.log(`  ⚠️  ${tableName}: EXISTS but ERROR - ${error.message}`);
          }
        } else {
          console.log(`  ✅ ${tableName}: EXISTS and ACCESSIBLE`);
        }
      } catch (err) {
        console.log(`  ❌ ${tableName}: ERROR - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('💥 Critical error:', error);
  }
}

checkDirectSupabase(); 