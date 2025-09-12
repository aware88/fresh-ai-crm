#!/usr/bin/env node

async function simpleSyncTest() {
  console.log('🔄 Simple email sync test...');
  
  try {
    console.log('Making request to sync endpoint...');
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch('http://localhost:3002/api/emails/graph/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync'
      },
      body: JSON.stringify({
        accountId: '0d91ab34-e7b8-4d09-9351-7f22fca4a975',
        folder: 'inbox',
        maxEmails: 2, // Very small number
        internalCall: true
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200) {
      const result = await response.json();
      console.log('✅ Sync successful!');
      console.log(`   - Total saved: ${result.totalSaved || 0}`);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Sync failed:', error);
      return false;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Test timed out after 10 seconds');
    } else {
      console.log('❌ Test failed:', error.message);
    }
    return false;
  }
}

simpleSyncTest().then(success => {
  process.exit(success ? 0 : 1);
});