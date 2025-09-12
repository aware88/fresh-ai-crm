/**
 * Background Email Sync Service
 * 
 * This service runs automatically when the Next.js app starts.
 * It handles background email synchronization without requiring
 * manual intervention or external cron setup.
 * 
 * Features:
 * - Auto-starts with the app
 * - Runs independently of user sessions
 * - Handles all email accounts
 * - Graceful error handling
 * - Memory efficient
 */

const { createClient } = require('@supabase/supabase-js');

class BackgroundSyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.isDevelopment = process.env.NODE_ENV !== 'production';
    
    // Sync every 2 minutes in development, 10 minutes in production
    this.intervalMs = this.isDevelopment ? 2 * 60 * 1000 : 10 * 60 * 1000;
    
    console.log(`🔄 Background Sync Service initialized (${this.isDevelopment ? 'dev' : 'prod'} mode)`);
    console.log(`   Sync interval: ${this.intervalMs / 1000 / 60} minutes`);
  }

  async start() {
    if (this.isRunning) {
      console.log('📧 Background sync service already running');
      return;
    }

    console.log('🚀 Starting background email sync service...');
    this.isRunning = true;

    // Initialize real-time sync for all accounts after a short delay
    setTimeout(() => {
      this.initializeRealTimeSync();
    }, 15000); // 15 seconds delay to let the app fully start

    // Run initial traditional sync after a short delay
    setTimeout(() => {
      this.performSync();
    }, 20000); // 20 seconds delay to let real-time sync start first

    // Set up recurring traditional sync (now as backup to real-time)
    this.syncInterval = setInterval(() => {
      this.performSync();
    }, this.intervalMs);

    console.log('✅ Background sync service started');
  }

  async stop() {
    if (!this.isRunning) return;

    console.log('🛑 Stopping background email sync service...');
    this.isRunning = false;

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }

    console.log('✅ Background sync service stopped');
  }

  async initializeRealTimeSync() {
    if (!this.isRunning) return;

    try {
      console.log(`🔥 [${new Date().toISOString()}] Initializing real-time email sync for all accounts...`);

      // Call the real-time sync initialization endpoint
      const port = process.env.PORT || '3002';
      const baseUrl = this.isDevelopment 
        ? `http://localhost:${port}`
        : (process.env.NEXTAUTH_URL || `http://localhost:${port}`);
      
      const fetch = require('node-fetch');

      const response = await fetch(`${baseUrl}/api/email/initialize-realtime-sync`, {
        method: 'POST',
        headers: {
          'User-Agent': 'BackgroundSyncService/1.0',
          'Content-Type': 'application/json',
          // Add auth header if available
          ...(process.env.CRON_SECRET && {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          })
        },
        timeout: 300000 // 5 minutes timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`🚀 Real-time sync initialized: ${result.message}`);
      } else {
        const errorText = await response.text();
        console.error(`❌ Real-time sync initialization failed: ${response.status} ${response.statusText}`);
        console.error(`   Response: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Real-time sync initialization error:', error.message);
      
      // If it's a connection error, the app might not be fully ready yet
      if (error.code === 'ECONNREFUSED') {
        console.log('   App may still be starting up, real-time sync will be initialized later...');
      }
    }
  }

  async performSync() {
    if (!this.isRunning) return;

    try {
      console.log(`⏰ [${new Date().toISOString()}] Running background email sync (backup to real-time)...`);

      // Call the existing cron endpoint
      // In development, override NEXTAUTH_URL since it may point to wrong port
      const port = process.env.PORT || '3002';
      const baseUrl = this.isDevelopment 
        ? `http://localhost:${port}`
        : (process.env.NEXTAUTH_URL || `http://localhost:${port}`);
      
      const fetch = require('node-fetch');

      const response = await fetch(`${baseUrl}/api/cron/auto-sync-emails`, {
        method: 'GET',
        headers: {
          'User-Agent': 'BackgroundSyncService/1.0',
          // Add auth header if available
          ...(process.env.CRON_SECRET && {
            'Authorization': `Bearer ${process.env.CRON_SECRET}`
          })
        },
        timeout: 300000 // 5 minutes timeout
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Background sync completed: ${result.new_emails_total || 0} new emails`);
        
        if (result.details && result.details.length > 0) {
          result.details.forEach(account => {
            if (account.newEmails > 0) {
              console.log(`   📧 ${account.email}: ${account.newEmails} new emails`);
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Background sync failed: ${response.status} ${response.statusText}`);
        console.error(`   Response: ${errorText}`);
      }

    } catch (error) {
      console.error('❌ Background sync error:', error.message);
      
      // If it's a connection error, the app might not be fully ready yet
      if (error.code === 'ECONNREFUSED') {
        console.log('   App may still be starting up, will retry next interval...');
      }
    }
  }

  // Method to check if service is healthy
  isHealthy() {
    return this.isRunning && this.syncInterval !== null;
  }

  // Get service status
  getStatus() {
    return {
      running: this.isRunning,
      intervalMs: this.intervalMs,
      nextSyncIn: this.syncInterval ? this.intervalMs : null,
      isDevelopment: this.isDevelopment
    };
  }
}

// Create singleton instance
const backgroundSyncService = new BackgroundSyncService();

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('📧 Received SIGTERM, stopping background sync service...');
  backgroundSyncService.stop();
});

process.on('SIGINT', () => {
  console.log('📧 Received SIGINT, stopping background sync service...');
  backgroundSyncService.stop();
});

// Auto-start when module is loaded (but only in server context)
// DISABLED FOR CONTROLLED SYNC - DO NOT AUTO-START
if (false && typeof window === 'undefined') {
  // Small delay to ensure the app is ready
  setTimeout(() => {
    backgroundSyncService.start();
  }, 5000); // 5 second delay
}

module.exports = backgroundSyncService;