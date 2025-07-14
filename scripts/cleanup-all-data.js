#!/usr/bin/env node

/**
 * Comprehensive Data Cleanup Script
 * 
 * This script removes all mock data, users, and database content
 * to prepare the system for real data testing.
 * 
 * Usage: node scripts/cleanup-all-data.js
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

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`${message}`, 'cyan');
  log(`${'='.repeat(60)}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Initialize Supabase client
function initializeSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    logError('Missing Supabase environment variables');
    logError('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
    process.exit(1);
  }

  return createClient(supabaseUrl, supabaseKey);
}

// List of database tables to clean (only user/test/mock data)
const DATABASE_TABLES = [
  'contacts',
  'suppliers',
  'products',
  'prices', // or 'product_prices' if that's the actual table name
  'files',
  'emails',
  'email_accounts'
];

// Local data files to clean (only mock/test data)
const LOCAL_DATA_FILES = [
  'src/data/contacts.json',
  'src/data/suppliers.json',
  'src/data/user_identity.json',
  'src/data/excel_personality_data.xlsx',
  'src/data/personality_profiles.csv'
];

// Clean database tables
async function cleanDatabaseTables(supabase) {
  logHeader('CLEANING DATABASE TABLES');
  
  let totalCleaned = 0;
  
  for (const table of DATABASE_TABLES) {
    try {
      logInfo(`Cleaning table: ${table}`);
      
      // Check if table exists first
      const { data: tableExists, error: checkError } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
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
        .select('*', { count: 'exact', head: true });
      
      if (beforeCount === 0) {
        logInfo(`Table ${table} is already empty`);
        continue;
      }
      
      // Delete all records
      const { error: deleteError } = await supabase
        .from(table)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
      
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
  
  logSuccess(`Total database records cleaned: ${totalCleaned}`);
}

// Clean auth users (requires special handling)
async function cleanAuthUsers(supabase) {
  logHeader('CLEANING AUTH USERS');
  
  try {
    // Get all users
    const { data: users, error: getUsersError } = await supabase.auth.admin.listUsers();
    
    if (getUsersError) {
      throw getUsersError;
    }
    
    if (users.users.length === 0) {
      logInfo('No users found to clean');
      return;
    }
    
    logInfo(`Found ${users.users.length} users to delete`);
    
    let deletedCount = 0;
    for (const user of users.users) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        if (deleteError) {
          logError(`Error deleting user ${user.email}: ${deleteError.message}`);
        } else {
          deletedCount++;
          logInfo(`Deleted user: ${user.email}`);
        }
      } catch (error) {
        logError(`Error deleting user ${user.email}: ${error.message}`);
      }
    }
    
    logSuccess(`Deleted ${deletedCount} users`);
    
  } catch (error) {
    logError(`Error cleaning auth users: ${error.message}`);
  }
}

// Clean local data files
async function cleanLocalDataFiles() {
  logHeader('CLEANING LOCAL DATA FILES');
  
  let cleanedCount = 0;
  
  for (const filePath of LOCAL_DATA_FILES) {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        
        if (filePath.endsWith('.json')) {
          // Reset JSON files to empty arrays or objects
          const emptyContent = filePath.includes('user_identity') ? '{}' : '[]';
          fs.writeFileSync(fullPath, emptyContent, 'utf8');
          logSuccess(`Cleaned JSON file: ${filePath}`);
        } else {
          // Delete non-JSON files (Excel, CSV)
          fs.unlinkSync(fullPath);
          logSuccess(`Deleted file: ${filePath}`);
        }
        
        cleanedCount++;
      } else {
        logWarning(`File not found: ${filePath}`);
      }
    } catch (error) {
      logError(`Error cleaning file ${filePath}: ${error.message}`);
    }
  }
  
  logSuccess(`Cleaned ${cleanedCount} local data files`);
}

async function main() {
  logHeader('STARTING DATA CLEANUP');
  
  const supabase = initializeSupabase();
  
  await cleanDatabaseTables(supabase);
  await cleanAuthUsers(supabase);
  await cleanLocalDataFiles();
  
  logSuccess('Data cleanup complete!');
}

main();