/**
 * Validation script for ContactSyncFromMetakockaService
 * 
 * This script validates the structure and methods of the ContactSyncFromMetakockaService
 * class without making actual API calls.
 */

const fs = require('fs');
const path = require('path');

// Read the file content directly
const filePath = path.join(__dirname, '../../src/lib/integrations/metakocka/contact-sync-from-metakocka.ts');
let fileContent = '';

try {
  fileContent = fs.readFileSync(filePath, 'utf8');
  console.log('✅ Successfully read the file');
} catch (error) {
  console.error(`❌ Error reading file: ${error.message}`);
  process.exit(1);
}

// Validate class structure
function validateClassStructure() {
  console.log('\n===== VALIDATING CLASS STRUCTURE =====');
  
  // Check if the class exists
  if (!fileContent.includes('export class ContactSyncFromMetakockaService')) {
    console.error('❌ ContactSyncFromMetakockaService class not found');
    return false;
  }
  
  console.log('✅ ContactSyncFromMetakockaService class exists');
  
  // Check if the methods exist
  const methods = [
    'syncContactFromMetakocka',
    'getUnsynedPartnersFromMetakocka',
    'syncContactsFromMetakocka'
  ];
  
  let allMethodsExist = true;
  
  methods.forEach(method => {
    if (!fileContent.includes(`static async ${method}`)) {
      console.error(`❌ Method ${method} not found`);
      allMethodsExist = false;
    } else {
      console.log(`✅ Method ${method} exists`);
    }
  });
  
  return allMethodsExist;
}

// Validate retry logic implementation
function validateRetryLogic() {
  console.log('\n===== VALIDATING RETRY LOGIC =====');
  
  // Extract the syncContactFromMetakocka method content
  const methodMatch = fileContent.match(/static async syncContactFromMetakocka[\s\S]*?\{([\s\S]*?)\n  \}/m);
  const syncMethodContent = methodMatch ? methodMatch[1] : '';
  
  // Check if the syncContactFromMetakocka method uses MetakockaRetryHandler
  if (syncMethodContent.includes('MetakockaRetryHandler.executeWithRetry')) {
    console.log('✅ syncContactFromMetakocka uses MetakockaRetryHandler.executeWithRetry');
  } else {
    console.error('❌ syncContactFromMetakocka does not use MetakockaRetryHandler.executeWithRetry');
    return false;
  }
  
  // Check if the method accepts a retryConfig parameter
  if (fileContent.includes('retryConfig: RetryConfig = DEFAULT_RETRY_CONFIG') || 
      fileContent.includes('retryConfig = DEFAULT_RETRY_CONFIG')) {
    console.log('✅ syncContactFromMetakocka accepts a retryConfig parameter with default value');
  } else {
    console.error('❌ syncContactFromMetakocka does not properly handle retryConfig parameter');
    return false;
  }
  
  return true;
}

// Validate parameter handling
function validateParameterHandling() {
  console.log('\n===== VALIDATING PARAMETER HANDLING =====');
  
  // Check if getPartner is called with isCode parameter
  if (fileContent.includes('client.getPartner(metakockaId, false)')) {
    console.log('✅ getPartner is called with isCode parameter set to false');
  } else {
    console.error('❌ getPartner is not called with isCode parameter');
    return false;
  }
  
  return true;
}

// Validate error handling
function validateErrorHandling() {
  console.log('\n===== VALIDATING ERROR HANDLING =====');
  
  // Extract the syncContactsFromMetakocka method content
  const methodMatch = fileContent.match(/static async syncContactsFromMetakocka[\s\S]*?\{([\s\S]*?)\n\s*\}/m);
  const syncMethodsContent = methodMatch ? methodMatch[1] : '';
  
  // Check if error logging is used
  if (fileContent.includes('ErrorLogger.logError')) {
    console.log('✅ Error logging is implemented');
  } else {
    console.error('❌ Error logging is not implemented');
    return false;
  }
  
  // Check if errors are caught and handled
  if (fileContent.includes('try {') && fileContent.includes('catch (error)')) {
    console.log('✅ Try-catch error handling is implemented');
  } else {
    console.error('❌ Try-catch error handling is not implemented');
    return false;
  }
  
  return true;
}

// Run all validations
function runValidations() {
  console.log('Starting ContactSyncFromMetakockaService validation...');
  
  const structureValid = validateClassStructure();
  const retryLogicValid = validateRetryLogic();
  const parameterHandlingValid = validateParameterHandling();
  const errorHandlingValid = validateErrorHandling();
  
  console.log('\n===== VALIDATION SUMMARY =====');
  console.log(`Class Structure: ${structureValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Retry Logic: ${retryLogicValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Parameter Handling: ${parameterHandlingValid ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Error Handling: ${errorHandlingValid ? '✅ PASS' : '❌ FAIL'}`);
  
  const allValid = structureValid && retryLogicValid && parameterHandlingValid && errorHandlingValid;
  
  console.log(`\nOverall Validation: ${allValid ? '✅ PASS' : '❌ FAIL'}`);
  
  return allValid;
}

// Run the validations
runValidations();
