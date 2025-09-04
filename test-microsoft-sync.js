/**
 * Test script to trigger Microsoft Graph email sync
 */

const fetch = require('node-fetch');

async function testMicrosoftSync() {
  try {
    console.log('🔄 Testing Microsoft Graph email sync...');
    
    const response = await fetch('http://localhost:3000/api/email/trigger-microsoft-sync', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Microsoft sync triggered successfully:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Microsoft sync failed:');
      console.log(JSON.stringify(result, null, 2));
    }

  } catch (error) {
    console.error('❌ Error testing Microsoft sync:', error.message);
  }
}

// Run the test
testMicrosoftSync();