# Metakocka Integration Testing Guide

## Overview

This guide provides detailed instructions for testing the Metakocka integration with the CRM Mind system. The integration includes bidirectional synchronization of products, contacts, and sales documents, as well as AI-enhanced email processing with Metakocka context.

## Prerequisites

Before running the tests, ensure you have:

1. A running instance of the CRM Mind application
2. Valid Metakocka credentials (company ID and secret key)
3. Test data in both systems (products, contacts, sales documents, emails)
4. Node.js installed for running the test scripts

## Test Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/aware88/crm-mind.git
cd crm-mind
npm install
```

### 2. Configure Environment Variables

Each test script requires specific environment variables. Sample `.env` files are provided for each test:

```bash
cd tests/metakocka
cp product-sync-test.env.sample .env
# Edit .env with your credentials and test data IDs
```

### 3. Start the Application Server

```bash
cd /path/to/crm-mind
npm run dev
```

## Test Scripts

### 1. Product Synchronization Testing

**Script**: `test-product-sync.js`  
**Runner**: `run-product-sync-test.sh`

**Required Environment Variables**:
- `AUTH_TOKEN`: Valid authentication token
- `PRODUCT_ID`: ID of an existing product in the CRM
- `METAKOCKA_ID` (optional): ID of a product in Metakocka for reverse sync

**Test Coverage**:
- Single product sync (CRM → Metakocka)
- Bulk product sync (CRM → Metakocka)
- Product mapping status retrieval
- Single product sync (Metakocka → CRM)
- Bulk product sync (Metakocka → CRM)

**Running the Test**:
```bash
./run-product-sync-test.sh
```

### 2. Contact Synchronization Testing

**Script**: `test-contact-sync.js`  
**Runner**: `run-contact-sync-test.sh`

**Required Environment Variables**:
- `AUTH_TOKEN`: Valid authentication token
- `CONTACT_ID`: ID of an existing contact in the CRM
- `METAKOCKA_ID` (optional): ID of a partner in Metakocka for reverse sync

**Test Coverage**:
- Single contact sync (CRM → Metakocka)
- Bulk contact sync (CRM → Metakocka)
- Contact mapping status retrieval
- Single contact sync (Metakocka → CRM)
- Bulk contact sync (Metakocka → CRM)

**Running the Test**:
```bash
./run-contact-sync-test.sh
```

### 3. Sales Document Synchronization Testing

**Script**: `test-sales-document-sync.js`  
**Runner**: `run-sales-document-sync-test.sh`

**Required Environment Variables**:
- `AUTH_TOKEN`: Valid authentication token
- `DOCUMENT_ID`: ID of an existing sales document in the CRM
- `METAKOCKA_ID` (optional): ID of a document in Metakocka for reverse sync

**Test Coverage**:
- Single sales document sync (CRM → Metakocka)
- Bulk sales document sync (CRM → Metakocka)
- Sales document mapping status retrieval
- Single sales document sync (Metakocka → CRM)
- Get unsynced sales documents from Metakocka
- Bulk sales document sync (Metakocka → CRM)

**Running the Test**:
```bash
./run-sales-document-sync-test.sh
```

### 4. Error Management Testing

**Script**: `test-error-log-management.js`  
**Runner**: `run-error-log-test.sh`

**Required Environment Variables**:
- `AUTH_TOKEN`: Valid authentication token

**Test Coverage**:
- Fetch error logs with various filters
- Resolve individual error logs
- Bulk resolve error logs
- Export error logs to CSV
- Get error statistics

**Running the Test**:
```bash
./run-error-log-test.sh
```

### 5. Email/AI Integration Testing

**Script**: `test-email-metakocka-integration.js`  
**Runner**: `run-email-metakocka-test.sh`

**Required Environment Variables**:
- `AUTH_TOKEN`: Valid authentication token
- `EMAIL_ID`: ID of an existing email in the CRM
- `CONTACT_ID`: ID of a contact with Metakocka mapping

**Test Coverage**:
- Email context enrichment with Metakocka data
- AI response generation with Metakocka context
- Template population with Metakocka data
- Full email processing flow with Metakocka integration

**Running the Test**:
```bash
./run-email-metakocka-test.sh
```

## End-to-End Testing

For comprehensive testing of the entire integration, follow these steps:

1. **Setup Test Data**:
   - Create test products, contacts, and sales documents in the CRM
   - Ensure Metakocka credentials are configured

2. **Run Tests in Sequence**:
   ```bash
   cd tests/metakocka
   ./run-product-sync-test.sh
   ./run-contact-sync-test.sh
   ./run-sales-document-sync-test.sh
   ./run-error-log-test.sh
   ./run-email-metakocka-test.sh
   ```

3. **Verify Results**:
   - Check that all tests pass
   - Verify data consistency between CRM and Metakocka
   - Check error logs for any issues

## Manual Testing

In addition to the automated tests, perform these manual tests:

1. **UI Component Testing**:
   - Verify that sync buttons appear correctly on product, contact, and sales document pages
   - Test bulk sync UI functionality
   - Check error log management UI

2. **Email Integration Testing**:
   - Compose an email to a contact with Metakocka mapping
   - Verify that Metakocka data appears in the context panel
   - Test AI response generation with Metakocka context
   - Use email templates with Metakocka placeholders

3. **Error Handling Testing**:
   - Intentionally cause sync errors (e.g., by providing invalid data)
   - Verify that errors are logged correctly
   - Test error resolution workflow

## Troubleshooting

### Common Test Failures

1. **Authentication Errors**:
   - Verify that the AUTH_TOKEN is valid and not expired
   - Check that the user has appropriate permissions

2. **Missing Test Data**:
   - Ensure that the IDs provided in environment variables exist in the database
   - Verify that test data has all required fields

3. **API Endpoint Issues**:
   - Check that the API_BASE_URL is correct
   - Verify that the application server is running

4. **Metakocka API Errors**:
   - Verify Metakocka credentials
   - Check Metakocka API status
   - Review error logs for specific Metakocka error messages

### Debugging Tips

1. Enable verbose logging in the test scripts by setting `DEBUG=true` in the environment
2. Check the application server logs for API errors
3. Use the manual curl commands provided in each test script for direct API testing
4. Review the error logs in the CRM for detailed error information

## Test Result Reporting

After running all tests, compile a test report with the following information:

1. Test execution date and environment details
2. Summary of test results (passed, failed, skipped)
3. Details of any failed tests
4. Error logs and resolution status
5. Recommendations for fixing any issues

This report should be shared with the development team for review and action.
