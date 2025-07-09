// Script to test API authentication

const fetch = require('node-fetch');

async function testApiAuth() {
  console.log('Testing API Authentication...');
  
  try {
    // Test the auth status endpoint
    console.log('\n1. Testing /api/test-auth endpoint:');
    const authResponse = await fetch('http://localhost:3000/api/test-auth', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const authData = await authResponse.json();
    console.log('Auth Status:', authData);
    
    // Test the suppliers API
    console.log('\n2. Testing /api/suppliers endpoint:');
    const suppliersResponse = await fetch('http://localhost:3000/api/suppliers', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (suppliersResponse.ok) {
      const suppliersData = await suppliersResponse.json();
      console.log('Suppliers API Response:', 
        Array.isArray(suppliersData) 
          ? `Successfully fetched ${suppliersData.length} suppliers` 
          : suppliersData
      );
    } else {
      console.log('Suppliers API Error:', suppliersResponse.status, suppliersResponse.statusText);
      try {
        const errorData = await suppliersResponse.json();
        console.log('Error Details:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
    // Test the emails API
    console.log('\n3. Testing /api/emails endpoint:');
    const emailsResponse = await fetch('http://localhost:3000/api/emails?top=5', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (emailsResponse.ok) {
      const emailsData = await emailsResponse.json();
      console.log('Emails API Response:', 
        emailsData.data && Array.isArray(emailsData.data) 
          ? `Successfully fetched ${emailsData.data.length} emails` 
          : emailsData
      );
    } else {
      console.log('Emails API Error:', emailsResponse.status, emailsResponse.statusText);
      try {
        const errorData = await emailsResponse.json();
        console.log('Error Details:', errorData);
      } catch (e) {
        console.log('Could not parse error response');
      }
    }
    
  } catch (error) {
    console.error('Error running tests:', error);
  }
}

testApiAuth();
