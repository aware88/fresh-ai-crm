/**
 * Server Initialization
 * 
 * This file runs when the Next.js server starts and initializes
 * background services like email synchronization.
 */

let isInitialized = false;

async function initializeServer() {
  if (isInitialized) {
    console.log('🔄 Server already initialized, skipping...');
    return;
  }

  try {
    console.log('🚀 Initializing server services...');
    
    // Initialize background sync service
    const backgroundSyncService = require('./background-sync-service');
    
    console.log('✅ Server initialization complete');
    isInitialized = true;
    
  } catch (error) {
    console.error('❌ Server initialization failed:', error);
  }
}

// Auto-initialize when module is loaded (server-side only)
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'test') {
  initializeServer();
}

module.exports = { initializeServer };