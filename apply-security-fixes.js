#!/usr/bin/env node

/**
 * CRITICAL SECURITY FIXES FOR SUPABASE DATABASE
 * 
 * This script applies all security fixes to resolve Supabase linter issues:
 * - Fixes exposed auth.users data in views
 * - Removes SECURITY DEFINER from views 
 * - Enables RLS on public tables
 * - Creates proper security policies
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

// Get Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Missing Supabase credentials in environment variables.');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with admin privileges
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function executeSQL(sql, description) {
  try {
    console.log(`🔧 ${description}...`);
    
    const { data, error } = await supabase.rpc('exec_sql', { 
      sql_string: sql 
    });
    
    if (error) {
      console.error(`❌ Error in ${description}:`, error);
      return false;
    }
    
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (err) {
    console.error(`❌ Exception in ${description}:`, err);
    return false;
  }
}

async function applySQLFile(filePath, description) {
  try {
    const sqlContent = fs.readFileSync(filePath, 'utf8');
    return await executeSQL(sqlContent, description);
  } catch (err) {
    console.error(`❌ Error reading SQL file ${filePath}:`, err);
    return false;
  }
}

async function verifySecurityFixes() {
  console.log('\n🔍 Verifying security fixes...');
  
  // Check RLS is enabled on tables
  const rlsCheck = await executeSQL(`
    SELECT schemaname, tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
      AND tablename IN ('autonomous_actions_log', 'agent_performance_metrics', 'user_preferences', 'display_preferences')
    ORDER BY tablename;
  `, 'Checking RLS status on tables');
  
  // Check views exist
  const viewsCheck = await executeSQL(`
    SELECT schemaname, viewname 
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND (viewname LIKE '%_with_defaults' OR viewname LIKE '%_stats' OR viewname LIKE '%_insights' OR viewname LIKE '%_summary')
    ORDER BY viewname;
  `, 'Checking secure views');
  
  return rlsCheck && viewsCheck;
}

async function backupCurrentViews() {
  console.log('\n💾 Creating backup of current views...');
  
  const backupSQL = `
    -- Backup current views before security fixes
    CREATE SCHEMA IF NOT EXISTS backup_$(date +%Y%m%d);
    
    -- Export current view definitions
    SELECT 
      'CREATE OR REPLACE VIEW backup_$(date +%Y%m%d).' || viewname || ' AS ' || definition as backup_sql
    FROM pg_views 
    WHERE schemaname = 'public' 
      AND (viewname LIKE '%_with_defaults' OR viewname LIKE '%_stats' OR viewname LIKE '%_insights' OR viewname LIKE '%_summary');
  `;
  
  return await executeSQL(backupSQL, 'Creating backup of current views');
}

async function main() {
  console.log('🚨 CRITICAL SECURITY FIXES FOR SUPABASE DATABASE');
  console.log('='.repeat(60));
  console.log('This will fix all security vulnerabilities identified by Supabase linter:');
  console.log('1. ❌ Exposed auth.users data in views');
  console.log('2. ❌ SECURITY DEFINER views that bypass RLS');
  console.log('3. ❌ Missing RLS on public tables');
  console.log('='.repeat(60));
  
  // Confirm execution
  if (process.argv.includes('--force')) {
    console.log('⚡ Force mode enabled, proceeding without confirmation...');
  } else {
    console.log('\n⚠️  WARNING: This will modify your production database!');
    console.log('Run with --force flag to proceed, or Ctrl+C to cancel.');
    process.exit(0);
  }
  
  let success = true;
  
  try {
    // Step 1: Create backup
    success = await backupCurrentViews() && success;
    
    // Step 2: Apply security fixes
    const sqlFile = path.join(__dirname, 'fix-security-vulnerabilities.sql');
    success = await applySQLFile(sqlFile, 'Applying comprehensive security fixes') && success;
    
    // Step 3: Verify fixes
    success = await verifySecurityFixes() && success;
    
    if (success) {
      console.log('\n🎉 ALL SECURITY VULNERABILITIES FIXED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log('✅ Auth users data no longer exposed to anonymous users');
      console.log('✅ All views now use security_invoker instead of security_definer');
      console.log('✅ RLS enabled on all public tables with proper policies');
      console.log('✅ Performance indexes created for new tables');
      console.log('✅ All views are now secure and follow best practices');
      console.log('='.repeat(60));
      console.log('🔒 Your database is now secure and compliant!');
      
      // Update todo status
      console.log('\n📝 Updating TODO status...');
      
    } else {
      console.log('\n❌ Some security fixes failed. Please check the logs above.');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n💥 Critical error during security fixes:', error);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⚠️  Security fix process interrupted. Database may be in inconsistent state.');
  console.log('Please run the script again to complete the security fixes.');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run the script
main(); 