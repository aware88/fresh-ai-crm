#!/usr/bin/env node

/**
 * Local Cron Runner for Non-Vercel Environments
 * 
 * This script runs cron jobs locally for development and non-Vercel deployments.
 * It simulates Vercel's cron functionality by calling the endpoints at scheduled intervals.
 * 
 * Usage:
 *   npm run cron        # Run all cron jobs
 *   npm run cron:dev    # Run with development settings
 */

require('dotenv').config();
const cron = require('node-cron');
const fetch = require('node-fetch');

// Auto-detect the correct port
const PORT = process.env.PORT || '3002'; // Default to 3002 since that's what's being used
// Override NEXTAUTH_URL if it's pointing to wrong port in development
const BASE_URL = process.env.NODE_ENV === 'development' 
  ? `http://localhost:${PORT}` 
  : (process.env.NEXTAUTH_URL || `http://localhost:${PORT}`);

// Define cron jobs matching vercel.json
const cronJobs = [
  {
    name: 'Auto Sync Emails',
    schedule: '*/10 * * * *', // Every 10 minutes
    endpoint: '/api/cron/auto-sync-emails',
    enabled: true
  },
  {
    name: 'Weekly AI Learning',
    schedule: '0 2 * * 0', // Sunday at 2 AM
    endpoint: '/api/cron/weekly-ai-learning',
    enabled: true
  },
  {
    name: 'Scan Emails',
    schedule: '0 */2 * * *', // Every 2 hours
    endpoint: '/api/tasks/scan-emails',
    enabled: true
  },
  {
    name: 'Initialize Realtime Sync',
    schedule: '0 */6 * * *', // Every 6 hours
    endpoint: '/api/email/initialize-realtime-sync',
    enabled: false // DISABLED: Causing auth issues
  }
];

// For development, you might want faster intervals
const isDev = process.env.NODE_ENV !== 'production';
if (isDev) {
  // Override for faster testing in development
  cronJobs[0].schedule = '*/2 * * * *'; // Auto-sync every 2 minutes in dev
}

console.log('🚀 Starting Cron Runner');
console.log(`📍 Base URL: ${BASE_URL}`);
console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('');

// Function to call an endpoint
async function callEndpoint(job) {
  const url = `${BASE_URL}${job.endpoint}`;
  console.log(`⏰ [${new Date().toISOString()}] Running: ${job.name}`);
  console.log(`   URL: ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'CronRunner/1.0',
        // Add auth header if CRON_SECRET is set
        ...(process.env.CRON_SECRET && {
          'Authorization': `Bearer ${process.env.CRON_SECRET}`
        })
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log(`   ✅ Success:`, data.message || 'Job completed');
      if (data.new_emails_total) {
        console.log(`   📧 New emails synced: ${data.new_emails_total}`);
      }
    } else {
      console.error(`   ❌ Failed:`, data.error || response.statusText);
    }
  } catch (error) {
    console.error(`   ❌ Error calling endpoint:`, error.message);
  }
  console.log('');
}

// Schedule all enabled jobs
cronJobs.forEach(job => {
  if (!job.enabled) {
    console.log(`⏸️  Skipping disabled job: ${job.name}`);
    return;
  }
  
  console.log(`📅 Scheduling: ${job.name}`);
  console.log(`   Schedule: ${job.schedule}`);
  console.log(`   Endpoint: ${job.endpoint}`);
  
  cron.schedule(job.schedule, () => {
    callEndpoint(job);
  });
});

console.log('\n✅ All cron jobs scheduled. Press Ctrl+C to stop.\n');

// Run auto-sync immediately on startup
const autoSyncJob = cronJobs.find(j => j.name === 'Auto Sync Emails');
if (autoSyncJob && autoSyncJob.enabled) {
  console.log('🔄 Running initial auto-sync...\n');
  callEndpoint(autoSyncJob);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Stopping cron runner...');
  process.exit(0);
});