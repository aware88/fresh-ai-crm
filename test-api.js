// Test the learning API endpoints
const fetch = require('node-fetch');

async function testAPI() {
  console.log('🔍 Testing API endpoints...');
  
  // Test patterns endpoint
  try {
    const response = await fetch('http://localhost:3000/api/email/learning/patterns', {
      headers: {
        'Cookie': 'next-auth.session-token=your-session-token' // This won't work but let's see the response
      }
    });
    
    const data = await response.json();
    console.log('📊 Patterns API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Patterns API Error:', error.message);
  }
  
  // Test analytics endpoint  
  try {
    const response = await fetch('http://localhost:3000/api/email/learning/analytics');
    const data = await response.json();
    console.log('📈 Analytics API Response:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Analytics API Error:', error.message);
  }
}

testAPI();


