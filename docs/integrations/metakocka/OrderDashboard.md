# OrderDashboard Component

## Overview
The `OrderDashboard` is a core component of the Metakocka integration, providing a comprehensive interface for managing orders with Metakocka. It allows users to view, search, filter, and sync orders between the CRM and Metakocka.

## Features

- **Order Listing**: Displays a list of orders with key details
- **Status Filtering**: Filter orders by status (draft, confirmed, fulfilled, cancelled)
- **Search Functionality**: Search orders by document number, customer name, or status
- **Bulk Actions**: Select and sync multiple orders at once
- **Sync Status**: Visual indicators for order sync status with Metakocka
- **Responsive Design**: Works on desktop and mobile devices

## Props

```typescript
interface OrderDashboardProps {
  status?: string; // Initial status filter
}
```

## State Management

The component manages the following state:

- `orders`: Array of all orders
- `filteredOrders`: Orders filtered by search and status
- `selectedOrders`: Array of selected order IDs for bulk actions
- `isLoading`: Loading state indicator
- `isSyncing`: Sync operation in progress indicator
- `syncStatus`: Mapping of order IDs to their sync status
- `orderCounts`: Count of orders by status

## API Integration

The component interacts with the following API endpoints:

- `GET /api/sales-documents?type=order`: Fetch orders
- `POST /api/integrations/metakocka/orders/sync/status`: Get sync status for orders
- `POST /api/integrations/metakocka/orders/sync/:orderId`: Sync single order
- `POST /api/integrations/metakocka/orders/sync`: Sync multiple orders

## Usage

```tsx
<OrderDashboard status="draft" />
```

## Error Handling

The component includes comprehensive error handling:
- Network errors are caught and displayed to the user
- Failed sync operations show descriptive error messages
- Loading states prevent duplicate operations

## Dependencies

- React
- Next.js API routes
- Lucide React for icons
- UI components from the project's component library

## Testing

See the test script at `tests/metakocka/test-order-dashboard.js` for examples of how to test the component's functionality.

## Future Improvements

1. Implement pagination for large order lists
2. Add sorting by different columns
3. Enhance mobile responsiveness
4. Add more detailed order filtering options
