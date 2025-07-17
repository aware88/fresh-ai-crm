#!/usr/bin/env node

/**
 * User-Specific Test Data Cleanup Script
 * 
 * This script removes test data for a specific user ID to prepare for real Metakocka testing.
 * It preserves the user account but removes all associated test data.
 * 
 * Usage: node scripts/cleanup-user-test-data.js [USER_ID]
 * If no USER_ID is provided, it will prompt for one.
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: '.env.local' });

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  reset: '\x1b[0m'
};

function logHeader(message) {
  console.log(`\n${colors.cyan}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.cyan}${message}${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
}

function logInfo(message) {
  console.log(`${colors.blue}ℹ ${message}${colors.reset}`);
}

function logSuccess(message) {
  console.log(`${colors.green}✅ ${message}${colors.reset}`);
}

function logWarning(message) {
  console.log(`${colors.yellow}⚠️ ${message}${colors.reset}`);
}

function logError(message) {
  console.log(`${colors.red}❌ ${message}${colors.reset}`);
}

// Initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    logError('Missing required environment variables:');
    logError('- NEXT_PUBLIC_SUPABASE_URL');
    logError('- SUPABASE_SERVICE_ROLE_KEY');
    logError('Please check your .env.local file');
    process.exit(1);
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

// Get user ID from command line or prompt
function getUserId() {
  const args = process.argv.slice(2);
  if (args.length > 0) {
    return args[0];
  }
  
  // If no user ID provided, we'll need to prompt or use a default
  logWarning('No user ID provided. Please provide a user ID as an argument.');
  logInfo('Usage: node scripts/cleanup-user-test-data.js [USER_ID]');
  process.exit(1);
}

// Database tables to clean for the user (in dependency order)
const USER_DATA_TABLES = [
  // AI and Email Systems
  'ai_memory_access',
  'ai_memory_relationships', 
  'ai_memories',
  'ai_memory_contexts',
  'agent_memory_config',
  'email_queue',
  'email_accounts',
  'emails',
  'email_templates',
  
  // Interactions and Activity
  'interactions',
  'user_activity_logs',
  'notifications',
  
  // Sales and Documents
  'sales_document_items',
  'sales_documents',
  'files',
  
  // Metakocka Integration
  'metakocka_error_logs',
  'metakocka_sales_document_mappings',
  'metakocka_contact_mappings',
  'metakocka_product_mappings',
  'metakocka_credentials',
  
  // Inventory
  'inventory_alert_notifications',
  'inventory_alert_history',
  'inventory_alerts',
  
  // Core Business Data
  'contacts',
  'products',
  'suppliers',
  'prices',
  
  // Organization and User Data (be careful with these)
  'organization_members',
  'user_roles'
];

// Clean user data from database tables
async function cleanUserData(supabase, userId) {
  logHeader('CLEANING USER DATA FROM DATABASE');
  
  let totalCleaned = 0;
  
  for (const table of USER_DATA_TABLES) {
    try {
      logInfo(`Cleaning table: ${table}`);
      
      // Check if table exists and has user_id column
      const { data: tableExists, error: checkError } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (checkError) {
        if (checkError.code === 'PGRST116' || checkError.message.includes('does not exist')) {
          logWarning(`Table ${table} does not exist - skipping`);
          continue;
        }
        throw checkError;
      }
      
      // Get count before deletion
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      
      if (beforeCount === 0) {
        logInfo(`Table ${table} has no data for user ${userId}`);
        continue;
      }
      
      // Delete user's records
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        throw deleteError;
      }
      
      logSuccess(`Cleaned ${beforeCount} records from ${table}`);
      totalCleaned += beforeCount;
      
    } catch (error) {
      logError(`Error cleaning table ${table}: ${error.message}`);
      // Continue with other tables
    }
  }
  
  logSuccess(`Total records cleaned: ${totalCleaned}`);
}

// Clean Metakocka-specific data
async function cleanMetakockaData(supabase, userId) {
  logHeader('CLEANING METAKOCKA INTEGRATION DATA');
  
  try {
    // Clean Metakocka credentials
    const { data: credentials, error: credError } = await supabase
      .from('metakocka_credentials')
      .select('id')
      .eq('user_id', userId);
    
    if (credError) {
      logWarning(`Could not check Metakocka credentials: ${credError.message}`);
    } else if (credentials && credentials.length > 0) {
      const { error: deleteCredError } = await supabase
        .from('metakocka_credentials')
        .delete()
        .eq('user_id', userId);
      
      if (deleteCredError) {
        logError(`Error deleting Metakocka credentials: ${deleteCredError.message}`);
      } else {
        logSuccess(`Deleted ${credentials.length} Metakocka credential records`);
      }
    }
    
    // Clean all Metakocka mappings
    const mappingTables = [
      'metakocka_product_mappings',
      'metakocka_contact_mappings', 
      'metakocka_sales_document_mappings'
    ];
    
    for (const table of mappingTables) {
      try {
        const { data: mappings, error: mappingError } = await supabase
          .from(table)
          .select('id')
          .eq('user_id', userId);
        
        if (mappingError) {
          logWarning(`Could not check ${table}: ${mappingError.message}`);
          continue;
        }
        
        if (mappings && mappings.length > 0) {
          const { error: deleteMappingError } = await supabase
            .from(table)
            .delete()
            .eq('user_id', userId);
          
          if (deleteMappingError) {
            logError(`Error deleting ${table}: ${deleteMappingError.message}`);
          } else {
            logSuccess(`Deleted ${mappings.length} records from ${table}`);
          }
        }
      } catch (error) {
        logError(`Error processing ${table}: ${error.message}`);
      }
    }
    
    // Clean Metakocka error logs
    try {
      const { data: errorLogs, error: logError } = await supabase
        .from('metakocka_error_logs')
        .select('id')
        .eq('user_id', userId);
      
      if (logError) {
        logWarning(`Could not check error logs: ${logError.message}`);
      } else if (errorLogs && errorLogs.length > 0) {
        const { error: deleteLogError } = await supabase
          .from('metakocka_error_logs')
          .delete()
          .eq('user_id', userId);
        
        if (deleteLogError) {
          logError(`Error deleting error logs: ${deleteLogError.message}`);
        } else {
          logSuccess(`Deleted ${errorLogs.length} error log records`);
        }
      }
    } catch (error) {
      logError(`Error cleaning error logs: ${error.message}`);
    }
    
  } catch (error) {
    logError(`Error cleaning Metakocka data: ${error.message}`);
  }
}

// Verify user exists and get basic info
async function verifyUser(supabase, userId) {
  logHeader('VERIFYING USER');
  
  try {
    // Check if user exists in auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser.user) {
      logError(`User ${userId} not found in auth system`);
      return false;
    }
    
    logSuccess(`User found: ${authUser.user.email}`);
    logInfo(`User ID: ${userId}`);
    logInfo(`Created: ${authUser.user.created_at}`);
    
    return true;
  } catch (error) {
    logError(`Error verifying user: ${error.message}`);
    return false;
  }
}

// Main cleanup function
async function main() {
  logHeader('USER-SPECIFIC TEST DATA CLEANUP');
  
  const userId = getUserId();
  logInfo(`Target User ID: ${userId}`);
  
  const supabase = initializeSupabase();
  
  // Verify user exists
  const userExists = await verifyUser(supabase, userId);
  if (!userExists) {
    logError('User verification failed. Exiting.');
    process.exit(1);
  }
  
  // Confirm cleanup
  logWarning('This will delete ALL test data for this user!');
  logWarning('The user account will be preserved, but all associated data will be removed.');
  logInfo('Press Ctrl+C to cancel, or wait 5 seconds to continue...');
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Perform cleanup
  await cleanUserData(supabase, userId);
  await cleanMetakockaData(supabase, userId);
  
  logHeader('CLEANUP COMPLETE');
  logSuccess('User test data cleanup completed successfully!');
  logInfo('The user account has been preserved.');
  logInfo('All test data has been removed.');
  logInfo('The user can now proceed with real Metakocka testing.');
  
  // Provide next steps
  logHeader('NEXT STEPS');
  logInfo('1. Have the user log in to verify their account still works');
  logInfo('2. Navigate to Settings > Integrations > Metakocka');
  logInfo('3. Configure Metakocka credentials');
  logInfo('4. Test the connection');
  logInfo('5. Configure auto-sync settings');
  logInfo('6. Begin real data synchronization');
}

// Run the cleanup
main().catch(error => {
  logError(`Cleanup failed: ${error.message}`);
  console.error(error);
  process.exit(1);
}); 