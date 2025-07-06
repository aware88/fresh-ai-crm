# Metakocka Product Integration

This document provides a detailed overview of the product integration between the CRM Mind system and Metakocka ERP.

## Overview

The product integration enables synchronization of product data between the CRM system and Metakocka ERP. This ensures that product information, including pricing, inventory, and descriptions, is consistent across both systems, providing a unified view of the product catalog.

## Key Features

1. **Bidirectional Sync**: Synchronize products in both directions (CRM → Metakocka and Metakocka → CRM)
2. **Bulk Operations**: Support for both single product and bulk product synchronization
3. **Inventory Management**: Track product inventory levels from Metakocka
4. **Price Management**: Synchronize product pricing information
5. **Product Categorization**: Maintain product categories and hierarchies
6. **Image Synchronization**: Sync product images between systems

## Architecture

The product integration follows this architecture:

```
┌─────────────────────────────────────────────────────────────────┐
│                    Product Synchronization Flow                 │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Product Selected/Created                    │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Data Transformation                         │
│  - Map CRM fields to Metakocka fields                          │
│  - Transform pricing information                                │
│  - Handle product variants                                      │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                    Metakocka API Interaction                    │
│  - Create/update product in Metakocka                           │
│  - Handle API responses and errors                              │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Mapping Management                          │
│  - Create/update mapping record                                 │
│  - Store Metakocka product ID                                   │
└───────────────────────────────┬─────────────────────────────────┘
                                │
┌───────────────────────────────▼─────────────────────────────────┐
│                     Status Reporting                            │
│  - Return sync status to user                                   │
│  - Log sync activity                                            │
└─────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Product Transformer

**Purpose**: Transform product data between CRM and Metakocka formats.

**Key Functions**:
- Map CRM product fields to Metakocka product fields
- Transform pricing information
- Handle product variants and options
- Format data according to Metakocka API requirements

**Implementation**: `src/lib/integrations/metakocka/product-transformer.ts`

### 2. Product Synchronizer

**Purpose**: Synchronize products between CRM and Metakocka.

**Key Functions**:
- Send product data to Metakocka API
- Retrieve product data from Metakocka API
- Handle API responses and errors
- Manage retry logic for failed operations

**Implementation**: `src/lib/integrations/metakocka/product-sync.ts`

### 3. Mapping Manager

**Purpose**: Manage mappings between CRM products and Metakocka products.

**Key Functions**:
- Create/update mapping records
- Retrieve mapping information
- Handle mapping conflicts
- Clean up orphaned mappings

**Implementation**: `src/lib/integrations/metakocka/product-mapping-manager.ts`

### 4. Inventory Manager

**Purpose**: Track and update product inventory levels.

**Key Functions**:
- Retrieve inventory levels from Metakocka
- Update inventory information in CRM
- Handle inventory alerts
- Track inventory history

**Implementation**: `src/lib/integrations/metakocka/inventory-manager.ts`

## Database Schema

### Products Table

```sql
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  sku VARCHAR(100),
  description TEXT,
  price DECIMAL(15, 2) NOT NULL,
  cost DECIMAL(15, 2),
  tax_rate DECIMAL(5, 2),
  category VARCHAR(100),
  inventory_count INTEGER,
  inventory_status VARCHAR(50) DEFAULT 'in_stock',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_inventory_status ON products(inventory_status);
```

### Metakocka Product Mappings

```sql
CREATE TABLE metakocka_product_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  metakocka_id VARCHAR(255) NOT NULL,
  metakocka_code VARCHAR(100),
  sync_status VARCHAR(50) NOT NULL DEFAULT 'synced',
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Add indexes for performance
CREATE INDEX idx_metakocka_product_mappings_product_id ON metakocka_product_mappings(product_id);
CREATE INDEX idx_metakocka_product_mappings_metakocka_id ON metakocka_product_mappings(metakocka_id);
```

## Field Mapping

| CRM Field | Metakocka Field | Notes |
|-----------|----------------|-------|
| name | name | Required |
| sku | code | Product code/SKU |
| description | notes | Product description |
| price | sales_price | Sales price |
| cost | purchase_price | Cost price |
| tax_rate | tax_rate | Tax rate percentage |
| category | category | Product category |
| inventory_count | amount | Current inventory level |
| inventory_status | status | Inventory status |

## API Endpoints

### Product Synchronization

- `POST /api/metakocka/products/sync`: Sync a product to Metakocka
  - Request: `{ productId: string }`
  - Response: `{ success: boolean, data: { mappingId: string, metakockaId: string } }`

### Bulk Product Synchronization

- `POST /api/metakocka/products/bulk-sync`: Sync multiple products to Metakocka
  - Request: `{ productIds: string[] }`
  - Response: `{ success: boolean, data: { total: number, succeeded: number, failed: number, results: [] } }`

### Product Mapping Retrieval

- `GET /api/metakocka/products/mappings`: Get product mappings
  - Request: `?productId=<product_id>` or `?metakockaId=<metakocka_id>`
  - Response: `{ success: boolean, data: { id, productId, metakockaId, metakockaCode, syncStatus, lastSyncedAt } }`

### Product Import

- `POST /api/metakocka/products/import`: Import a product from Metakocka
  - Request: `{ metakockaId: string }`
  - Response: `{ success: boolean, data: { productId: string, mappingId: string } }`

### Bulk Product Import

- `POST /api/metakocka/products/bulk-import`: Import multiple products from Metakocka
  - Request: `{ metakockaIds: string[] }` or `{ importAll: boolean }`
  - Response: `{ success: boolean, data: { total: number, imported: number, failed: number, results: [] } }`

### Inventory Update

- `GET /api/metakocka/products/inventory`: Get product inventory from Metakocka
  - Request: `?productId=<product_id>` or `?sku=<sku>`
  - Response: `{ success: boolean, data: { productId, sku, inventoryCount, inventoryStatus, lastUpdated } }`

## Error Handling

The product integration includes comprehensive error handling:

1. **Validation Errors**: Proper validation of product data before synchronization
2. **API Errors**: Handling of Metakocka API errors with appropriate error messages
3. **Conflict Resolution**: Detection and resolution of conflicts between CRM and Metakocka data
4. **Retry Logic**: Automatic retry for transient errors
5. **Error Logging**: Detailed error logging for troubleshooting

## Testing

The product integration can be tested using the `test-product-sync.js` script, which verifies:

1. Single product sync (CRM → Metakocka)
2. Bulk product sync (CRM → Metakocka)
3. Product mapping status retrieval
4. Single product sync (Metakocka → CRM)
5. Inventory level synchronization

See the [Testing Guide](./testing-guide.md) for detailed instructions on running the tests.

## Recent Changes

- Added support for bulk product synchronization
- Improved error handling and reporting
- Enhanced field mapping for better data consistency
- Added inventory tracking integration
- Implemented product category synchronization

## Open Tasks

- Add support for product variant synchronization
- Enhance product image synchronization
- Implement periodic automatic inventory updates
- Add support for product bundles
- Improve performance for large product catalogs
