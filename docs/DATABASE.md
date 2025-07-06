# Database Guide

This document provides comprehensive information about the CRM Mind database schema, migrations, and best practices.

## Table of Contents
- [Database Schema](#database-schema)
- [Migrations](#migrations)
- [Row Level Security](#row-level-security)
- [Indexes](#indexes)
- [Backup and Recovery](#backup-and-recovery)
- [Performance Tuning](#performance-tuning)
- [Common Queries](#common-queries)

## Database Schema

### Core Tables

#### `inventory_alerts`
Stores inventory alert configurations.

```sql
CREATE TABLE inventory_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  threshold_quantity NUMERIC NOT NULL,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'reorder')),
  is_active BOOLEAN DEFAULT true,
  notification_channels TEXT[] DEFAULT ARRAY['email']::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_triggered_at TIMESTAMP WITH TIME ZONE
);
```

#### `inventory_alert_history`
Tracks when alerts are triggered.

```sql
CREATE TABLE inventory_alert_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES inventory_alerts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  was_triggered BOOLEAN NOT NULL,
  current_quantity NUMERIC NOT NULL,
  threshold_quantity NUMERIC NOT NULL,
  alert_type TEXT NOT NULL,
  notification_sent BOOLEAN DEFAULT false,
  notification_channels TEXT[],
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  metadata JSONB
);
```

#### `inventory_alert_notifications`
Tracks alert notifications.

```sql
CREATE TABLE inventory_alert_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alert_id UUID REFERENCES inventory_alerts(id) ON DELETE CASCADE,
  history_id UUID REFERENCES inventory_alert_history(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Migrations

### Creating Migrations

1. Create a new migration file:
   ```bash
   npm run db:migrate:create --name=add_feature_name
   ```

2. Write your migration in the generated SQL file:
   ```sql
   -- Up migration
   CREATE TABLE IF NOT EXISTS new_table (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Down migration (for rollback)
   -- DROP TABLE IF EXISTS new_table;
   ```

### Running Migrations

```bash
# Run all pending migrations
npm run db:migrate

# Run migrations for a specific database
DATABASE_URL=your_database_url npm run db:migrate

# Rollback the last migration
npm run db:migrate:rollback

# Rollback all migrations
npm run db:migrate:reset

# Check migration status
npm run db:migrate:status
```

## Row Level Security

### Policies

#### Inventory Alerts Table

```sql
-- Enable RLS
ALTER TABLE inventory_alerts ENABLE ROW LEVEL SECURITY;

-- Users can view their own alerts
CREATE POLICY "Users can view their own alerts"
ON inventory_alerts
FOR SELECT
USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);

-- Users can manage their own alerts
CREATE POLICY "Users can manage their own alerts"
ON inventory_alerts
FOR ALL
USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id 
    FROM organization_members 
    WHERE user_id = auth.uid()
  )
);
```

## Indexes

### Recommended Indexes

```sql
-- For looking up alerts by product
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_product_id 
ON inventory_alerts(product_id);

-- For looking up alerts by user
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_user_id 
ON inventory_alerts(user_id);

-- For looking up alert history by alert
CREATE INDEX IF NOT EXISTS idx_alert_history_alert_id 
ON inventory_alert_history(alert_id);

-- For checking unacknowledged alerts
CREATE INDEX IF NOT EXISTS idx_alert_history_acknowledged 
ON inventory_alert_history(acknowledged_at) 
WHERE acknowledged_at IS NULL;
```

## Backup and Recovery

### Creating Backups

```bash
# Dump the database
pg_dump -h your-db-host -U username -d dbname -f backup.sql

# Dump schema only
pg_dump -h your-db-host -U username -d dbname --schema-only > schema.sql

# Dump data only
pg_dump -h your-db-host -U username -d dbname --data-only > data.sql
```

### Restoring from Backup

```bash
# Restore full backup
psql -h your-db-host -U username -d dbname < backup.sql

# Restore schema only
psql -h your-db-host -U username -d dbname < schema.sql
```

## Performance Tuning

### Query Optimization

1. Use `EXPLAIN ANALYZE` to understand query performance
2. Create appropriate indexes for frequently queried columns
3. Use partial indexes for filtered queries
4. Consider materialized views for complex, frequently accessed data

### Connection Pooling

Use a connection pooler like PgBouncer in production to manage database connections efficiently.

## Common Queries

### Find Active Alerts for a Product

```sql
SELECT * FROM inventory_alerts
WHERE product_id = :productId
AND is_active = true;
```

### Get Alert History with Product Details

```sql
SELECT 
  h.*,
  p.name as product_name,
  p.sku as product_sku
FROM inventory_alert_history h
JOIN products p ON h.product_id = p.id
WHERE h.alert_id = :alertId
ORDER BY h.checked_at DESC;
```

### Find Unacknowledged Alerts

```sql
SELECT 
  a.*,
  p.name as product_name,
  p.sku as product_sku
FROM inventory_alerts a
JOIN products p ON a.product_id = p.id
JOIN inventory_alert_history h ON h.alert_id = a.id
WHERE h.acknowledged_at IS NULL
AND h.was_triggered = true
AND a.is_active = true;
```

### Get Alert Statistics

```sql
SELECT 
  COUNT(*) as total_alerts,
  COUNT(*) FILTER (WHERE is_active = true) as active_alerts,
  COUNT(*) FILTER (WHERE is_active = false) as inactive_alerts,
  COUNT(DISTINCT user_id) as users_with_alerts
FROM inventory_alerts
WHERE organization_id = :organizationId;
```

## Best Practices

1. Always use parameterized queries to prevent SQL injection
2. Add indexes for frequently queried columns
3. Use transactions for operations that modify multiple tables
4. Regularly update database statistics
5. Monitor slow queries and optimize them
6. Keep the schema normalized but denormalize for performance when necessary
7. Document all database changes in migration files
8. Test all migrations in a staging environment before production
