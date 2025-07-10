#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Required environment variables
const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'AZURE_AD_CLIENT_ID',
  'AZURE_AD_CLIENT_SECRET',
  'AZURE_AD_TENANT_ID',
  'NEXT_PUBLIC_AZURE_AD_CLIENT_ID'
];

// Optional but recommended environment variables
const recommendedVars = [
  'EMAIL_SERVER',
  'EMAIL_FROM',
  'IMAP_HOST',
  'IMAP_PORT',
  'IMAP_USER',
  'IMAP_PASSWORD'
];

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  bright: '\x1b[1m'
};

console.log(`\n${colors.bright}🔍 Environment Variable Check${colors.reset}\n`);

// Check required variables
let allRequiredVarsPresent = true;
console.log(`${colors.bright}Required Variables:${colors.reset}`);
requiredVars.forEach(varName => {
  if (!process.env[varName]) {
    console.error(`  ${colors.red}✗${colors.reset} ${varName} is not set`);
    allRequiredVarsPresent = false;
  } else {
    // Don't log the actual values of sensitive variables
    const displayValue = varName.includes('SECRET') || varName.includes('KEY') 
      ? '********' 
      : process.env[varName];
    console.log(`  ${colors.green}✓${colors.reset} ${varName}=${displayValue}`);
  }
});

// Check recommended variables
console.log(`\n${colors.bright}Recommended Variables:${colors.reset}`);
recommendedVars.forEach(varName => {
  if (!process.env[varName]) {
    console.log(`  ${colors.yellow}⚠${colors.reset} ${varName} is not set (recommended)`);
  } else {
    console.log(`  ${colors.green}✓${colors.reset} ${varName} is set`);
  }
});

// Check for .env file
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error(`\n${colors.red}✗ .env file not found. Please create it from .env.example${colors.reset}`);
  process.exit(1);
}

// Final status
console.log('\n' + '='.repeat(50));
if (allRequiredVarsPresent) {
  console.log(`\n${colors.green}✅ All required environment variables are set!${colors.reset}`);
} else {
  console.error(`\n${colors.red}❌ Some required environment variables are missing.${colors.reset}`);
  console.log(`\nPlease set the missing variables in your .env file and try again.`);
  process.exit(1);
}

console.log('\nYou can now start the application with:');
console.log('  npm run dev\n');
