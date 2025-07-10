#!/usr/bin/env node

/**
 * Production Deployment Preparation Script
 * 
 * This script helps prepare your Fresh AI CRM application for production deployment.
 * It checks for required environment variables, validates configuration, and provides
 * guidance on setting up your production environment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// ANSI color codes for better readability
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Required environment variables for production
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_JWT_SECRET',
  'NEXTAUTH_URL',
  'NEXTAUTH_SECRET',
  'APP_SECRET',
  'ENCRYPTION_KEY'
];

// Optional but recommended environment variables
const recommendedEnvVars = [
  'EMAIL_SERVER',
  'EMAIL_FROM',
  'NEXT_PUBLIC_ENABLE_EMAIL_INTEGRATION',
  'NEXT_PUBLIC_ENABLE_ANALYTICS',
  'LOG_LEVEL'
];

console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
console.log(`${colors.bright}${colors.blue}  Fresh AI CRM Production Preparation  ${colors.reset}`);
console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to check environment variables
function checkEnvVars() {
  console.log(`${colors.cyan}Checking environment variables...${colors.reset}\n`);
  
  const envPath = path.join(process.cwd(), '.env');
  const envExamplePath = path.join(process.cwd(), '.env.example');
  
  if (!fileExists(envPath)) {
    console.log(`${colors.yellow}Warning: .env file not found.${colors.reset}`);
    console.log(`${colors.yellow}You'll need to set up environment variables in your deployment platform.${colors.reset}\n`);
  } else {
    console.log(`${colors.green}✓ .env file found.${colors.reset}\n`);
    
    // Read .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        envVars[key] = value;
      }
    });
    
    // Check required env vars
    console.log(`${colors.cyan}Required environment variables:${colors.reset}`);
    let missingRequired = false;
    
    requiredEnvVars.forEach(varName => {
      if (!envVars[varName] || envVars[varName] === '') {
        console.log(`${colors.red}✗ ${varName} is missing or empty${colors.reset}`);
        missingRequired = true;
      } else {
        console.log(`${colors.green}✓ ${varName} is set${colors.reset}`);
      }
    });
    
    if (missingRequired) {
      console.log(`\n${colors.yellow}Warning: Some required environment variables are missing.${colors.reset}`);
      console.log(`${colors.yellow}Make sure to set them in your production environment.${colors.reset}\n`);
    } else {
      console.log(`\n${colors.green}All required environment variables are set.${colors.reset}\n`);
    }
    
    // Check recommended env vars
    console.log(`${colors.cyan}Recommended environment variables:${colors.reset}`);
    
    recommendedEnvVars.forEach(varName => {
      if (!envVars[varName] || envVars[varName] === '') {
        console.log(`${colors.yellow}! ${varName} is missing or empty${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ ${varName} is set${colors.reset}`);
      }
    });
    
    console.log('');
  }
}

// Function to check for production build
function checkProductionBuild() {
  console.log(`${colors.cyan}Checking production build...${colors.reset}\n`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fileExists(nextConfigPath)) {
    console.log(`${colors.red}✗ next.config.js not found${colors.reset}\n`);
    return;
  }
  
  console.log(`${colors.green}✓ next.config.js found${colors.reset}`);
  
  // Check if .next directory exists (indicates a previous build)
  const nextBuildPath = path.join(process.cwd(), '.next');
  
  if (fileExists(nextBuildPath)) {
    console.log(`${colors.green}✓ .next directory found (previous build exists)${colors.reset}\n`);
  } else {
    console.log(`${colors.yellow}! .next directory not found (no previous build)${colors.reset}`);
    console.log(`${colors.yellow}You'll need to build the application before deployment:${colors.reset}`);
    console.log(`${colors.dim}  npm run build${colors.reset}\n`);
  }
}

// Function to check database migrations
function checkDatabaseMigrations() {
  console.log(`${colors.cyan}Checking database migrations...${colors.reset}\n`);
  
  const migrationsPath = path.join(process.cwd(), 'migrations');
  
  if (!fileExists(migrationsPath)) {
    console.log(`${colors.yellow}! migrations directory not found${colors.reset}\n`);
    return;
  }
  
  console.log(`${colors.green}✓ migrations directory found${colors.reset}`);
  
  // Count migration files
  try {
    const migrationFiles = fs.readdirSync(migrationsPath).filter(file => file.endsWith('.sql'));
    console.log(`${colors.green}✓ Found ${migrationFiles.length} migration files${colors.reset}\n`);
    
    console.log(`${colors.yellow}! Remember to run migrations in your production environment:${colors.reset}`);
    console.log(`${colors.dim}  npm run db:migrate${colors.reset}\n`);
  } catch (err) {
    console.log(`${colors.red}✗ Error reading migrations directory: ${err.message}${colors.reset}\n`);
  }
}

// Function to check for Render configuration
function checkRenderConfig() {
  console.log(`${colors.cyan}Checking Render configuration...${colors.reset}\n`);
  
  const renderConfigPath = path.join(process.cwd(), 'render.yaml');
  
  if (!fileExists(renderConfigPath)) {
    console.log(`${colors.yellow}! render.yaml not found${colors.reset}`);
    console.log(`${colors.yellow}Consider creating a render.yaml file for easier deployment to Render.${colors.reset}\n`);
    return;
  }
  
  console.log(`${colors.green}✓ render.yaml found${colors.reset}\n`);
}

// Function to provide deployment guidance
function provideDeploymentGuidance() {
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  Deployment Guidance  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}To deploy your application to production:${colors.reset}\n`);
  
  console.log(`${colors.bright}1. Set up your Supabase project${colors.reset}`);
  console.log(`   - Ensure all tables and RLS policies are properly configured`);
  console.log(`   - Set up authentication providers\n`);
  
  console.log(`${colors.bright}2. Deploy to Render${colors.reset}`);
  console.log(`   - Connect your GitHub repository to Render`);
  console.log(`   - Create a new Web Service`);
  console.log(`   - Configure build and start commands`);
  console.log(`   - Set all required environment variables\n`);
  
  console.log(`${colors.bright}3. Set up your domain (helloaris.com)${colors.reset}`);
  console.log(`   - Configure DNS settings`);
  console.log(`   - Set up SSL certificate\n`);
  
  console.log(`${colors.bright}4. Connect your landing page to the backend${colors.reset}`);
  console.log(`   - Update API endpoints in your landing page code`);
  console.log(`   - Configure authentication flow`);
  console.log(`   - Set up subscription management\n`);
  
  console.log(`${colors.bright}5. Test your deployment${colors.reset}`);
  console.log(`   - Verify all features are working correctly`);
  console.log(`   - Test signup, signin, and subscription flows\n`);
  
  console.log(`For detailed instructions, refer to the deployment guides:`);
  console.log(`${colors.dim}- docs/production-deployment.md${colors.reset}`);
  console.log(`${colors.dim}- docs/landing-page-integration.md${colors.reset}\n`);
}

// Main function
async function main() {
  try {
    checkEnvVars();
    checkProductionBuild();
    checkDatabaseMigrations();
    checkRenderConfig();
    provideDeploymentGuidance();
    
    console.log(`${colors.bright}${colors.green}Production preparation check complete!${colors.reset}\n`);
    
    rl.question(`${colors.yellow}Would you like to run a production build now? (y/n) ${colors.reset}`, (answer) => {
      if (answer.toLowerCase() === 'y') {
        console.log(`\n${colors.cyan}Running production build...${colors.reset}\n`);
        try {
          execSync('npm run build', { stdio: 'inherit' });
          console.log(`\n${colors.green}Production build completed successfully!${colors.reset}\n`);
        } catch (err) {
          console.log(`\n${colors.red}Error during production build: ${err.message}${colors.reset}\n`);
        }
      }
      
      console.log(`\n${colors.bright}${colors.blue}Thank you for using Fresh AI CRM!${colors.reset}\n`);
      rl.close();
    });
  } catch (error) {
    console.error(`${colors.red}Error: ${error.message}${colors.reset}`);
    rl.close();
  }
}

// Run the main function
main();
