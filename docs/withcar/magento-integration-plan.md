# Magento Integration Implementation Plan

## Overview

This document outlines the detailed implementation plan for connecting the Magento Integration component with real Magento data. The integration will allow users to view customer orders and product information directly within the email client interface.

## Architecture

### Components

1. **Magento API Client**
   - Handles authentication and communication with Magento
   - Implements retry logic and error handling
   - Caches responses for performance

2. **Backend API Routes**
   - `/api/magento/orders`: Fetch orders by customer email
   - `/api/magento/products`: Fetch product details
   - `/api/magento/customers`: Fetch customer information

3. **Database Schema**
   - `magento_connection_settings`: Stores API credentials and connection settings
   - `magento_data_cache`: Caches frequently accessed data

4. **UI Components**
   - `MagentoIntegration`: Main component (already implemented)
   - `MagentoOrderDetails`: Detailed order view
   - `MagentoProductCard`: Product information display

## Implementation Steps

### 1. Magento API Client

```typescript
// src/lib/integrations/magento/magento-api-client.ts

import { createClient } from '@magento/api-client';
import { supabase } from '@/lib/supabaseClient';

export class MagentoApiClient {
  private client;
  private cache = new Map();
  
  constructor(apiUrl: string, apiKey: string) {
    this.client = createClient({
      baseUrl: apiUrl,
      apiKey: apiKey,
    });
  }
  
  async getOrdersByEmail(email: string) {
    const cacheKey = `orders_${email}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const orders = await this.client.orders.getByCustomerEmail(email);
      this.cache.set(cacheKey, orders);
      return orders;
    } catch (error) {
      console.error('Error fetching Magento orders:', error);
      throw error;
    }
  }
  
  async getProductById(productId: string) {
    const cacheKey = `product_${productId}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    try {
      const product = await this.client.products.getById(productId);
      this.cache.set(cacheKey, product);
      return product;
    } catch (error) {
      console.error('Error fetching Magento product:', error);
      throw error;
    }
  }
}

export async function getMagentoClient() {
  const { data, error } = await supabase
    .from('magento_connection_settings')
    .select('api_url, api_key')
    .single();
    
  if (error || !data) {
    throw new Error('Failed to load Magento connection settings');
  }
  
  return new MagentoApiClient(data.api_url, data.api_key);
}
```

### 2. Backend API Routes

```typescript
// src/app/api/magento/orders/route.ts

import { NextResponse } from 'next/server';
import { getMagentoClient } from '@/lib/integrations/magento/magento-api-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  
  if (!email) {
    return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
  }
  
  try {
    const magentoClient = await getMagentoClient();
    const orders = await magentoClient.getOrdersByEmail(email);
    
    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Error in Magento orders API:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
```

### 3. Database Schema

```sql
-- migrations/XX-create-magento-tables.sql

-- Connection settings table
CREATE TABLE IF NOT EXISTS magento_connection_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  api_url TEXT NOT NULL,
  api_key TEXT NOT NULL,
  store_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE magento_connection_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY magento_connection_settings_organization_isolation ON magento_connection_settings
  USING (organization_id = auth.jwt() ->> 'organization_id');

-- Cache table for frequently accessed data
CREATE TABLE IF NOT EXISTS magento_data_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  cache_key TEXT NOT NULL,
  cache_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Add index for faster lookups
CREATE INDEX magento_data_cache_key_idx ON magento_data_cache(cache_key);
CREATE INDEX magento_data_cache_expiry_idx ON magento_data_cache(expires_at);

-- Add RLS policies
ALTER TABLE magento_data_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY magento_data_cache_organization_isolation ON magento_data_cache
  USING (organization_id = auth.jwt() ->> 'organization_id');
```

### 4. Update UI Component

The existing `MagentoIntegration` component needs to be updated to use the real API:

```typescript
// src/components/email/MagentoIntegration.tsx

import { useState, useEffect } from 'react';
import { Loader2, RefreshCw, Package, ShoppingCart } from 'lucide-react';

interface MagentoOrder {
  id: string;
  increment_id: string;
  customer_email: string;
  status: string;
  created_at: string;
  grand_total: number;
  currency_code: string;
  items: Array<{
    name: string;
    sku: string;
    price: number;
    qty_ordered: number;
  }>;
}

interface MagentoIntegrationProps {
  emailAddress: string;
  onOrderSelect?: (order: MagentoOrder) => void;
}

export default function MagentoIntegration({ emailAddress, onOrderSelect }: MagentoIntegrationProps) {
  const [orders, setOrders] = useState<MagentoOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchOrders = async () => {
    if (!emailAddress) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/magento/orders?email=${encodeURIComponent(emailAddress)}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      
      const data = await response.json();
      setOrders(data.orders);
    } catch (err) {
      setError('Error loading Magento orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchOrders();
  }, [emailAddress]);
  
  const handleRefresh = () => {
    fetchOrders();
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Magento Orders</h3>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Refresh orders"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </button>
      </div>
      
      {loading && <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin" /></div>}
      
      {error && <div className="text-red-500 text-sm py-2">{error}</div>}
      
      {!loading && !error && orders.length === 0 && (
        <div className="text-gray-500 text-sm py-4 text-center">
          No orders found for this customer
        </div>
      )}
      
      {!loading && !error && orders.length > 0 && (
        <div className="space-y-3">
          {orders.map((order) => (
            <div 
              key={order.id} 
              className="border rounded p-3 hover:bg-gray-50 cursor-pointer"
              onClick={() => onOrderSelect?.(order)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-medium">Order #{order.increment_id}</div>
                  <div className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-sm font-medium">
                  <span className={`px-2 py-1 rounded-full ${
                    order.status === 'complete' ? 'bg-green-100 text-green-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'canceled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
              </div>
              
              <div className="mt-2">
                <div className="text-sm font-medium">
                  {order.currency_code} {order.grand_total.toFixed(2)}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-1">
                  <ShoppingCart className="h-3 w-3 mr-1" />
                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'}
                </div>
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                {order.items.slice(0, 2).map((item) => (
                  <div key={item.sku} className="flex items-center">
                    <Package className="h-3 w-3 mr-1" />
                    {item.qty_ordered}x {item.name}
                  </div>
                ))}
                {order.items.length > 2 && (
                  <div className="text-xs text-gray-400 mt-1">
                    +{order.items.length - 2} more items
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Alternative Data Sources

### CSV Import Option

If direct API access is not available, we can implement a CSV import solution:

```typescript
// src/lib/integrations/magento/csv-import.ts

import { parse } from 'csv-parse/sync';
import { supabase } from '@/lib/supabaseClient';

export async function importMagentoOrdersFromCSV(fileContent: string, organizationId: string) {
  try {
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });
    
    // Transform CSV records to our order format
    const orders = transformCsvToOrders(records);
    
    // Store in database
    const { error } = await supabase
      .from('magento_data_cache')
      .insert({
        organization_id: organizationId,
        cache_key: 'orders_csv_import',
        cache_data: { orders },
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });
      
    if (error) throw error;
    
    return { success: true, count: orders.length };
  } catch (error) {
    console.error('Error importing CSV:', error);
    return { success: false, error: 'Failed to import CSV data' };
  }
}

function transformCsvToOrders(records) {
  // Group records by order ID
  const orderMap = new Map();
  
  records.forEach(record => {
    const orderId = record.increment_id || record.order_id;
    
    if (!orderMap.has(orderId)) {
      orderMap.set(orderId, {
        id: record.entity_id || record.order_id,
        increment_id: orderId,
        customer_email: record.customer_email,
        status: record.status,
        created_at: record.created_at,
        grand_total: parseFloat(record.grand_total),
        currency_code: record.order_currency_code || 'USD',
        items: []
      });
    }
    
    // Add item to order
    if (record.sku) {
      const order = orderMap.get(orderId);
      order.items.push({
        name: record.name,
        sku: record.sku,
        price: parseFloat(record.price),
        qty_ordered: parseFloat(record.qty_ordered)
      });
    }
  });
  
  return Array.from(orderMap.values());
}
```

### Database Direct Access

If direct database access is available, we can implement a database connector:

```typescript
// src/lib/integrations/magento/database-connector.ts

import { createPool } from 'mysql2/promise';

export class MagentoDatabaseConnector {
  private pool;
  
  constructor(config) {
    this.pool = createPool({
      host: config.host,
      user: config.user,
      password: config.password,
      database: config.database
    });
  }
  
  async getOrdersByEmail(email: string) {
    try {
      // Get orders
      const [orders] = await this.pool.query(
        `SELECT 
          o.entity_id as id,
          o.increment_id,
          o.customer_email,
          o.status,
          o.created_at,
          o.grand_total,
          o.order_currency_code as currency_code
        FROM 
          sales_order o
        WHERE 
          o.customer_email = ?
        ORDER BY 
          o.created_at DESC
        LIMIT 10`,
        [email]
      );
      
      // Get items for each order
      for (const order of orders) {
        const [items] = await this.pool.query(
          `SELECT 
            name,
            sku,
            price,
            qty_ordered
          FROM 
            sales_order_item
          WHERE 
            order_id = ?
          ORDER BY 
            item_id`,
          [order.id]
        );
        
        order.items = items;
      }
      
      return orders;
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}
```

## Testing Plan

1. **Unit Tests**
   - Test Magento API client functions
   - Test CSV import functionality
   - Test database connector

2. **Integration Tests**
   - Test API routes with mock Magento responses
   - Test end-to-end flow from UI to API to data source

3. **Manual Testing**
   - Verify order display with real data
   - Test performance with large order histories
   - Verify error handling and fallbacks

## Deployment Checklist

- [ ] Create database migrations
- [ ] Implement Magento API client
- [ ] Create backend API routes
- [ ] Update UI components
- [ ] Set up connection settings in admin panel
- [ ] Test with real Magento instance
- [ ] Document API endpoints and data formats
- [ ] Create user guide for Magento integration

## Requirements from Client

To implement this integration, we need the following from the client:

1. **For API Integration**:
   - Magento API endpoint URL
   - API credentials with appropriate permissions
   - Sample customer email addresses for testing

2. **For CSV Import**:
   - Sample CSV export of orders with required fields
   - CSV format documentation
   - Regular export schedule if automated imports are needed

3. **For Database Integration**:
   - Database connection details
   - Schema documentation
   - Read-only database user credentials
