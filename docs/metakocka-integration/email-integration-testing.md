# Metakocka Email Integration Testing

## Overview
This document outlines the process for testing the Metakocka email integration, which connects email functionality with Metakocka ERP data.

## Test Components
The Metakocka email integration test script (`test-email-metakocka-full-flow.js`) verifies:

1. **Email Metadata Enrichment**: Processing emails to extract and store Metakocka-related metadata
2. **Bidirectional References**: Establishing connections between emails and Metakocka entities
3. **AI Context Building**: Generating comprehensive context for AI processing using Metakocka data
4. **Email Templates**: Creating and applying templates with Metakocka placeholders
5. **AI Response Generation**: Generating AI-powered email responses with Metakocka context

## Environment Setup
To run this test script, the following environment variables are required:

- `AUTH_TOKEN`: Valid authentication token for API requests
- `EMAIL_ID`: ID of an existing email in the database
- `USER_ID`: User ID for multi-tenant isolation
- `SERVICE_TOKEN`: Token for service-level operations
- `API_BASE_URL`: Base URL for API requests (defaults to http://localhost:3000/api)

## Prerequisites
Before running the tests:

1. **Local Development Server**:
   - The application server must be running locally
   - Run with `npm run dev` or equivalent command
   - Ensure the server is accessible at the configured API_BASE_URL

2. **Test Data**:
   - The email specified by EMAIL_ID must exist in the database
   - The email should have connections to Metakocka entities
   - Metakocka credentials must be configured for the test user

## Execution
Execute the test script using the provided shell runner:
```bash
cd tests/metakocka
./run-metakocka-email-test.sh
```

Or run directly with environment variables:
```bash
AUTH_TOKEN=your_token EMAIL_ID=your_email_id USER_ID=your_user_id SERVICE_TOKEN=your_service_token node test-email-metakocka-full-flow.js
```

## Interpreting Results
The test script provides detailed output for each test case:
- ✅ Success: Test passed successfully
- ⚠️ Warning: Test failed but execution continues
- ❌ Error: Critical failure in test execution

A summary is provided at the end showing passed, failed, and skipped tests.

## Troubleshooting
Common issues:
1. **Server not running**: Ensure the local development server is running
2. **Invalid credentials**: Verify AUTH_TOKEN and SERVICE_TOKEN are valid
3. **Missing data**: Confirm EMAIL_ID points to an existing email with Metakocka connections
4. **API changes**: Check if API endpoints have changed and update the test script accordingly
