# Inventory Alerts

## Overview
The Inventory Alerts system provides real-time monitoring and notifications for inventory levels in the Metakocka integration. It allows users to set up alerts that trigger when inventory levels fall below specified thresholds.

## Features

- **Real-time Monitoring**: Continuously monitors inventory levels
- **Customizable Thresholds**: Set specific quantity thresholds for each product
- **Multiple Alert Types**: Supports low stock and out-of-stock alerts
- **Email Notifications**: Get notified when alerts are triggered
- **Acknowledgment System**: Track which alerts have been addressed
- **Alert History**: View historical alert data and trends

## Database Schema

### `inventory_alerts` Table
- `id` (UUID): Primary key
- `product_id` (UUID): Reference to products table
- `user_id` (UUID): Reference to auth.users table
- `threshold_quantity` (NUMERIC): Quantity at which alert triggers
- `is_active` (BOOLEAN): Whether the alert is active
- `created_at` (TIMESTAMP): When the alert was created
- `updated_at` (TIMESTAMP): When the alert was last updated

### `inventory_alert_history` Table
- `id` (UUID): Primary key
- `alert_id` (UUID): Reference to inventory_alerts table
- `was_triggered` (BOOLEAN): Whether the alert was triggered
- `current_quantity` (NUMERIC): Quantity when checked
- `threshold_quantity` (NUMERIC): Threshold at time of check
- `checked_at` (TIMESTAMP): When the check occurred
- `acknowledged_at` (TIMESTAMP): When the alert was acknowledged
- `acknowledged_by` (UUID): Reference to auth.users table

## API Endpoints

### `GET /api/integrations/metakocka/inventory/alerts`
List all inventory alerts for the current user.

### `POST /api/integrations/metakocka/inventory/alerts`
Create a new inventory alert.

### `GET /api/integrations/metakocka/inventory/alerts/:id`
Get details of a specific inventory alert.

### `PUT /api/integrations/metakocka/inventory/alerts/:id`
Update an existing inventory alert.

### `DELETE /api/integrations/metakocka/inventory/alerts/:id`
Delete an inventory alert.

### `GET /api/integrations/metakocka/inventory/alerts/check`
Check for triggered alerts.

### `POST /api/integrations/metakocka/inventory/alerts/check`
Acknowledge an alert.

### `GET /api/integrations/metakocka/inventory/alerts/stats`
Get alert statistics.

## Usage

### Creating an Alert
```typescript
const response = await fetch('/api/integrations/metakocka/inventory/alerts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    product_id: 'product-uuid',
    threshold_quantity: 10,
    is_active: true
  })
});
```

### Checking for Triggered Alerts
```typescript
const response = await fetch('/api/integrations/metakocka/inventory/alerts/check');
const triggeredAlerts = await response.json();
```

### Acknowledging an Alert
```typescript
const response = await fetch('/api/integrations/metakocka/inventory/alerts/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ alertId: 'alert-uuid' })
});
```

## Database Migrations

### Running Migrations
```bash
npm run db:migrate
```

### Creating a New Migration
```bash
npm run db:migrate:create --name=add_feature_xyz
```

### Checking Migration Status
```bash
npm run db:migrate:status
```

## Testing

Run the test suite:
```bash
cd tests/metakocka
./run-inventory-sync-test.sh
```

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Supabase service role key
- `METAKOCKA_API_KEY`: Metakocka API key
- `METAKOCKA_COMPANY_ID`: Metakocka company ID

## Error Handling

All API endpoints return appropriate HTTP status codes and error messages in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Security Considerations

- All API endpoints require authentication
- Users can only access their own alerts
- Sensitive operations are logged
- Input validation is performed on all endpoints
