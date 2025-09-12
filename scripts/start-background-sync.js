#!/usr/bin/env node
/**
 * Start background sync service for Zarfin only
 * This will continuously sync emails in the background
 */

console.log('🚀 Starting background email sync for Zarfin...\n');
console.log('This will sync emails every 2 minutes.');
console.log('Press Ctrl+C to stop.\n');

// Load the existing background sync service
const backgroundSyncService = require('../lib/background-sync-service.js');

// Start the service
backgroundSyncService.start();

console.log('✅ Background sync is now running!');
console.log('📧 Zarfin\'s emails will sync automatically every 2 minutes.\n');

// Keep the script running
process.on('SIGINT', () => {
  console.log('\n👋 Stopping background sync...');
  backgroundSyncService.stop();
  process.exit(0);
});