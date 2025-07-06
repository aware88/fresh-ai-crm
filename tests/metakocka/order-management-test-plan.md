# Metakocka Order Management Integration Test Plan

## Overview

This document outlines the testing strategy for the Metakocka order management integration. It covers both manual UI testing and automated API testing approaches.

## Prerequisites

1. **Running Development Environment**:
   - Next.js application running (`npm run dev`)
   - Proper environment variables configured in `.env.local`
   - Supabase instance accessible

2. **Valid Authentication**:
   - User account with access to the CRM
   - Metakocka credentials configured in the system

## Test Scenarios

### 1. Order Creation and Sync

#### UI Testing

1. **Create Order**:
   - Navigate to Sales Documents section
   - Click "New Order" button
   - Fill in order details (customer, products, quantities, prices)
   - Save the order
   - Verify order appears in the list with "Not Synced" status

2. **Sync Order to Metakocka**:
   - Find the created order in the list
   - Click "Sync to Metakocka" button
   - Verify sync status changes to "Synced"
   - Verify Metakocka ID is displayed

#### API Testing

```javascript
// Create order
POST /api/sales-documents
Body: {
  "document_type": "order",
  "document_date": "2025-07-01",
  "customer_name": "Test Customer",
  "total_amount": 123.45,
  "status": "draft",
  "items": [...]
}

// Sync order to Metakocka
POST /api/integrations/metakocka/orders/sync
Body: { "orderId": "<order_id>" }
```

### 2. Order Status Management

#### UI Testing

1. **Update Order Status**:
   - Open order details
   - Click status dropdown
   - Select new status (e.g., "Confirmed")
   - Verify status changes in UI
   - Verify status is synced to Metakocka

#### API Testing

```javascript
// Update order status
POST /api/integrations/metakocka/orders/status
Body: { "orderId": "<order_id>", "status": "confirmed" }
```

### 3. Order Fulfillment

#### UI Testing

1. **Fulfill Order**:
   - Open order details
   - Click "Fulfill Order" button
   - Enter fulfillment details (tracking number, carrier, notes)
   - Submit fulfillment
   - Verify order status changes to "Fulfilled"
   - Verify fulfillment details are displayed

#### API Testing

```javascript
// Fulfill order
POST /api/integrations/metakocka/orders/fulfill
Body: {
  "orderId": "<order_id>",
  "fulfillmentData": {
    "tracking_number": "TRACK123456",
    "shipping_carrier": "Test Carrier",
    "notes": "Test fulfillment",
    "fulfillment_date": "2025-07-01"
  }
}
```

### 4. Order Cancellation

#### UI Testing

1. **Cancel Order**:
   - Open order details
   - Click "Cancel Order" button
   - Enter cancellation reason
   - Submit cancellation
   - Verify order status changes to "Cancelled"
   - Verify cancellation reason is displayed

#### API Testing

```javascript
// Cancel order
POST /api/integrations/metakocka/orders/cancel
Body: {
  "orderId": "<order_id>",
  "cancellationReason": "Test cancellation"
}
```

### 5. Sync from Metakocka

#### UI Testing

1. **Sync Orders from Metakocka**:
   - Navigate to Orders section
   - Click "Sync from Metakocka" button
   - Verify new orders appear in the list
   - Verify existing orders are updated

#### API Testing

```javascript
// Get unsynced orders from Metakocka
GET /api/integrations/metakocka/orders/unsynced

// Sync specific order from Metakocka
POST /api/integrations/metakocka/orders/sync-from
Body: { "metakockaId": "<metakocka_id>" }

// Sync all unsynced orders from Metakocka
POST /api/integrations/metakocka/orders/sync-all-from
```

## Authentication for API Testing

To properly test the API endpoints, you need to obtain a valid authentication token:

1. **Browser Method**:
   - Log in to the application in a browser
   - Open browser developer tools
   - Find the authentication token in local storage or cookies
   - Use this token in API requests

2. **Programmatic Method**:
   - Use the application's authentication API
   - Example: `POST /api/auth/signin` with credentials
   - Extract token from response
   - Use token in subsequent requests

## Test Execution

### Manual UI Testing

1. Follow the UI testing steps for each scenario
2. Document any issues or unexpected behavior
3. Verify that all operations are reflected correctly in both CRM and Metakocka

### Automated API Testing

1. Obtain a valid authentication token
2. Update the `.env` file with the token
3. Run the test script:
   ```bash
   cd tests/metakocka
   ./run-order-management-test.sh
   ```
4. Review the test results and logs

## Troubleshooting

### Common Issues

1. **Authentication Errors**:
   - Ensure you have a valid authentication token
   - Check that the token is included in request headers

2. **API Response Errors**:
   - Check server logs for detailed error information
   - Verify that request payloads match expected formats

3. **Sync Failures**:
   - Verify Metakocka credentials are valid
   - Check network connectivity to Metakocka API
   - Review error logs for specific error messages

### Logs and Debugging

1. **Server Logs**:
   - Check Next.js server logs for API errors
   - Look for error messages related to Metakocka integration

2. **Browser Console**:
   - Check browser console for client-side errors
   - Look for failed API requests and error responses

3. **Network Monitoring**:
   - Use browser network tab to monitor API requests
   - Examine request payloads and response data
