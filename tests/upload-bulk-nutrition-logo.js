#!/usr/bin/env node

/**
 * Bulk Nutrition Logo Upload Script
 * 
 * This script uploads a logo for the Bulk Nutrition organization in the Fresh AI CRM system.
 * It handles file upload to your storage provider and updates the organization's branding.
 * 
 * Usage:
 * 1. Create a .env file with AUTH_TOKEN and ORGANIZATION_ID
 * 2. Place your logo file in the assets directory
 * 3. Run: node upload-bulk-nutrition-logo.js
 */

require('dotenv').config();
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const chalk = require('chalk');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN;
const ORGANIZATION_ID = process.env.ORGANIZATION_ID;
const ORGANIZATION_SLUG = process.env.ORGANIZATION_SLUG || 'bulk-nutrition';
const LOGO_PATH = process.env.LOGO_PATH || path.join(__dirname, '../assets/bulk-nutrition-logo.png');

// Validate environment
if (!AUTH_TOKEN) {
  console.error(chalk.red('❌ Error: AUTH_TOKEN is required in .env file'));
  process.exit(1);
}

if (!ORGANIZATION_ID && !ORGANIZATION_SLUG) {
  console.error(chalk.red('❌ Error: Either ORGANIZATION_ID or ORGANIZATION_SLUG is required in .env file'));
  process.exit(1);
}

if (!fs.existsSync(LOGO_PATH)) {
  console.error(chalk.red(`❌ Error: Logo file not found at ${LOGO_PATH}`));
  console.log(chalk.yellow('Please place your logo file in the assets directory or specify LOGO_PATH in .env'));
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

// Upload file to storage
async function uploadFile(filePath) {
  console.log(chalk.blue('📤 Uploading logo file...'));
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(filePath));
  
  const url = `${API_BASE_URL}/storage/upload`;
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`
      },
      body: formData
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(chalk.green('✅ File uploaded successfully'));
      return data.url;
    } else {
      console.error(chalk.red('❌ File upload failed:'), data.error || 'Unknown error');
      return null;
    }
  } catch (error) {
    console.error(chalk.red('❌ File upload error:'), error);
    return null;
  }
}

// Main execution function
async function main() {
  console.log(chalk.blue('🚀 Starting Bulk Nutrition logo upload'));
  
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
    
    // Step 2: Upload logo file
    const logoUrl = await uploadFile(LOGO_PATH);
    
    if (!logoUrl) {
      console.log(chalk.red('❌ Logo upload failed, cannot continue'));
      process.exit(1);
    }
    
    // Step 3: Update organization branding
    console.log(chalk.blue('\n🎨 Updating organization branding'));
    
    const { status: updateStatus } = await apiCall(
      `/admin/organizations/${organizationId}`,
      'PUT',
      {
        branding: {
          logo_url: logoUrl,
          primary_color: process.env.PRIMARY_COLOR || '#4CAF50',
          secondary_color: process.env.SECONDARY_COLOR || '#FFC107'
        }
      }
    );
    
    if (updateStatus === 200) {
      console.log(chalk.green('✅ Organization branding updated successfully'));
      console.log(chalk.green(`Logo URL: ${logoUrl}`));
    } else {
      console.log(chalk.red(`❌ Failed to update organization branding: Status ${updateStatus}`));
    }
    
  } catch (error) {
    console.error(chalk.red('❌ Logo upload failed:'), error);
  }
}

// Run the script
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
