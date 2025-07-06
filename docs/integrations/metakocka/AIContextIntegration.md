# Metakocka AI Context Integration

## Overview

This document provides a comprehensive overview of the Metakocka AI context integration across all CRM Mind system modules. The integration enables AI-powered features to leverage Metakocka data including products, inventory, contacts, sales documents, and orders for enhanced context-aware responses and processing.

## Architecture

The Metakocka AI context integration follows a layered architecture:

1. **Data Providers Layer**: Fetches and formats Metakocka data for AI consumption
2. **Context Builder Layer**: Integrates Metakocka data into AI context for various use cases
3. **Service Layer**: Domain-specific services that provide specialized data and operations
4. **API Layer**: Endpoints for accessing and manipulating Metakocka data
5. **Testing Layer**: Comprehensive test scripts for verifying integration functionality

## Core Components

### 1. AI Context Builder (`src/lib/ai/context-builder.ts`)

The context builder is responsible for assembling AI context for different scenarios:

- **Document Processing Context**: Includes Metakocka data relevant to document processing
- **Query Processing Context**: Includes Metakocka data relevant to user queries

Key integration points:

```typescript
// For document processing
let orderContext = null;
if (context.document?.document_type === 'order') {
    orderContext = await getOrderDetailsForAI(context.document.id, context.document.created_by);
}

// For query processing
let orderContext = null;
if (context.query?.order_id) {
    orderContext = await getOrderDetailsForAI(context.query.order_id, context.query.created_by);
}
```

### 2. Metakocka AI Integration (`src/lib/integrations/metakocka/metakocka-ai-integration.ts`)

Provides functions for fetching and formatting Metakocka data for AI context:

- `getMetakockaDataForAIContext(userId)`: Fetches comprehensive Metakocka data
- `getOrderDetailsForAI(orderId, userId)`: Fetches detailed order information
- Data formatting utilities for products, contacts, sales documents, and orders

### 3. Order Service (`src/lib/integrations/metakocka/order-service.ts`)

Extends the sales document functionality with order-specific operations:

- Order creation with inventory allocation
- Status updates and synchronization
- Fulfillment and cancellation workflows
- Inventory integration

### 4. Inventory Service (`src/lib/integrations/metakocka/inventory-service.ts`)

Provides real-time inventory data and operations:

- Inventory data synchronization
- Product availability checking
- Inventory allocation for orders

## Integration Points

### 1. Products & Inventory

The AI context includes product and inventory data:

- Product details (name, SKU, price, etc.)
- Current inventory levels
- Availability status

### 2. Contacts

The AI context includes contact information:

- Contact details (name, email, phone, etc.)
- Contact type (customer, supplier, etc.)
- Contact history and preferences

### 3. Sales Documents

The AI context includes sales document data:

- Document details (type, number, date, etc.)
- Line items and totals
- Status and history

### 4. Orders

The AI context includes detailed order information:

- Order details (number, date, customer, etc.)
- Line items with quantities and prices
- Fulfillment status and history
- Inventory allocation status

### 5. Email System

The AI context for email processing includes:

- Metakocka data relevant to the email context
- Order references and details when applicable
- Product and inventory information when relevant

## Multi-tenant Awareness

All data fetching operations include user ID filtering to maintain proper multi-tenant isolation:

- Supabase RLS policies enforce data isolation
- All API calls include user context
- AI context building respects user ownership

## Error Handling

The integration includes robust error handling:

- Graceful degradation when Metakocka data is unavailable
- Detailed error logging with context (userId, entityId, etc.)
- Non-blocking AI context building (continues even if some data is unavailable)

## Testing Infrastructure

Comprehensive test scripts verify the integration functionality:

### 1. Order Management Tests (`tests/metakocka/order-management-test.js`)

Tests order-specific operations:

- Order creation and synchronization
- Status updates and fulfillment
- Cancellation and inventory release
- Bidirectional sync

### 2. Inventory Sync Tests (`tests/metakocka/test-inventory-sync-enhanced.js`)

Tests inventory-related operations:

- Syncing all product inventory
- Retrieving inventory data
- Checking product availability
- Individual product inventory sync

### 3. Email Integration Tests (`tests/metakocka/test-email-metakocka-integration.js`)

Tests email integration with Metakocka:

- Email metadata enrichment
- AI response generation with Metakocka context
- Email template population

### 4. Contact Sync Tests (`tests/metakocka/test-contact-sync.js`)

Tests contact synchronization:

- Single contact sync (bidirectional)
- Bulk contact sync (bidirectional)
- Contact mapping status

### 5. Product Sync Tests (`tests/metakocka/test-product-sync.js`)

Tests product synchronization:

- Single product sync (bidirectional)
- Bulk product sync (bidirectional)
- Product mapping status

### 6. Sales Document Sync Tests (`tests/metakocka/test-sales-document-sync.js`)

Tests sales document synchronization:

- Single document sync (bidirectional)
- Bulk document sync (bidirectional)
- Document mapping status

## Running Tests

To verify the integration functionality, run the test scripts:

```bash
cd tests/metakocka

# Order management tests
./run-order-management-test.sh

# Inventory sync tests
./run-inventory-sync-enhanced-test.sh

# Email integration tests
./run-metakocka-email-test.sh

# Contact sync tests
./run-contact-sync-test.sh

# Product sync tests
./run-product-sync-test.sh

# Sales document sync tests
./run-sales-document-sync-test.sh
```

## Conclusion

The Metakocka AI context integration is comprehensive and consistent across all system modules. It enables AI-powered features to leverage Metakocka data for enhanced context-aware responses and processing. The integration follows best practices with proper separation of concerns, multi-tenant awareness, and robust error handling.
