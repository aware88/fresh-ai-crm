# Metakocka Order Management UI Tests

This document describes the UI tests for the Metakocka order management integration in CRM Mind.

## Test Overview

The `order-ui-tests.ts` file contains end-to-end tests for the Metakocka order management UI components using Playwright. These tests verify that the UI components function correctly and integrate properly with the backend API.

## Test Categories

### Order Dashboard Tests

Tests for the order dashboard page (`/orders`):

- **Display Test**: Verifies that the order dashboard loads correctly with all expected elements (headings, tabs, order list table)
- **Search Test**: Tests the order search functionality
- **Sync Test**: Tests syncing an individual order with Metakocka

### Order Detail Tests

Tests for the order detail page (`/orders/[id]`):

- **Display Test**: Verifies that the order detail page loads correctly with all tabs and order information
- **Fulfillment Test**: Tests the order fulfillment workflow including form submission
- **Cancellation Test**: Tests the order cancellation workflow including form submission
- **Inventory Test**: Tests viewing inventory allocations in the fulfillment tab

### Sync from Metakocka Tests

Tests for syncing orders from Metakocka to CRM:

- **Check Test**: Tests checking for unsynced orders from Metakocka
- **Sync Test**: Tests syncing multiple orders from Metakocka to CRM

## Running the Tests

To run the UI tests:

```bash
npm run test:e2e -- tests/metakocka/order-ui-tests.ts
```

## Test Prerequisites

These tests require:

1. A running instance of the CRM Mind application
2. A test user account with access to the Metakocka integration
3. Test data in both the CRM and Metakocka systems
4. Valid API credentials for the Metakocka API

## Helper Functions

The tests use helper functions from `../helpers/auth.ts` for authentication, which handles:

- Logging in as a test user
- Managing authentication state between tests
- Handling session persistence

## Test Data

For reliable testing, you should either:

1. Use fixed test data with known IDs (update the order ID in the tests)
2. Create test data programmatically before running the tests

## Integration with Existing Tests

These UI tests complement the existing API tests in the Metakocka integration test suite. While the API tests verify the backend functionality, these UI tests ensure that the frontend components correctly interact with those APIs and provide appropriate user feedback.

## Extending the Tests

When adding new UI features to the Metakocka order management integration, extend these tests by:

1. Adding new test cases for the new functionality
2. Following the existing patterns for test organization
3. Ensuring tests are isolated and don't depend on each other
