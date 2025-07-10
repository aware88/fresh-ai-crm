#!/usr/bin/env node
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

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

// Check if .env exists
const checkEnvFile = () => {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    log.error('.env file not found. Please create it from .env.example');
    process.exit(1);
  }
};

// Run database migrations
const runMigrations = () => {
  try {
    log.header('Running database migrations...');
    execSync('npx tsx scripts/run-migrations.ts', { stdio: 'inherit' });
    log.success('Database migrations completed successfully');
    return true;
  } catch (error) {
    log.error('Failed to run database migrations');
    return false;
  }
};

// Run database seeds
const runSeeds = async () => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const answer = await new Promise((resolve) => {
    rl.question('Do you want to seed the database with sample data? (y/N): ', resolve);
  });

  rl.close();

  if (answer.toLowerCase() === 'y') {
    try {
      log.header('Seeding database...');
      execSync('npm run db:seed', { stdio: 'inherit' });
      log.success('Database seeded successfully');
    } catch (error) {
      log.warn('Failed to seed database. You can run it later with: npm run db:seed');
    }
  }
};

// Main function
const main = async () => {
  log.header('🛠️  ARIS - Database Setup');
  
  // 1. Check environment
  checkEnvFile();
  
  // 2. Install dependencies if node_modules doesn't exist
  if (!fs.existsSync(path.join(process.cwd(), 'node_modules'))) {
    log.header('Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
    } catch (error) {
      log.error('Failed to install dependencies');
      process.exit(1);
    }
  }
  
  // 3. Run migrations
  const migrationsSuccess = runMigrations();
  if (!migrationsSuccess) {
    process.exit(1);
  }
  
  // 4. Run seeds
  await runSeeds();
  
  log.success('✅ Database setup completed successfully!');
  log.info('You can now start the development server with:');
  console.log('\n  npm run dev\n');
};

// Run the setup
main().catch((error) => {
  log.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
