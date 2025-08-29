#!/usr/bin/env node

/**
 * Setup Email Cache Cleanup Automation
 * 
 * This script helps you set up automated cache cleanup for the optimized email system.
 * It provides multiple options for scheduling the cleanup function.
 */

const path = require('path');
const fs = require('fs');

console.log('🧹 Email Cache Cleanup Setup');
console.log('============================');
console.log();

console.log('The optimized email system includes automatic cache cleanup to maintain');
console.log('optimal performance and storage usage. Here are your options:');
console.log();

console.log('📋 CLEANUP OPTIONS:');
console.log();

console.log('1. 🔧 MANUAL CLEANUP');
console.log('   Call the API endpoint manually when needed:');
console.log('   curl -X POST http://localhost:3000/api/emails/cleanup-cache');
console.log();

console.log('2. 🔒 SECURE CLEANUP (Recommended)');
console.log('   Set up a token for secure access:');
console.log('   • Add to your .env.local: CACHE_CLEANUP_TOKEN=your-secret-token');
console.log('   • Call with: curl -X POST http://localhost:3000/api/emails/cleanup-cache \\');
console.log('     -H "Authorization: Bearer your-secret-token"');
console.log();

console.log('3. ⏰ AUTOMATED CLEANUP OPTIONS:');
console.log();

console.log('   A. GitHub Actions (Free, Recommended)');
console.log('      Create .github/workflows/email-cache-cleanup.yml:');
console.log();
console.log('      ```yaml');
console.log('      name: Email Cache Cleanup');
console.log('      on:');
console.log('        schedule:');
console.log('          - cron: "0 2 * * *"  # Daily at 2 AM');
console.log('      jobs:');
console.log('        cleanup:');
console.log('          runs-on: ubuntu-latest');
console.log('          steps:');
console.log('            - name: Cleanup Email Cache');
console.log('              run: |');
console.log('                curl -X POST ${{ secrets.APP_URL }}/api/emails/cleanup-cache \\');
console.log('                  -H "Authorization: Bearer ${{ secrets.CACHE_CLEANUP_TOKEN }}"');
console.log('      ```');
console.log();

console.log('   B. Vercel Cron (If using Vercel)');
console.log('      Add to your vercel.json:');
console.log('      ```json');
console.log('      {');
console.log('        "crons": [{');
console.log('          "path": "/api/emails/cleanup-cache",');
console.log('          "schedule": "0 2 * * *"');
console.log('        }]');
console.log('      }');
console.log('      ```');
console.log();

console.log('   C. External Cron Service');
console.log('      Use services like:');
console.log('      • cron-job.org (free)');
console.log('      • EasyCron');
console.log('      • Zapier');
console.log('      Point them to: YOUR_DOMAIN/api/emails/cleanup-cache');
console.log();

console.log('📊 CLEANUP BENEFITS:');
console.log('• Removes expired cache entries (>48 hours old)');
console.log('• Cleans up rarely accessed content (>7 days, <3 accesses)');
console.log('• Maintains optimal database performance');
console.log('• Prevents storage bloat');
console.log();

console.log('🎯 RECOMMENDED SETUP:');
console.log('1. Set CACHE_CLEANUP_TOKEN in your environment');
console.log('2. Use GitHub Actions for free automated cleanup');
console.log('3. Monitor cleanup logs in your application');
console.log();

// Check if environment file exists and suggest adding the token
const envFile = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  if (!envContent.includes('CACHE_CLEANUP_TOKEN')) {
    console.log('💡 QUICK SETUP:');
    console.log('Add this line to your .env.local file:');
    console.log('CACHE_CLEANUP_TOKEN=' + generateSecureToken());
    console.log();
  } else {
    console.log('✅ CACHE_CLEANUP_TOKEN already configured in .env.local');
    console.log();
  }
} else {
  console.log('⚠️  .env.local not found. Make sure to set CACHE_CLEANUP_TOKEN in your environment.');
  console.log();
}

console.log('🚀 Your optimized email system is ready!');
console.log('The cache cleanup will help maintain peak performance.');

function generateSecureToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// If run directly, offer to create GitHub Actions workflow
if (require.main === module) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  console.log();
  rl.question('Would you like to create a GitHub Actions workflow file? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      createGitHubWorkflow();
    } else {
      console.log('✅ Setup complete! Use the manual options above to configure cleanup.');
    }
    rl.close();
  });
}

function createGitHubWorkflow() {
  const workflowDir = path.join(__dirname, '..', '.github', 'workflows');
  const workflowFile = path.join(workflowDir, 'email-cache-cleanup.yml');

  // Create directory if it doesn't exist
  if (!fs.existsSync(workflowDir)) {
    fs.mkdirSync(workflowDir, { recursive: true });
  }

  const workflowContent = `name: Email Cache Cleanup

on:
  schedule:
    - cron: "0 2 * * *"  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual triggering

jobs:
  cleanup:
    runs-on: ubuntu-latest
    steps:
      - name: Cleanup Email Cache
        run: |
          curl -X POST \${{ secrets.APP_URL }}/api/emails/cleanup-cache \\
            -H "Authorization: Bearer \${{ secrets.CACHE_CLEANUP_TOKEN }}" \\
            -H "Content-Type: application/json" \\
            --fail-with-body
        env:
          APP_URL: \${{ secrets.APP_URL }}
          CACHE_CLEANUP_TOKEN: \${{ secrets.CACHE_CLEANUP_TOKEN }}
`;

  fs.writeFileSync(workflowFile, workflowContent);
  
  console.log('✅ Created GitHub Actions workflow at .github/workflows/email-cache-cleanup.yml');
  console.log();
  console.log('🔧 Next steps:');
  console.log('1. Add these secrets to your GitHub repository:');
  console.log('   • APP_URL: Your application URL (e.g., https://yourapp.com)');
  console.log('   • CACHE_CLEANUP_TOKEN: Your secure token');
  console.log('2. Commit and push the workflow file');
  console.log('3. The cleanup will run automatically every day at 2 AM UTC');
  console.log();
  console.log('🎉 Automated email cache cleanup is now configured!');
}

module.exports = { generateSecureToken, createGitHubWorkflow };
