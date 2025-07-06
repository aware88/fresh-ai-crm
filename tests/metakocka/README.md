# Metakocka Integration Tests

This directory contains test scripts for verifying the Metakocka integration functionality in CRM Mind.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment files:
   ```bash
   # For contact sync tests
   cp contact-sync-test.env.sample .env
   
   # For product sync tests
   cp product-sync-test.env.sample .env
   
   # For sales document sync tests
   cp sales-document-sync-test.env.sample .env
   
   # For bidirectional sync verification
   cp bidirectional-sync-test.env.sample .env
   
   # For inventory sync tests
   cp inventory-sync-test.env.sample .env
   ```

3. Update the environment files with your authentication token and other required values.

## Available Tests

### Contact Synchronization

Tests bidirectional contact sync between CRM and Metakocka.

```bash
./run-contact-sync-test.sh
```

### Inventory Synchronization

Tests bidirectional inventory sync between CRM and Metakocka.

#### Basic Inventory Sync Test

Tests the basic inventory synchronization functionality:

```bash
./run-inventory-sync-test.sh
```

#### Enhanced Inventory Sync Test

Tests the enhanced inventory synchronization functionality with comprehensive test coverage:

```bash
./run-inventory-sync-enhanced-test.sh
```

##### Enhanced Test Coverage

1. **Sync All Product Inventory**: Tests syncing all product inventory data from Metakocka
2. **Get All Product Inventory**: Tests retrieving inventory data for all products
3. **Sync Individual Product Inventory**: Tests syncing inventory for a specific product
4. **Get Individual Product Inventory**: Tests retrieving inventory data for a specific product
5. **Check Product Availability**: Tests checking if a product is available in a required quantity

### Product Synchronization

Tests bidirectional product sync between CRM and Metakocka.

```bash
./run-product-sync-test.sh
```

### Sales Document Synchronization

Tests bidirectional sales document sync between CRM and Metakocka with comprehensive test coverage.

### Prerequisites
1. Create a `.env` file from the sample:
   ```bash
   cp sales-document-sync-test.env.sample .env
   ```
2. Update the `.env` file with valid values:
   ```
   AUTH_TOKEN=your_auth_token
   DOCUMENT_ID=valid_sales_doc_id
   METAKOCKA_ID=metakocka_doc_id  # For reverse sync tests
   ```

### Running Tests
```bash
./run-sales-document-sync-test.sh
```

### Test Coverage

#### 1. Single Document Sync (CRM → Metakocka)
- Document creation in Metakocka
- Mapping creation/updates
- Field validation
- Status updates

#### 2. Bulk Document Sync (CRM → Metakocka)
- Multiple document processing
- Individual status tracking
- Error handling

#### 3. Document Mapping Status
- Single document status
- Bulk status retrieval
- Post-sync verification

#### 4. Reverse Sync (Metakocka → CRM)
- Document creation/updates
- Mapping verification
- Bidirectional consistency

### Test Flow
1. Create test documents in CRM
2. Sync to Metakocka
3. Verify document creation and mapping
4. Sync back to CRM
5. Verify data consistency
6. Test error conditions
7. Verify error handling and logging

### Expected Outcomes
- All tests complete without unhandled errors
- Accurate document mappings
- Proper error state handling
- Correct sync status updates

### Bidirectional Sync Verification

Comprehensive test that verifies the complete bidirectional sync flow for sales documents:
1. Create a test document in CRM
2. Sync to Metakocka
3. Verify in Metakocka
4. Sync back to CRM
5. Verify in CRM

```bash
./run-bidirectional-sync-test.sh
```

### Email Integration

Tests the Metakocka email integration features.

```bash
./run-metakocka-email-test.sh
```

### Order Management Integration

Tests the Metakocka order management integration with comprehensive test coverage.

#### Prerequisites
1. Create a `.env` file from the sample:
   ```bash
   cp order-management-test.env.sample .env
   ```
2. Update the `.env` file with valid values:
   ```
   AUTH_TOKEN=your_auth_token
   # Optional: ORDER_ID=existing_order_id
   # Optional: METAKOCKA_ID=existing_metakocka_order_id
   ```

#### Running Tests
```bash
./run-order-management-test.sh
```

#### Order Dashboard Tests

Tests the OrderDashboard component functionality including fetching, filtering, and syncing orders.

1. Create a `.env` file from the sample:
   ```bash
   cp order-dashboard-test.env.sample .env
   ```
2. Update the `.env` file with valid values:
   ```
   AUTH_TOKEN=your_auth_token
   BASE_URL=http://localhost:3000
   ```
3. Run the test script:
   ```bash
   ./run-order-dashboard-test.sh
   ```

##### Order Dashboard Test Coverage

1. **Order Fetching**: Tests retrieving orders from the API
2. **Sync Status Retrieval**: Tests getting sync status for orders
3. **Single Order Sync**: Tests syncing an individual order
4. **Multiple Order Sync**: Tests syncing multiple orders at once
5. **Sync from Metakocka**: Tests importing orders from Metakocka

#### General Order Management Test Coverage

1. **Order Sync (CRM → Metakocka)**
   - Order creation in Metakocka
   - Mapping creation/updates
   - Field validation

2. **Order Status Updates**
   - Status transition testing (draft → confirmed → processing)
   - Status synchronization between systems

3. **Order Fulfillment**
   - Fulfillment process testing
   - Inventory allocation management
   - Shipping information updates

4. **Order Cancellation**
   - Cancellation process testing
   - Inventory allocation release
   - Status updates

5. **Reverse Sync (Metakocka → CRM)**
   - Order creation/updates in CRM from Metakocka
   - Mapping verification
   - Bidirectional consistency

## Test Modes

Most tests support two modes:

1. **Test Mode** (TEST_MODE=true): Creates test data automatically and cleans up after testing.
2. **Verification Mode** (TEST_MODE=false): Uses existing data specified by IDs in the environment file.

## Common Environment Variables

- `AUTH_TOKEN`: Authentication token for API requests
- `API_BASE_URL`: Base URL for API requests (defaults to http://localhost:3000/api)
- `TEST_MODE`: Whether to create test data automatically

## Troubleshooting

### Common Issues

1. **Authentication errors**: Ensure your AUTH_TOKEN is valid and not expired
2. **Missing dependencies**: Run `npm install` to install all required dependencies
3. **Permission issues**: Make sure the shell scripts are executable (`chmod +x *.sh`)
4. **API errors**: Check that your local development server is running

### Logs

All test scripts produce detailed logs with success/failure indicators:
- ✅ Passed tests
- ❌ Failed tests
- ⏭️ Skipped tests

Failed tests include error messages to help diagnose issues.
