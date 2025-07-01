# Testing Guide

This document provides guidance on testing the Fresh AI CRM application, with a focus on the inventory alert system.

## Table of Contents
- [Running Tests](#running-tests)
- [Test Types](#test-types)
- [Integration Tests](#integration-tests)
- [Unit Tests](#unit-tests)
- [End-to-End Testing](#end-to-end-testing)
- [Testing the Alert Processor](#testing-the-alert-processor)
- [Test Data Management](#test-data-management)
- [Debugging Tests](#debugging-tests)
- [Code Coverage](#code-coverage)

## Running Tests

### Running All Tests
```bash
npm test
```

### Running Unit Tests
```bash
npm run test:unit
```

### Running Integration Tests
```bash
npm run test:integration
```

### Running Tests in Watch Mode
```bash
# All tests
npm run test:watch

# Unit tests only
npm run test:unit:watch

# Integration tests only
npm run test:integration:watch
```

### Running with Coverage
```bash
npm run test:coverage
```

## Test Types

### Unit Tests
- Location: `tests/unit/`
- Purpose: Test individual functions and components in isolation
- Dependencies: Mocked
- Execution: Fast

### Integration Tests
- Location: `tests/integration/`
- Purpose: Test interactions between components
- Dependencies: Real services where possible, mocked where necessary
- Execution: Slower than unit tests

### End-to-End Tests
- Location: `tests/e2e/`
- Purpose: Test complete user flows
- Dependencies: Real services and test database
- Execution: Slowest

## Integration Tests

### Inventory Alert Tests

#### Test Files
- `tests/integration/inventory-alerts.test.ts` - Core alert functionality
- `tests/integration/alert-notifications.test.ts` - Notification system tests

#### Running Specific Test Files
```bash
# Run a specific test file
npm test -- tests/integration/inventory-alerts.test.ts

# Run tests matching a pattern
npm test -- -t "inventory alerts"
```

#### Test Environment
Integration tests require the following environment variables to be set in a `.env.test` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_test_supabase_service_role_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_anon_key
RESEND_API_KEY=test_resend_api_key
```

## Unit Tests

### Alert Processor Tests
- Location: `tests/unit/workers/alert-processor.test.ts`
- Tests the background worker that processes alerts

### Notification Service Tests
- Location: `tests/unit/services/alert-notification-service.test.ts`
- Tests email and SMS notification functionality

### Inventory Alert Service Tests
- Location: `tests/unit/services/inventory-alert-service.test.ts`
- Tests the core alert service methods

## End-to-End Testing

### Prerequisites
1. Set up a test database
2. Configure test environment variables
3. Run the application in test mode

### Running E2E Tests
```bash
# Start the test server
npm run test:server

# In a separate terminal
npm run test:e2e
```

## Testing the Alert Processor

The alert processor runs as a background worker. To test it:

### Running the Processor in Development Mode
```bash
npm run alert-processor:dev
```

### Testing with Real Data
1. Set up test alerts in your database
2. Update inventory levels to trigger alerts
3. Verify notifications are sent
4. Check alert history is updated

## Test Data Management

### Seeding Test Data
```bash
# Seed the test database
npm run db:seed:test
```

### Test Data Factories
Test data factories are available in `tests/factories/` to help create consistent test data.

## Debugging Tests

### Debugging with Chrome DevTools
```bash
# Run tests with Node.js inspector
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debugging in VS Code
Add this to your `launch.json`:

```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--config", "jest.config.js"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "cwd": "${workspaceFolder}"
}
```

## Code Coverage

### Generating Coverage Reports
```bash
npm run test:coverage
```

### Coverage Thresholds
Minimum coverage thresholds are set in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Viewing Coverage
Open `coverage/lcov-report/index.html` in a browser to view the detailed coverage report.

## Best Practices

1. Write tests before or alongside implementation (TDD)
2. Keep tests focused and independent
3. Use descriptive test names
4. Test edge cases and error conditions
5. Mock external dependencies
6. Clean up test data after each test
7. Run tests in isolation
8. Keep tests maintainable and readable
