#!/usr/bin/env node

// Direct test of zarfin account sync with minimal complexity
async function testZarfinSync() {
  console.log('🔄 Testing zarfin account sync directly...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch('http://localhost:3002/api/emails/graph/sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-RealTime-Sync' // This bypasses auth
      },
      body: JSON.stringify({
        accountId: '0d91ab34-e7b8-4d09-9351-7f22fca4a975',
        folder: 'inbox',
        maxEmails: 5,
        internalCall: true
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Response status: ${response.status}`);
    
    if (response.status === 200) {
      const result = await response.json();
      console.log('✅ Zarfin sync successful!');
      console.log(`   - Total saved: ${result.totalSaved || 0}`);
      console.log(`   - Any errors: ${result.error || 'none'}`);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ Zarfin sync failed:', error);
      return false;
    }
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.log('❌ Test timed out after 15 seconds');
    } else {
      console.log('❌ Test failed:', error.message);
    }
    return false;
  }
}

testZarfinSync().then(success => {
  console.log(`🏁 Test ${success ? 'PASSED' : 'FAILED'}`);
  process.exit(success ? 0 : 1);
});