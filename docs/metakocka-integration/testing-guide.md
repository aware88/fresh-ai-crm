# Metakocka Integration Testing Guide

This document provides comprehensive instructions for testing all aspects of the Metakocka integration with the Fresh AI CRM system.

## Overview

Testing the Metakocka integration involves verifying the functionality of multiple components:

1. **Contact Integration**: Bidirectional contact synchronization
2. **Sales Document Integration**: Document creation and synchronization
3. **Product Integration**: Product catalog synchronization
4. **Email Integration**: Email enrichment with Metakocka data
5. **AI Context Building**: Context generation for AI processing
6. **Email Templates**: Template processing with Metakocka placeholders

## Prerequisites

Before running any tests, ensure you have the following:

1. **Authentication Credentials**:
   - Valid CRM authentication token
   - Metakocka API credentials configured in the system
   - Service token for background processes

2. **Test Environment**:
   - Development or staging environment
   - Test data in both CRM and Metakocka systems
   - Node.js installed for running test scripts

3. **Configuration Files**:
   - `.env` file with required environment variables
   - Test scripts from the repository

## Test Scripts

The following test scripts are available for testing the Metakocka integration:

1. `test-email-metakocka-full-flow.js`: Tests the complete email integration flow
2. `test-contact-sync.js`: Tests contact synchronization
3. `test-sales-document-sync.js`: Tests sales document synchronization
4. `test-product-sync.js`: Tests product synchronization

## Email Integration Testing

### Setup

1. Create a `.env` file based on the provided `sample.env`:

```
# Authentication token for API requests
AUTH_TOKEN=your_auth_token_here

# Email ID to use for testing
EMAIL_ID=your_email_id_here

# User ID for multi-tenant isolation
USER_ID=your_user_id_here

# Service token for service-level operations
SERVICE_TOKEN=your_service_token_here
```

2. Make the test runner script executable:

```bash
chmod +x run-metakocka-email-test.sh
```

### Running the Test

Execute the test script:

```bash
./run-metakocka-email-test.sh
```

### What's Being Tested

The email integration test verifies:

1. **Email Processing**: Processing an email for Metakocka metadata
2. **Email Metadata Retrieval**: Getting Metakocka metadata for an email
3. **AI Context Building**: Generating AI context with Metakocka data
4. **Email Template Creation**: Creating an email template with Metakocka placeholders
5. **Email Template Retrieval**: Getting email templates
6. **Template Application**: Applying a template with Metakocka data
7. **AI Response Generation**: Generating an AI response using Metakocka context

### Expected Results

The test script will output a detailed summary of the test results, including:

- Total number of tests run
- Number of passed, failed, and skipped tests
- Detailed information for each test
- Any warnings or errors encountered

A successful test will show all tests passing, with possible warnings about missing data.

## Contact Integration Testing

### Setup

1. Create a `.env` file with the required environment variables:

```
# Authentication token for API requests
AUTH_TOKEN=your_auth_token_here

# Contact ID to use for testing
CONTACT_ID=your_contact_id_here

# Optional Metakocka ID for reverse sync testing
METAKOCKA_ID=metakocka_contact_id_here
```

### Running the Test

Execute the test script:

```bash
node test-contact-sync.js
```

### What's Being Tested

The contact integration test verifies:

1. **Single Contact Sync**: Syncing a contact from CRM to Metakocka
2. **Bulk Contact Sync**: Syncing multiple contacts from CRM to Metakocka
3. **Contact Mapping Retrieval**: Getting contact mapping information
4. **Single Contact Import**: Importing a contact from Metakocka to CRM
5. **Bulk Contact Import**: Importing multiple contacts from Metakocka to CRM

### Expected Results

The test script will output a detailed summary of the test results, including:

- Results of each sync operation
- Mapping information
- Any errors encountered during the process

## Sales Document Integration Testing

### Setup

1. Copy the sample environment file to create a `.env` file:

```bash
cp sales-document-sync-test.env.sample .env
```

2. Update the environment variables in the `.env` file:

```
# Authentication token for API requests
AUTH_TOKEN=your_auth_token_here

# Document ID to use for testing
DOCUMENT_ID=your_document_id_here

# Optional Metakocka ID for reverse sync testing
METAKOCKA_ID=metakocka_document_id_here
```

3. Make the test runner script executable:

```bash
chmod +x run-sales-document-sync-test.sh
```

### Running the Test

Execute the test script using the shell runner:

```bash
./run-sales-document-sync-test.sh
```

Alternatively, you can run the Node.js script directly:

```bash
node test-sales-document-sync.js
```

### What's Being Tested

The sales document integration test verifies:

1. **Single Document Sync**: Syncing a document from CRM to Metakocka
2. **Bulk Document Sync**: Syncing multiple documents from CRM to Metakocka
3. **Document Mapping Retrieval**: Getting document mapping information
4. **Single Document Import**: Importing a document from Metakocka to CRM
5. **Error Handling**: Proper handling of errors during sync

### Expected Results

The test script will output a detailed summary of the test results, including:

- Results of each sync operation
- Mapping information
- Any errors encountered during the process

## Product Integration Testing

### Setup

1. Create a `.env` file with the required environment variables:

```
# Authentication token for API requests
AUTH_TOKEN=your_auth_token_here

# Product ID to use for testing
PRODUCT_ID=your_product_id_here

# Optional Metakocka ID for reverse sync testing
METAKOCKA_ID=metakocka_product_id_here
```

### Running the Test

Execute the test script:

```bash
node test-product-sync.js
```

### What's Being Tested

The product integration test verifies:

1. **Single Product Sync**: Syncing a product from CRM to Metakocka
2. **Bulk Product Sync**: Syncing multiple products from CRM to Metakocka
3. **Product Mapping Retrieval**: Getting product mapping information
4. **Single Product Import**: Importing a product from Metakocka to CRM
5. **Inventory Sync**: Synchronizing inventory levels

### Expected Results

The test script will output a detailed summary of the test results, including:

- Results of each sync operation
- Mapping information
- Inventory levels
- Any errors encountered during the process

## Manual Testing

In addition to the automated test scripts, manual testing should be performed to verify the integration in the user interface:

### Contact Integration

1. Navigate to a contact detail page
2. Click the "Sync to Metakocka" button
3. Verify that the contact is synced successfully
4. Check the mapping information is displayed correctly

### Sales Document Integration

1. Navigate to a sales document detail page
2. Click the "Sync to Metakocka" button
3. Verify that the document is synced successfully
4. Check the mapping information is displayed correctly

### Email Integration

1. Navigate to an email detail page
2. Verify that Metakocka-related information is displayed
3. Try applying an email template with Metakocka placeholders
4. Generate an AI response and verify it includes relevant Metakocka context

## Troubleshooting

If tests fail, check the following:

1. **Authentication Issues**:
   - Verify that the AUTH_TOKEN is valid
   - Check that Metakocka credentials are correctly configured
   - Ensure the SERVICE_TOKEN is valid for service operations

2. **Data Issues**:
   - Confirm that the test data exists in both systems
   - Check for data format issues (e.g., missing required fields)
   - Verify that mappings exist for bidirectional operations

3. **API Issues**:
   - Check for Metakocka API rate limiting
   - Verify network connectivity to Metakocka API
   - Check for API version compatibility

4. **Error Logs**:
   - Review the error logs for detailed error information
   - Check the error-logger output for context-specific errors
   - Verify that retry mechanisms are working correctly

## Continuous Integration

For automated testing in CI/CD pipelines:

1. Set up environment variables in the CI environment
2. Run the test scripts as part of the CI pipeline
3. Fail the build if tests do not pass
4. Archive test results for future reference

## Test Data Management

To maintain a clean test environment:

1. Create dedicated test contacts, documents, and products
2. Clean up test data after testing is complete
3. Use unique identifiers for test data to avoid conflicts
4. Document the test data setup for future reference
