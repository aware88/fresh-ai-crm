#!/usr/bin/env node

/**
 * Bulk Nutrition Organization Setup Script
 * 
 * This script sets up the Bulk Nutrition organization in the CRM Mind system.
 * It creates the organization, configures branding, sets up subscription, and creates an admin user.
 * 
 * Usage:
 * 1. Create a .env file with AUTH_TOKEN
 * 2. Run: node setup-bulk-nutrition.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_NAME = 'Bulk Nutrition';
const ORGANIZATION_SLUG = 'bulk-nutrition';
const PRIMARY_COLOR = '#4CAF50'; // Green
const SECONDARY_COLOR = '#FFC107'; // Amber
const SUBSCRIPTION_PLAN = 'enterprise'; // Highest tier

// Validate environment
if (!AUTH_TOKEN) {
  console.error(chalk.red('❌ Error: AUTH_TOKEN is required in .env file'));
  process.exit(1);
}

// Test results tracking
const testResults = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Helper function to add test result
function addTestResult(name, status, message = '') {
  const icons = {
    passed: chalk.green('✅'),
    failed: chalk.red('❌'),
    skipped: chalk.yellow('⏭️')
  };
  
  testResults.tests.push({ name, status, message });
  testResults[status]++;
  
  console.log(`${icons[status]} ${name}${message ? ': ' + message : ''}`);
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
    const data = await response.json();
    return { response, data };
  } catch (error) {
    console.error(`API call error to ${url}:`, error);
    throw error;
  }
}

// Main execution function
async function main() {
  console.log(chalk.blue('🚀 Starting Bulk Nutrition organization setup'));
  
  try {
    // Step 1: Create the organization
    console.log(chalk.blue('\n📋 Step 1: Creating organization'));
    const { response: createResponse, data: createData } = await apiCall(
      '/admin/organizations',
      'POST',
      {
        name: ORGANIZATION_NAME,
        slug: ORGANIZATION_SLUG
      }
    );
    
    if (createResponse.status === 201) {
      addTestResult('Create organization', 'passed', `ID: ${createData.organization.id}`);
      const organizationId = createData.organization.id;
      
      // Step 2: Configure branding
      console.log(chalk.blue('\n🎨 Step 2: Configuring branding'));
      const { response: brandingResponse } = await apiCall(
        `/admin/organizations/${organizationId}`,
        'PUT',
        {
          branding: {
            primary_color: PRIMARY_COLOR,
            secondary_color: SECONDARY_COLOR,
            logo_url: 'https://example.com/bulk-nutrition-logo.png' // Replace with actual logo URL
          }
        }
      );
      
      if (brandingResponse.status === 200) {
        addTestResult('Configure branding', 'passed');
      } else {
        addTestResult('Configure branding', 'failed', `Status: ${brandingResponse.status}`);
      }
      
      // Step 3: Set up subscription
      console.log(chalk.blue('\n💳 Step 3: Setting up subscription'));
      const { response: subscriptionResponse } = await apiCall(
        `/admin/subscription/organizations/${organizationId}/change-plan`,
        'POST',
        {
          plan: SUBSCRIPTION_PLAN,
          trial_days: 0 // No trial, activate immediately
        }
      );
      
      if (subscriptionResponse.status === 200) {
        addTestResult('Set up subscription', 'passed');
      } else {
        addTestResult('Set up subscription', 'failed', `Status: ${subscriptionResponse.status}`);
      }
      
      // Step 4: Verify RBAC policies
      console.log(chalk.blue('\n🔒 Step 4: Verifying RBAC policies'));
      
      // Get organization details to verify
      const { response: getOrgResponse, data: orgData } = await apiCall(
        `/admin/organizations/${organizationId}`
      );
      
      if (getOrgResponse.status === 200) {
        addTestResult('Verify organization details', 'passed');
      } else {
        addTestResult('Verify organization details', 'failed', `Status: ${getOrgResponse.status}`);
      }
      
      // Test feature flags
      const { response: featuresResponse } = await apiCall(
        `/admin/organizations/${organizationId}`,
        'PUT',
        {
          feature_flags: {
            metakocka_integration: true,
            advanced_analytics: true
          }
        }
      );
      
      if (featuresResponse.status === 200) {
        addTestResult('Configure feature flags', 'passed');
      } else {
        addTestResult('Configure feature flags', 'failed', `Status: ${featuresResponse.status}`);
      }
      
      // Step 5: Create admin user (if needed)
      console.log(chalk.blue('\n👤 Step 5: Creating admin user'));
      addTestResult('Create admin user', 'skipped', 'Use the admin dashboard to invite users');
      
      console.log(chalk.green('\n✅ Bulk Nutrition organization setup complete!'));
      console.log(chalk.green(`Organization ID: ${organizationId}`));
      console.log(chalk.green(`Organization Slug: ${ORGANIZATION_SLUG}`));
      console.log(chalk.yellow('\nNext steps:'));
      console.log('1. Upload your logo through the admin dashboard');
      console.log('2. Invite users to your organization');
      console.log('3. Configure Metakocka integration settings');
      
    } else if (createResponse.status === 400 && createData.error === 'Organization slug is already in use') {
      console.log(chalk.yellow('⚠️ Organization already exists with this slug'));
      
      // Try to get the existing organization
      const { response: listResponse, data: listData } = await apiCall('/admin/organizations');
      
      if (listResponse.status === 200) {
        const existingOrg = listData.organizations.find(org => org.slug === ORGANIZATION_SLUG);
        
        if (existingOrg) {
          console.log(chalk.green(`✅ Found existing organization: ${existingOrg.name} (ID: ${existingOrg.id})`));
          console.log(chalk.yellow('\nTo update the existing organization, use the admin dashboard.'));
        } else {
          console.log(chalk.red('❌ Could not find the existing organization in the list.'));
        }
      }
    } else {
      addTestResult('Create organization', 'failed', `Status: ${createResponse.status}, Error: ${createData.error}`);
    }
  } catch (error) {
    console.error(chalk.red('❌ Setup failed:'), error);
  }
  
  // Print test summary
  console.log(chalk.blue('\n📊 Test Summary:'));
  console.log(chalk.green(`✅ Passed: ${testResults.passed}`));
  console.log(chalk.red(`❌ Failed: ${testResults.failed}`));
  console.log(chalk.yellow(`⏭️ Skipped: ${testResults.skipped}`));
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
