/**
 * Test script for the complete Metakocka email integration flow
 * 
 * This script tests:
 * 1. Email metadata enrichment with Metakocka data
 * 2. AI context building for emails
 * 3. Email templates with Metakocka placeholders
 * 4. AI-powered email response generation
 * 
 * Before running:
 * - Update AUTH_TOKEN with a valid authentication token
 * - Update EMAIL_ID with an actual email ID from the database
 * - Update SERVICE_TOKEN for service-level operations
 */

// Configuration - Replace these values with your actual data
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'YOUR_AUTH_TOKEN';
const EMAIL_ID = process.env.EMAIL_ID || 'YOUR_EMAIL_ID';
const USER_ID = process.env.USER_ID || 'YOUR_USER_ID';
const SERVICE_TOKEN = process.env.SERVICE_TOKEN || 'YOUR_SERVICE_TOKEN';
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000/api';

// Validate required configuration
if (AUTH_TOKEN === 'YOUR_AUTH_TOKEN' || EMAIL_ID === 'YOUR_EMAIL_ID' || USER_ID === 'YOUR_USER_ID') {
  console.error('❌ Error: You must provide AUTH_TOKEN, EMAIL_ID, and USER_ID values');
  console.error('Run the script with environment variables:');
  console.error('AUTH_TOKEN=your_token EMAIL_ID=your_email_id USER_ID=your_user_id node test-email-metakocka-full-flow.js');
  process.exit(1);
}

// Helper function to make API calls
async function callApi(endpoint, method = 'GET', body = null, useServiceToken = false) {
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (useServiceToken) {
    headers['X-Service-Token'] = SERVICE_TOKEN;
  } else {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    console.log(`\n🔄 Calling ${method} ${endpoint}...`);
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    const data = await response.json();
    
    if (!response.ok) {
      console.error(`❌ Error: ${response.status} ${response.statusText}`);
      console.error(data);
      return { success: false, error: data };
    }
    
    console.log(`✅ Success: ${response.status} ${response.statusText}`);
    console.log(JSON.stringify(data, null, 2));
    return { success: true, data };
  } catch (error) {
    console.error(`❌ Request failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Test 1: Process an email for Metakocka metadata
async function testProcessEmail() {
  console.log('\n==== TEST 1: Process Email for Metakocka Metadata ====');
  return await callApi('/emails/metakocka', 'POST', { emailId: EMAIL_ID });
}

// Test 2: Get email Metakocka metadata
async function testGetEmailMetadata() {
  console.log('\n==== TEST 2: Get Email Metakocka Metadata ====');
  return await callApi(`/emails/metakocka?emailId=${EMAIL_ID}`, 'GET');
}

// Test 3: Get AI context for an email
async function testGetEmailAIContext() {
  console.log('\n==== TEST 3: Get Email AI Context ====');
  return await callApi(`/emails/ai-context?emailId=${EMAIL_ID}`, 'GET');
}

// Test 4: Create an email template with Metakocka placeholders
async function testCreateEmailTemplate() {
  console.log('\n==== TEST 4: Create Email Template with Metakocka Placeholders ====');
  
  const templateData = {
    name: 'Invoice Follow-up Template',
    subject: 'Follow-up on Invoice {{metakocka.metakockaDocuments[0].number}}',
    body: `Dear {{metakocka.metakockaContacts[0].name}},

I hope this email finds you well. I'm writing to follow up on invoice {{metakocka.metakockaDocuments[0].number}} dated {{metakocka.metakockaDocuments[0].date}}, which is currently {{metakocka.metakockaDocuments[0].status}}.

The total amount due is {{metakocka.metakockaDocuments[0].amount}}.

Please let me know if you have any questions or if you need any additional information.

Best regards,
{{metakocka.companyContext.name}}`
  };
  
  return await callApi('/emails/templates', 'POST', templateData);
}

// Test 5: Get all email templates
async function testGetEmailTemplates() {
  console.log('\n==== TEST 5: Get All Email Templates ====');
  return await callApi('/emails/templates', 'GET');
}

// Test 6: Apply template with Metakocka context
async function testApplyTemplate(templateId) {
  console.log('\n==== TEST 6: Apply Template with Metakocka Context ====');
  
  return await callApi('/emails/templates', 'POST', {
    apply: true,
    templateId,
    emailId: EMAIL_ID
  });
}

// Test 7: Generate AI response for an email
async function testGenerateAIResponse() {
  console.log('\n==== TEST 7: Generate AI Response for Email ====');
  
  try {
    // First, get the email subject to create a more specific prompt
    const emailResult = await callApi(`/emails/metakocka?emailId=${EMAIL_ID}`, 'GET');
    if (!emailResult.success) {
      console.error('❌ Could not fetch email details for AI prompt');
      return await callApi('/emails/ai-context', 'POST', {
        emailId: EMAIL_ID,
        prompt: 'Write a professional response to this email'
      });
    }
    
    const emailSubject = emailResult.data?.data?.subject || '';
    const isInvoiceRelated = emailSubject.toLowerCase().includes('invoice') || 
                            emailSubject.toLowerCase().includes('payment') ||
                            emailSubject.toLowerCase().includes('bill');
    
    // Create a more specific prompt based on email content
    const prompt = isInvoiceRelated
      ? 'Write a professional response addressing any payment or invoice questions in this email. Include relevant Metakocka data if available.'
      : 'Write a professional response to this email that incorporates any relevant Metakocka data available in the context.';
    
    console.log(`📝 Using AI prompt: "${prompt}"`);
    
    return await callApi('/emails/ai-context', 'POST', {
      emailId: EMAIL_ID,
      prompt
    });
  } catch (error) {
    console.error(`❌ Error in AI response generation: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Run all tests in sequence
async function runAllTests() {
  console.log('🚀 Starting Metakocka Email Integration Full Flow Tests...');
  
  const results = {
    total: 7,
    passed: 0,
    failed: 0,
    skipped: 0,
    details: {}
  };
  
  try {
    // Test 1: Process an email
    console.log('\n🔄 Running Test 1: Process Email for Metakocka Metadata');
    const test1Result = await testProcessEmail();
    if (test1Result.success) {
      console.log('✅ Test 1 passed');
      results.passed++;
      results.details['Test 1'] = { status: 'passed' };
    } else {
      console.log('⚠️ Test 1 failed, but continuing with other tests...');
      results.failed++;
      results.details['Test 1'] = { status: 'failed', error: test1Result.error };
    }
    
    // Test 2: Get email metadata
    console.log('\n🔄 Running Test 2: Get Email Metakocka Metadata');
    const test2Result = await testGetEmailMetadata();
    if (test2Result.success) {
      console.log('✅ Test 2 passed');
      results.passed++;
      results.details['Test 2'] = { status: 'passed' };
      
      // Check if we have any contact or document mappings
      const contactMappings = test2Result.data?.data?.email_metakocka_contact_mappings || [];
      const documentMappings = test2Result.data?.data?.email_metakocka_document_mappings || [];
      
      if (contactMappings.length === 0 && documentMappings.length === 0) {
        console.log('⚠️ Warning: No Metakocka mappings found for this email');
        results.details['Test 2'].warning = 'No Metakocka mappings found';
      }
    } else {
      console.log('⚠️ Test 2 failed, but continuing with other tests...');
      results.failed++;
      results.details['Test 2'] = { status: 'failed', error: test2Result.error };
    }
    
    // Test 3: Get AI context
    console.log('\n🔄 Running Test 3: Get Email AI Context');
    const test3Result = await testGetEmailAIContext();
    if (test3Result.success) {
      console.log('✅ Test 3 passed');
      results.passed++;
      results.details['Test 3'] = { status: 'passed' };
      
      // Check if AI context contains Metakocka data
      const aiContext = test3Result.data?.data?.aiContext || '';
      if (!aiContext.includes('Related Contacts') && !aiContext.includes('Related Documents')) {
        console.log('⚠️ Warning: AI context does not contain Metakocka data');
        results.details['Test 3'].warning = 'AI context missing Metakocka data';
      }
    } else {
      console.log('⚠️ Test 3 failed, but continuing with other tests...');
      results.failed++;
      results.details['Test 3'] = { status: 'failed', error: test3Result.error };
    }
    
    // Test 4: Create email template
    console.log('\n🔄 Running Test 4: Create Email Template with Metakocka Placeholders');
    const test4Result = await testCreateEmailTemplate();
    if (test4Result.success) {
      console.log('✅ Test 4 passed');
      results.passed++;
      results.details['Test 4'] = { status: 'passed' };
    } else {
      console.log('⚠️ Test 4 failed, but continuing with other tests...');
      results.failed++;
      results.details['Test 4'] = { status: 'failed', error: test4Result.error };
    }
    
    let templateId = test4Result.success ? test4Result.data.data.id : null;
    
    // Test 5: Get email templates
    console.log('\n🔄 Running Test 5: Get All Email Templates');
    const test5Result = await testGetEmailTemplates();
    if (test5Result.success) {
      console.log('✅ Test 5 passed');
      results.passed++;
      results.details['Test 5'] = { status: 'passed' };
      
      if (!templateId && test5Result.data.data.length > 0) {
        // If we couldn't create a template but there are existing ones, use the first one
        templateId = test5Result.data.data[0].id;
        console.log(`📝 Using existing template ID: ${templateId}`);
      }
    } else {
      console.log('⚠️ Test 5 failed, but continuing with other tests...');
      results.failed++;
      results.details['Test 5'] = { status: 'failed', error: test5Result.error };
    }
    
    // Test 6: Apply template (only if we have a template ID)
    console.log('\n🔄 Running Test 6: Apply Template with Metakocka Context');
    if (templateId) {
      const test6Result = await testApplyTemplate(templateId);
      if (test6Result.success) {
        console.log('✅ Test 6 passed');
        results.passed++;
        results.details['Test 6'] = { status: 'passed' };
      } else {
        console.log('⚠️ Test 6 failed, but continuing with other tests...');
        results.failed++;
        results.details['Test 6'] = { status: 'failed', error: test6Result.error };
      }
    } else {
      console.log('⚠️ Skipping Test 6 because no template ID is available');
      results.skipped++;
      results.details['Test 6'] = { status: 'skipped', reason: 'No template ID available' };
    }
    
    // Test 7: Generate AI response
    console.log('\n🔄 Running Test 7: Generate AI Response for Email');
    const test7Result = await testGenerateAIResponse();
    if (test7Result.success) {
      console.log('✅ Test 7 passed');
      results.passed++;
      results.details['Test 7'] = { status: 'passed' };
    } else {
      console.log('⚠️ Test 7 failed');
      results.failed++;
      results.details['Test 7'] = { status: 'failed', error: test7Result.error };
    }
    
    // Print summary
    console.log('\n📊 Test Summary:');
    console.log(`Total tests: ${results.total}`);
    console.log(`Passed: ${results.passed}`);
    console.log(`Failed: ${results.failed}`);
    console.log(`Skipped: ${results.skipped}`);
    
    if (results.failed > 0) {
      console.log('\n❌ Some tests failed. Please check the details above.');
    } else if (results.skipped > 0) {
      console.log('\n⚠️ All executed tests passed, but some tests were skipped.');
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  } catch (error) {
    console.error(`\n❌ Test suite failed: ${error.message}`);
    console.error(error.stack);
  }
  
  return results;
}

// Run the tests
runAllTests();

/**
 * Manual test commands (for reference):
 * 
 * 1. Process an email:
 * curl -X POST http://localhost:3000/api/emails/metakocka \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"emailId": "YOUR_EMAIL_ID"}'
 * 
 * 2. Get email metadata:
 * curl -X GET "http://localhost:3000/api/emails/metakocka?emailId=YOUR_EMAIL_ID" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 3. Get AI context:
 * curl -X GET "http://localhost:3000/api/emails/ai-context?emailId=YOUR_EMAIL_ID" \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 4. Create email template:
 * curl -X POST http://localhost:3000/api/emails/templates \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "name": "Invoice Follow-up Template",
 *     "subject": "Follow-up on Invoice {{metakocka.metakockaDocuments[0].number}}",
 *     "body": "Dear {{metakocka.metakockaContacts[0].name}},\n\nI hope this email finds you well..."
 *   }'
 * 
 * 5. Get email templates:
 * curl -X GET http://localhost:3000/api/emails/templates \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN"
 * 
 * 6. Apply template:
 * curl -X POST http://localhost:3000/api/emails/templates \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "apply": true,
 *     "templateId": "YOUR_TEMPLATE_ID",
 *     "emailId": "YOUR_EMAIL_ID"
 *   }'
 * 
 * 7. Generate AI response:
 * curl -X POST http://localhost:3000/api/emails/ai-context \
 *   -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{
 *     "emailId": "YOUR_EMAIL_ID",
 *     "prompt": "Write a professional response to this email..."
 *   }'
 */
