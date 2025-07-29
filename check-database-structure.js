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

async function executeSQL(sql, description) {
  try {
    console.log(`🔍 ${description}...`);
    const { data, error } = await supabase.rpc('exec_sql', { sql_string: sql });
    
    if (error) {
      console.error(`❌ Error in ${description}:`, error);
      return null;
    }
    
    console.log(`✅ ${description} completed - Found ${data ? data.length : 0} results`);
    return data;
  } catch (err) {
    console.error(`❌ Exception in ${description}:`, err);
    return null;
  }
}

async function checkDatabaseStructure() {
  console.log('🔍 CHECKING DATABASE STRUCTURE');
  console.log('='.repeat(50));
  
  // Check what tables exist in public schema
  const tables = await executeSQL(`
    SELECT table_name, table_type
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `, 'Checking existing tables');
  
  if (tables && tables.length > 0) {
    console.log('\n📋 EXISTING TABLES:');
    tables.forEach(table => {
      console.log(`  - ${table.table_name} (${table.table_type})`);
    });
  } else {
    console.log('\n❌ NO TABLES FOUND IN PUBLIC SCHEMA');
  }
  
  // Check what views exist
  const views = await executeSQL(`
    SELECT viewname
    FROM pg_views 
    WHERE schemaname = 'public'
    ORDER BY viewname;
  `, 'Checking existing views');
  
  if (views && views.length > 0) {
    console.log('\n👁️  EXISTING VIEWS:');
    views.forEach(view => {
      console.log(`  - ${view.viewname}`);
    });
    
    // Check the problematic views specifically
    const problematicViews = ['user_preferences_with_defaults', 'display_preferences_with_defaults', 'user_learning_stats'];
    for (const viewName of problematicViews) {
      const viewExists = views.find(v => v.viewname === viewName);
      if (viewExists) {
        const viewDef = await executeSQL(`
          SELECT definition
          FROM pg_views 
          WHERE schemaname = 'public' AND viewname = '${viewName}';
        `, `Getting definition for ${viewName}`);
        
        if (viewDef && viewDef.length > 0) {
          console.log(`\n🔍 VIEW ${viewName.toUpperCase()} DEFINITION:`);
          console.log(viewDef[0].definition);
        }
      } else {
        console.log(`\n❌ VIEW ${viewName.toUpperCase()} DOES NOT EXIST`);
      }
    }
  } else {
    console.log('\n❌ NO VIEWS FOUND IN PUBLIC SCHEMA');
  }
  
  // Check RLS status
  const rlsStatus = await executeSQL(`
    SELECT schemaname, tablename, rowsecurity
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `, 'Checking RLS status');
  
  if (rlsStatus && rlsStatus.length > 0) {
    console.log('\n🔒 RLS STATUS:');
    rlsStatus.forEach(table => {
      const status = table.rowsecurity ? '✅ ENABLED' : '❌ DISABLED';
      console.log(`  - ${table.tablename}: ${status}`);
    });
  } else {
    console.log('\n❌ NO TABLES FOUND FOR RLS CHECK');
  }
  
  // Check for views with SECURITY DEFINER
  const securityDefinerViews = await executeSQL(`
    SELECT schemaname, viewname, definition
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND definition ILIKE '%security definer%';
  `, 'Checking for SECURITY DEFINER views');
  
  if (securityDefinerViews && securityDefinerViews.length > 0) {
    console.log('\n⚠️  SECURITY DEFINER VIEWS:');
    securityDefinerViews.forEach(view => {
      console.log(`  - ${view.viewname}`);
    });
  } else {
    console.log('\n✅ NO SECURITY DEFINER VIEWS FOUND');
  }
  
  // Check if the problematic tables from the security report exist
  console.log('\n🔍 CHECKING TABLES FROM SECURITY REPORT:');
  const securityTables = ['autonomous_actions_log', 'agent_performance_metrics'];
  for (const tableName of securityTables) {
    const tableExists = await executeSQL(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = '${tableName}'
      ) as exists;
    `, `Checking if ${tableName} exists`);
    
    if (tableExists && tableExists[0] && tableExists[0].exists) {
      console.log(`  ✅ ${tableName} EXISTS`);
    } else {
      console.log(`  ❌ ${tableName} DOES NOT EXIST`);
    }
  }
}

checkDatabaseStructure(); 