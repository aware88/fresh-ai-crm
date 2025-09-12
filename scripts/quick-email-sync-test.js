#!/usr/bin/env node

require('dotenv').config({ path: '.env.local' });

async function quickTest() {
  console.log('🔄 Quick email sync test...');
  
  try {
    const response = await fetch('http://localhost:3002/api/emails/graph/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync'
      },
      body: JSON.stringify({
        accountId: '0d91ab34-e7b8-4d09-9351-7f22fca4a975',
        folder: 'inbox',
        maxEmails: 5,
        internalCall: true
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Sync failed:', result.error);
    } else {
      console.log('✅ Sync successful!');
      console.log(`   - Status: ${response.status}`);
      console.log(`   - Total saved: ${result.totalSaved}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();