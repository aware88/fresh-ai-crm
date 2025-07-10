#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

// Logging functions
const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  success: (msg) => console.log(`\n${colors.green}✓ ${msg}${colors.reset}\n`),
  warn: (msg) => console.log(`\n${colors.yellow}⚠ ${msg}${colors.reset}\n`),
  error: (msg) => console.error(`\n${colors.red}✗ ${msg}${colors.reset}\n`),
  header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}`)
};

// Check if file exists
const fileExists = (filePath) => {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
};

// Copy .env.example to .env if it doesn't exist
const setupEnvFile = () => {
  const envExamplePath = path.join(__dirname, '../.env.example');
  const envPath = path.join(__dirname, '../.env');

  if (!fileExists(envPath)) {
    if (fileExists(envExamplePath)) {
      fs.copyFileSync(envExamplePath, envPath);
      log.success('.env file created from .env.example');
    } else {
      log.warn('.env.example not found. Creating empty .env file');
      fs.writeFileSync(envPath, '# Environment variables');
    }
  } else {
    log.info('.env file already exists');
  }
};

// Install dependencies
const installDependencies = () => {
  log.header('Installing dependencies...');
  try {
    execSync('npm install', { stdio: 'inherit' });
    log.success('Dependencies installed successfully');
  } catch (error) {
    log.error('Failed to install dependencies');
    process.exit(1);
  }
};

// Run database migrations
const runMigrations = () => {
  log.header('Running database migrations...');
  try {
    execSync('npm run db:migrate', { stdio: 'inherit' });
    log.success('Database migrations completed');
  } catch (error) {
    log.error('Failed to run database migrations');
    process.exit(1);
  }
};

// Run database seed
const runSeed = async () => {
  const answer = await new Promise((resolve) => {
    rl.question('Do you want to seed the database with sample data? (y/N): ', resolve);
  });

  if (answer.toLowerCase() === 'y') {
    log.header('Seeding database...');
    try {
      execSync('npm run db:seed', { stdio: 'inherit' });
      log.success('Database seeded successfully');
    } catch (error) {
      log.warn('Failed to seed database. You can run it later with: npm run db:seed');
    }
  }
};

// Main setup function
const main = async () => {
  log.header('🚀 ARIS Setup');
  log.info('This script will help you set up the ARIS (Agentic Relationship Intelligence System) development environment.');

  // 1. Check Node.js version
  const nodeVersion = process.versions.node;
  const majorVersion = parseInt(nodeVersion.split('.')[0], 10);
  
  if (majorVersion < 18) {
    log.error(`Node.js version 18 or higher is required. You are using ${nodeVersion}.`);
    process.exit(1);
  }

  // 2. Setup .env file
  setupEnvFile();

  // 3. Install dependencies
  installDependencies();

  // 4. Run migrations
  runMigrations();

  // 5. Seed database
  await runSeed();

  // 6. Complete
  log.header('✅ Setup Complete!');
  log.info('You can now start the development server with:');
  console.log('\n  npm run dev\n');
  log.info('Or build for production with:');
  console.log('\n  npm run build\n  npm start\n');

  rl.close();
};

// Run the setup
main().catch((error) => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
