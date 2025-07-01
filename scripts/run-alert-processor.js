#!/usr/bin/env node

require('dotenv').config();
const { processAlerts } = require('../src/workers/alert-processor');

// Set up error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Run the alert processor
async function main() {
  console.log('Starting alert processor...');
  
  try {
    await processAlerts();
    console.log('Alert processor completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Alert processor failed:', error);
    process.exit(1);
  }
}

main();
