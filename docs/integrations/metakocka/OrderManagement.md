# Metakocka Order Management Integration

## Overview

The Metakocka Order Management Integration provides comprehensive order handling capabilities with bidirectional synchronization between CRM Mind and Metakocka ERP. This integration builds upon the core sales document integration framework while adding specialized functionality for order workflows, status tracking, fulfillment, and inventory management.

## Architecture

The integration consists of the following components:

### 1. UI Components

- **OrderList**: Displays a list of orders with selection checkboxes, sync status labels, and sync action buttons.
- **OrderDetail**: Shows detailed order information including order items, status badges, sync status, and action buttons for syncing, updating status, fulfilling, and canceling orders.
- **FulfillOrderButton**: Provides a dialog for entering fulfillment details (tracking number, shipping carrier, notes) and triggers order fulfillment.
- **CancelOrderButton**: Provides a dialog to enter a cancellation reason and triggers order cancellation.

### 2. Client-Side API Module

`order-api.ts` provides client-side functions for:
- Getting sync status for single or multiple orders
- Syncing single or multiple orders to Metakocka
- Updating order status
- Fulfilling orders with optional fulfillment data
- Canceling orders with optional cancellation reason
- Syncing orders from Metakocka to CRM (single and bulk)
- Getting unsynced orders from Metakocka

### 3. Backend Service Layer

`OrderService` extends `SalesDocumentSyncService` and adds order-specific logic:
- Creating orders with inventory allocation
- Updating order status with validation
- Fulfilling and canceling orders
- Inventory-related methods: checking availability, allocating inventory, completing allocation on fulfillment, and releasing allocation on cancellation

### 4. API Routes

- **/api/integrations/metakocka/orders/sync**: Handles GET requests to fetch sync status and POST requests to sync orders with Metakocka
- **/api/integrations/metakocka/orders/status**: Handles POST requests to update order status in Metakocka
- **/api/integrations/metakocka/orders/fulfill**: Handles POST requests to fulfill orders in Metakocka
- **/api/integrations/metakocka/orders/cancel**: Handles POST requests to cancel orders in Metakocka

## Database Schema

The order management integration uses the following database tables:

1. **sales_documents**: Stores order data with order-specific fields
2. **sales_document_items**: Stores order line items
3. **sales_document_mappings**: Maps CRM orders to Metakocka orders and tracks sync status
4. **order_inventory_allocations**: Tracks inventory allocations for order items
5. **order_fulfillments**: Stores fulfillment records for orders

## Workflows

### Order Creation and Sync

1. User creates an order in the CRM
2. User clicks "Sync to Metakocka" button
3. System checks inventory availability
4. System creates order in Metakocka
5. System allocates inventory
6. System creates mapping record
7. System updates sync status

### Order Status Update

1. User selects a new status for an order
2. System validates the status transition
3. System updates the status in Metakocka
4. System updates the status in the CRM
5. System updates the mapping record

### Order Fulfillment

1. User clicks "Fulfill Order" button
2. User enters fulfillment details (tracking number, shipping carrier, notes)
3. System fulfills the order in Metakocka
4. System updates the order status to "fulfilled"
5. System creates a fulfillment record
6. System completes inventory allocations
7. System updates the mapping record

### Order Cancellation

1. User clicks "Cancel Order" button
2. User enters cancellation reason
3. System cancels the order in Metakocka
4. System updates the order status to "cancelled"
5. System releases inventory allocations
6. System updates the mapping record

## Testing

### Test Script

A comprehensive test script (`test-order-management.js`) is available to verify the order management integration. The script tests:

1. Order sync from CRM to Metakocka
2. Order status updates
3. Order fulfillment
4. Order cancellation
5. Order sync from Metakocka to CRM

### Running Tests

```bash
cd tests/metakocka
cp order-management-test.env.sample .env
# Update AUTH_TOKEN with a valid authentication token
./run-order-management-test.sh
```

## Error Handling

The integration includes robust error handling:

1. **Validation Errors**: Validates input data before sending to Metakocka
2. **API Errors**: Handles Metakocka API errors with proper error messages
3. **Inventory Errors**: Validates inventory availability before order creation
4. **Status Transition Errors**: Validates status transitions before updating
5. **Sync Status Tracking**: Tracks sync status and error information in mapping records

## Future Enhancements

1. **Partial Fulfillment**: Support for fulfilling orders partially
2. **Return Processing**: Support for processing returns and refunds
3. **Advanced Inventory Management**: Enhanced inventory allocation strategies
4. **Order Analytics**: Reporting and analytics for order data
5. **Automated Workflows**: Automated status updates and fulfillment processes

## Troubleshooting

### Common Issues

1. **Sync Failures**: Check Metakocka credentials and network connectivity
2. **Inventory Issues**: Verify product inventory levels in Metakocka
3. **Status Update Failures**: Ensure the status transition is valid
4. **Fulfillment Failures**: Check that the order is in a fulfillable state
5. **Cancellation Failures**: Verify that the order can be cancelled

### Logs

Detailed logs are available in the CRM system for troubleshooting:

1. **API Logs**: API request and response logs
2. **Sync Logs**: Order sync operation logs
3. **Error Logs**: Detailed error information
4. **Inventory Logs**: Inventory allocation and release logs
