#!/usr/bin/env node

/**
 * Northflank Deployment Preparation Script
 * 
 * This script helps prepare your Fresh AI CRM application for Northflank deployment.
 * It checks for required configuration files and environment variables.
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

// Required files for Northflank deployment
const requiredFiles = [
  'Dockerfile',
  'northflank.yaml',
  '.dockerignore'
];

// Required environment variables for Northflank
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

console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
console.log(`${colors.bright}${colors.blue}  Fresh AI CRM Northflank Preparation  ${colors.reset}`);
console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);

// Function to check if a file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

// Function to check required files
function checkRequiredFiles() {
  console.log(`${colors.cyan}Checking required files for Northflank deployment...${colors.reset}\n`);
  
  let missingFiles = false;
  
  requiredFiles.forEach(file => {
    const filePath = path.join(process.cwd(), file);
    
    if (!fileExists(filePath)) {
      console.log(`${colors.red}✗ ${file} is missing${colors.reset}`);
      missingFiles = true;
    } else {
      console.log(`${colors.green}✓ ${file} is present${colors.reset}`);
    }
  });
  
  if (missingFiles) {
    console.log(`\n${colors.yellow}Warning: Some required files are missing.${colors.reset}`);
    console.log(`${colors.yellow}Please create them before deploying to Northflank.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}All required files are present.${colors.reset}\n`);
  }
}

// Function to check environment variables
function checkEnvVars() {
  console.log(`${colors.cyan}Checking environment variables...${colors.reset}\n`);
  
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  let envContent = '';
  
  if (fileExists(envPath)) {
    envContent += fs.readFileSync(envPath, 'utf8');
  }
  
  if (fileExists(envLocalPath)) {
    envContent += '\n' + fs.readFileSync(envLocalPath, 'utf8');
  }
  
  if (!envContent) {
    console.log(`${colors.yellow}Warning: No .env or .env.local file found.${colors.reset}`);
    console.log(`${colors.yellow}You'll need to set up environment variables in Northflank.${colors.reset}\n`);
    return;
  }
  
  // Parse environment variables
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
    console.log(`${colors.yellow}Make sure to set them in Northflank environment settings.${colors.reset}\n`);
  } else {
    console.log(`\n${colors.green}All required environment variables are set.${colors.reset}\n`);
  }
}

// Function to check Next.js configuration
function checkNextConfig() {
  console.log(`${colors.cyan}Checking Next.js configuration...${colors.reset}\n`);
  
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  
  if (!fileExists(nextConfigPath)) {
    console.log(`${colors.red}✗ next.config.js not found${colors.reset}\n`);
    return;
  }
  
  console.log(`${colors.green}✓ next.config.js found${colors.reset}`);
  
  // Read next.config.js content
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  // Check if output is set to standalone
  if (nextConfigContent.includes("output: 'standalone'") || nextConfigContent.includes('output: "standalone"')) {
    console.log(`${colors.green}✓ Output is set to standalone${colors.reset}\n`);
  } else {
    console.log(`${colors.red}✗ Output is not set to standalone${colors.reset}`);
    console.log(`${colors.yellow}Please add 'output: "standalone"' to your next.config.js${colors.reset}\n`);
  }
}

// Function to provide deployment guidance
function provideDeploymentGuidance() {
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}  Northflank Deployment Guidance  ${colors.reset}`);
  console.log(`${colors.bright}${colors.blue}========================================${colors.reset}\n`);
  
  console.log(`${colors.cyan}To deploy your application to Northflank:${colors.reset}\n`);
  
  console.log(`${colors.bright}1. Create a Northflank account${colors.reset}`);
  console.log(`   - Sign up at https://northflank.com/`);
  console.log(`   - Create a new project for your application\n`);
  
  console.log(`${colors.bright}2. Set up your Northflank project${colors.reset}`);
  console.log(`   - Connect your Git repository`);
  console.log(`   - Create a new service using the Dockerfile option`);
  console.log(`   - Configure resources (CPU, memory) based on your needs\n`);
  
  console.log(`${colors.bright}3. Configure environment variables${colors.reset}`);
  console.log(`   - Set all required environment variables in Northflank`);
  console.log(`   - Make sure to set NEXTAUTH_URL to your Northflank domain\n`);
  
  console.log(`${colors.bright}4. Deploy your application${colors.reset}`);
  console.log(`   - Push your changes to your Git repository`);
  console.log(`   - Northflank will automatically build and deploy your application\n`);
  
  console.log(`${colors.bright}5. Monitor your deployment${colors.reset}`);
  console.log(`   - Check the build and deployment logs`);
  console.log(`   - Monitor your application's health and performance\n`);
  
  console.log(`For detailed instructions, refer to the Northflank documentation:`);
  console.log(`${colors.dim}- NORTHFLANK.md${colors.reset}\n`);
}

// Function to create a Git branch for Northflank deployment
function createNorthflankBranch() {
  console.log(`${colors.cyan}Creating a Git branch for Northflank deployment...${colors.reset}\n`);
  
  try {
    // Check if git is initialized
    execSync('git status', { stdio: 'ignore' });
    
    // Create and checkout a new branch
    const branchName = 'northflank-deployment';
    
    try {
      execSync(`git checkout -b ${branchName}`, { stdio: 'ignore' });
      console.log(`${colors.green}✓ Created and checked out new branch: ${branchName}${colors.reset}\n`);
    } catch (err) {
      // Branch might already exist
      try {
        execSync(`git checkout ${branchName}`, { stdio: 'ignore' });
        console.log(`${colors.yellow}! Branch ${branchName} already exists, checked it out${colors.reset}\n`);
      } catch (checkoutErr) {
        console.log(`${colors.red}✗ Failed to create or checkout branch: ${checkoutErr.message}${colors.reset}\n`);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.log(`${colors.red}✗ Git repository not initialized or error: ${err.message}${colors.reset}\n`);
    return false;
  }
}

// Main function
async function main() {
  try {
    checkRequiredFiles();
    checkEnvVars();
    checkNextConfig();
    
    const branchCreated = createNorthflankBranch();
    
    if (branchCreated) {
      console.log(`${colors.yellow}Would you like to commit the Northflank configuration files? (y/n) ${colors.reset}`);
      
      rl.question('', (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            execSync('git add Dockerfile northflank.yaml NORTHFLANK.md next.config.js', { stdio: 'inherit' });
            execSync('git commit -m "Add Northflank deployment configuration"', { stdio: 'inherit' });
            console.log(`${colors.green}✓ Changes committed to the northflank-deployment branch${colors.reset}\n`);
          } catch (err) {
            console.log(`${colors.red}✗ Failed to commit changes: ${err.message}${colors.reset}\n`);
          }
        }
        
        provideDeploymentGuidance();
        console.log(`${colors.bright}${colors.green}Northflank preparation complete!${colors.reset}\n`);
        rl.close();
      });
    } else {
      provideDeploymentGuidance();
      console.log(`${colors.bright}${colors.green}Northflank preparation complete!${colors.reset}\n`);
      rl.close();
    }
  } catch (err) {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    rl.close();
  }
}

main();
