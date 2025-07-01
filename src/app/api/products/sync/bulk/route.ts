/**
 * API route for bulk product synchronization with Metakocka
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ProductSyncService } from '@/lib/integrations/metakocka/product-sync';
import { MetakockaError } from '@/lib/integrations/metakocka';
import { ProductSyncResult } from '@/types/product';

/**
 * POST /api/products/sync/bulk
 * Sync multiple products with Metakocka
 */
export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { productIds } = body;

    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'Product IDs array is required' },
        { status: 400 }
      );
    }

    // Sync products
    const result = await ProductSyncService.syncProductsToMetakocka(
      session.user.id,
      productIds
    );

    return NextResponse.json({
      success: result.success,
      created: result.created,
      updated: result.updated,
      failed: result.failed,
      errors: result.errors
    } as ProductSyncResult);
  } catch (error) {
    console.error('Error syncing products:', error);

    if (error instanceof MetakockaError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          type: error.type
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to sync products' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/sync/bulk?productIds=xxx,yyy,zzz
 * Get sync status for multiple products
 */
export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get product IDs from query params
    const { searchParams } = new URL(request.url);
    const productIdsParam = searchParams.get('productIds');

    if (!productIdsParam) {
      return NextResponse.json(
        { error: 'Product IDs are required' },
        { status: 400 }
      );
    }

    const productIds = productIdsParam.split(',');

    // Get product mappings
    const mappings = await ProductSyncService.getProductMappings(
      productIds,
      session.user.id
    );

    // Create a map of product ID to sync status
    const mappingsMap = new Map(
      mappings.map(mapping => [
        mapping.productId,
        {
          synced: true,
          lastSyncedAt: mapping.lastSyncedAt,
          syncStatus: mapping.syncStatus,
          syncError: mapping.syncError,
          metakockaId: mapping.metakockaId
        }
      ])
    );

    // Create response with status for each product
    const response = {
      mappings: productIds.map(productId => ({
        productId,
        ...(mappingsMap.get(productId) || { synced: false })
      }))
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error getting product sync status:', error);

    return NextResponse.json(
      { error: 'Failed to get product sync status' },
      { status: 500 }
    );
  }
}
