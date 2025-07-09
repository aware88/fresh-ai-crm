#!/usr/bin/env node

/**
 * Bulk Nutrition Admin User Creation Script
 * 
 * This script creates an admin user for the Bulk Nutrition organization in the CRM Mind system.
 * It assigns the appropriate roles and permissions to the user.
 * 
 * Usage:
 * 1. Create a .env file with AUTH_TOKEN and ORGANIZATION_ID
 * 2. Run: node create-bulk-nutrition-admin.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;
const ORGANIZATION_SLUG = process.env.ORGANIZATION_SLUG || 'bulk-nutrition';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_FIRST_NAME = process.env.ADMIN_FIRST_NAME || 'Bulk';
const ADMIN_LAST_NAME = process.env.ADMIN_LAST_NAME || 'Admin';

// Validate environment
if (!AUTH_TOKEN) {
  console.error(chalk.red('❌ Error: AUTH_TOKEN is required in .env file'));
  process.exit(1);
}

if (!ORGANIZATION_ID && !ORGANIZATION_SLUG) {
  console.error(chalk.red('❌ Error: Either ORGANIZATION_ID or ORGANIZATION_SLUG is required in .env file'));
  process.exit(1);
}

if (!ADMIN_EMAIL) {
  console.error(chalk.red('❌ Error: ADMIN_EMAIL is required in .env file'));
  process.exit(1);
}

// Helper function for API calls
async function apiCall(endpoint, method = 'GET', body = null) {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json'
  };
  
  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };
  
  try {
    const response = await fetch(url, options);
    let data;
    
    try {
      data = await response.json();
    } catch (e) {
      data = null;
    }
    
    return { response, data, status: response.status };
  } catch (error) {
    console.error(`API call error to ${url}:`, error);
    throw error;
  }
}

// Main execution function
async function main() {
  console.log(chalk.blue('🚀 Starting Bulk Nutrition admin user creation'));
  
  try {
    // Step 1: Find organization ID if not provided
    let organizationId = ORGANIZATION_ID;
    
    if (!organizationId && ORGANIZATION_SLUG) {
      console.log(chalk.blue('\n🔍 Finding organization by slug'));
      const { data: listData, status } = await apiCall('/admin/organizations');
      
      if (status === 200) {
        const org = listData.organizations.find(org => org.slug === ORGANIZATION_SLUG);
        
        if (org) {
          organizationId = org.id;
          console.log(chalk.green(`✅ Found organization: ${org.name} (ID: ${organizationId})`));
        } else {
          console.log(chalk.red(`❌ Organization with slug '${ORGANIZATION_SLUG}' not found`));
          process.exit(1);
        }
      } else {
        console.log(chalk.red(`❌ Failed to list organizations: Status ${status}`));
        process.exit(1);
      }
    }
    
    // Step 2: Check if user already exists
    console.log(chalk.blue('\n👤 Checking if user already exists'));
    
    const { data: usersData, status: usersStatus } = await apiCall(`/admin/organizations/${organizationId}/users`);
    
    if (usersStatus === 200) {
      const existingUser = usersData.users.find(user => user.email === ADMIN_EMAIL);
      
      if (existingUser) {
        console.log(chalk.yellow(`⚠️ User with email ${ADMIN_EMAIL} already exists`));
        
        // Step 3a: Update existing user's roles
        console.log(chalk.blue('\n🔄 Updating user roles'));
        
        const { status: updateStatus } = await apiCall(
          `/admin/organizations/${organizationId}/users/${existingUser.id}/roles`,
          'PUT',
          {
            roles: ['admin', 'owner']
          }
        );
        
        if (updateStatus === 200) {
          console.log(chalk.green('✅ User roles updated successfully'));
        } else {
          console.log(chalk.red(`❌ Failed to update user roles: Status ${updateStatus}`));
        }
        
        return;
      }
    } else {
      console.log(chalk.red(`❌ Failed to list organization users: Status ${usersStatus}`));
    }
    
    // Step 3b: Create new user
    console.log(chalk.blue('\n➕ Creating new admin user'));
    
    const { data: createData, status: createStatus } = await apiCall(
      `/admin/organizations/${organizationId}/users`,
      'POST',
      {
        email: ADMIN_EMAIL,
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        roles: ['admin', 'owner']
      }
    );
    
    if (createStatus === 201) {
      console.log(chalk.green('✅ Admin user created successfully'));
      console.log(chalk.green(`User ID: ${createData.user.id}`));
      console.log(chalk.green(`Email: ${createData.user.email}`));
      console.log(chalk.green(`Roles: ${createData.roles.join(', ')}`));
      
      console.log(chalk.yellow('\nℹ️ An invitation email has been sent to the user'));
      console.log(chalk.yellow('They will need to set their password to access the system'));
    } else {
      console.log(chalk.red(`❌ Failed to create admin user: Status ${createStatus}`));
      if (createData && createData.error) {
        console.log(chalk.red(`Error: ${createData.error}`));
      }
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Admin user creation failed:'), error);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
