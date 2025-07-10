# Metakocka Integration Test Plan

## Sales Document Synchronization Testing

This test plan outlines the comprehensive testing approach for the Metakocka sales document synchronization API routes.

### Prerequisites

1. A running local development environment
2. Valid authentication tokens
3. Test sales documents in the database
4. Test environment variables set up

### Test Environment Setup

1. Copy `sales-document-sync-test.env.sample` to `.env` in the `tests/metakocka` directory
2. Update the following environment variables:
   - `AUTH_TOKEN`: A valid authentication token
   - `USER_ID`: A valid user ID for test mode authentication
   - `DOCUMENT_ID`: An actual sales document ID from the database
   - `API_BASE_URL`: The base URL for the API (default: http://localhost:3001)
   - `METAKOCKA_ID`: (Optional) A Metakocka ID for reverse sync tests

### Test Scenarios

#### 1. CRM → Metakocka Synchronization

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| 1.1 | Sync a single sales document | Document successfully synced, returns Metakocka ID |
| 1.2 | Sync multiple sales documents | Documents successfully synced, returns success counts |
| 1.3 | Sync all sales documents | All documents successfully synced, returns success counts |
| 1.4 | Sync a non-existent document | Returns appropriate error message |
| 1.5 | Sync with invalid data | Returns appropriate error message |

#### 2. Sync Status Retrieval

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| 2.1 | Get sync status for a single document | Returns correct sync status and mapping |
| 2.2 | Get sync status for multiple documents | Returns correct sync statuses and mappings |
| 2.3 | Get sync status for a non-existent document | Returns appropriate response (not synced) |
| 2.4 | Get sync status with invalid document ID | Returns appropriate error message |

#### 3. Test Mode

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| 3.1 | Sync a document in test mode | Mock service used, returns mock Metakocka ID |
| 3.2 | Get sync status in test mode | Mock service used, returns mock mapping |
| 3.3 | Sync multiple documents in test mode | Mock service used, returns mock success counts |
| 3.4 | Test mode with invalid authentication | Returns appropriate error message |

#### 4. Authentication and Authorization

| Test Case | Description | Expected Result |
|-----------|-------------|-----------------|
| 4.1 | API call with valid session | Request succeeds |
| 4.2 | API call with valid service role header | Request succeeds |
| 4.3 | API call with invalid authentication | Returns 401 Unauthorized |
| 4.4 | API call with valid auth but no org membership | Returns 403 Forbidden |

### Running the Tests

1. Automated Tests:
   ```bash
   cd tests/metakocka
   ./run-sales-document-sync-test.sh
   ```

2. Manual Tests:
   Use the curl commands provided in the test script comments to manually test each endpoint.

### Test Reporting

The test script will automatically generate a test report with:
- Number of passed tests
- Number of failed tests
- Number of skipped tests
- Details for each test case

### Troubleshooting

If tests fail, check:
1. API server is running
2. Authentication tokens are valid
3. Test document IDs exist in the database
4. Network connectivity to the API server
5. Server logs for detailed error messages

## Future Enhancements

1. Implement Metakocka → CRM sync endpoints
2. Add more comprehensive error handling
3. Add more detailed logging
4. Implement retry mechanisms for failed syncs
