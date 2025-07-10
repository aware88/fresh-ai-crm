# Metakocka Order Management Integration

This directory contains React UI components for the Metakocka order management system integration within the ARIS (Agentic Relationship Intelligence System) project.

## Components Overview

### Order Management Components

1. **OrderDashboard**
   - Main dashboard for viewing, searching, and managing orders
   - Supports individual and bulk order synchronization with Metakocka
   - Includes refresh functionality and sync status indicators

2. **OrderList**
   - Displays a table of orders with selection checkboxes
   - Shows sync status indicators and sync buttons per order
   - Supports pagination and sorting

3. **OrderDetail**
   - Detailed view of a single order with all order information
   - Displays order items, customer details, and status
   - Includes actions for status updates, fulfillment, and cancellation

4. **OrderDetailPage**
   - Comprehensive page component for managing order details
   - Includes tabs for different order management aspects
   - Integrates with OrderDetail and OrderInventoryAllocation components

5. **OrderStatusBadge**
   - Visual badge component showing order status with color-coded labels
   - Supports different statuses: Draft, Confirmed, Fulfilled, Cancelled, etc.

### Action Components

1. **FulfillOrderButton**
   - Button component with a dialog for fulfilling orders
   - Captures tracking number, shipping carrier, and notes
   - Calls the fulfillment API with loading and error handling

2. **CancelOrderButton**
   - Button component with a dialog for cancelling orders
   - Captures cancellation reason
   - Calls the cancellation API with loading and error handling

3. **SyncOrdersFromMetakockaButton**
   - Button to check for unsynced orders from Metakocka
   - Syncs unsynced orders to the CRM
   - Provides toast notifications and loading states

### Inventory Management

1. **OrderInventoryAllocation**
   - Displays and manages inventory allocations for an order
   - Shows allocated and fulfilled quantities per product
   - Supports updating allocation status (allocated, fulfilled, released)

## Usage

### Order Dashboard

```tsx
// Example usage of OrderDashboard
import OrderDashboard from '@/components/integrations/metakocka/OrderDashboard';

export default function OrdersPage() {
  return (
    <div className="container mx-auto py-6">
      <OrderDashboard userId="user-123" />
    </div>
  );
}
```

### Order Detail

```tsx
// Example usage of OrderDetailPage
import OrderDetailPage from '@/components/integrations/metakocka/OrderDetailPage';

export default function OrderDetailRoute() {
  return (
    <div className="container mx-auto py-6">
      <OrderDetailPage 
        orderId="order-123" 
        userId="user-123" 
      />
    </div>
  );
}
```

## API Integration

These components integrate with the following API endpoints:

- `/api/integrations/metakocka/orders/sync` - Sync orders to Metakocka
- `/api/integrations/metakocka/orders/sync-from-metakocka` - Sync orders from Metakocka
- `/api/integrations/metakocka/orders/sync-status` - Get order sync status
- `/api/integrations/metakocka/orders/update-status` - Update order status
- `/api/integrations/metakocka/orders/fulfill` - Fulfill an order
- `/api/integrations/metakocka/orders/cancel` - Cancel an order
- `/api/integrations/metakocka/orders/unsynced` - Get unsynced orders from Metakocka

## Features

- **Bidirectional Sync**: Sync orders to and from Metakocka
- **Status Management**: Update order status with appropriate UI feedback
- **Fulfillment Workflow**: Complete fulfillment process with tracking information
- **Cancellation Workflow**: Cancel orders with reason documentation
- **Inventory Integration**: View and manage inventory allocations for orders
- **Multi-tenant Support**: All operations respect tenant isolation
- **Error Handling**: Comprehensive error handling with user feedback
- **Loading States**: Clear loading indicators for all async operations

## Development

### Adding New Components

1. Create the new component in this directory
2. Export it from the appropriate index file if needed
3. Update this README to document the new component

### Extending Functionality

When extending functionality, ensure:

1. Consistent error handling patterns are followed
2. Loading states are properly managed
3. Multi-tenant isolation is respected
4. UI components follow the design system

## Testing

Refer to the test scripts in `/tests/metakocka/` for examples of how to test these components.
