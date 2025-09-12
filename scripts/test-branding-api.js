#!/usr/bin/env node

/**
 * Test Branding API Endpoint
 */

async function testBrandingAPI() {
  console.log('🔧 Testing branding API endpoint...\n');

  try {
    const organizationId = '577485fb-50b4-4bb2-a4c6-54b97e1545ad';
    const url = `http://localhost:3000/api/organizations/${organizationId}/branding`;
    
    console.log('🌐 Making request to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Note: This will fail without proper session cookies in a real scenario
        // But it should show us the endpoint behavior
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('🔒 Unauthorized (expected - no session)');
      return;
    }
    
    const data = await response.json();
    console.log('📦 Response data:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.branding) {
      console.log('\n🎨 Branding colors found:');
      console.log(`Primary: ${data.branding.primary_color}`);
      console.log(`Secondary: ${data.branding.secondary_color}`);
      console.log(`Accent: ${data.branding.accent_color}`);
    } else {
      console.log('\n❌ No branding data in response');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

testBrandingAPI();