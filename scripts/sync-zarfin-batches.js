#!/usr/bin/env node
/**
 * Sync Zarfin's emails in smaller batches to avoid timeouts
 * This will sync 500 emails at a time, multiple times
 */

require('dotenv').config({ path: '.env.local' });
const fetch = require('node-fetch');

async function syncBatch(batchNumber, maxEmails = 500) {
  console.log(`\n📦 Syncing batch ${batchNumber} (${maxEmails} emails)...`);
  
  const port = process.env.PORT || '3002';
  const baseUrl = `http://localhost:${port}`;
  
  try {
    const response = await fetch(`${baseUrl}/api/emails/graph/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync'
      },
      body: JSON.stringify({
        accountId: '0d91ab34-e7b8-4d09-9351-7f22fca4a975',
        folder: 'inbox',
        maxEmails: maxEmails,
        internalCall: true,
        delta: false // Full sync each batch
      }),
      timeout: 300000 // 5 minute timeout
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Batch ${batchNumber} complete: ${result.totalFetched || 0} emails fetched, ${result.savedCount || 0} saved`);
      return result.savedCount || 0;
    } else {
      console.error(`❌ Batch ${batchNumber} failed:`, response.status);
      return 0;
    }
  } catch (error) {
    console.error(`❌ Batch ${batchNumber} error:`, error.message);
    return 0;
  }
}

async function syncAllBatches() {
  console.log('🚀 Starting batch sync for Zarfin (10 batches of 500 emails each)...\n');
  
  let totalSaved = 0;
  
  // Sync 10 batches of 500 emails each
  for (let i = 1; i <= 10; i++) {
    const saved = await syncBatch(i, 500);
    totalSaved += saved;
    
    // Wait 2 seconds between batches
    if (i < 10) {
      console.log('⏳ Waiting 2 seconds before next batch...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`🎉 SYNC COMPLETE: ${totalSaved} total emails saved`);
  console.log('='.repeat(50));
}

syncAllBatches().catch(console.error);