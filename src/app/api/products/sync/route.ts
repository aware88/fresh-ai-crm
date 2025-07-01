/**
 * API route for product synchronization with Metakocka
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { ProductSyncService } from '@/lib/integrations/metakocka/product-sync';
import { MetakockaError } from '@/lib/integrations/metakocka';
import { ProductSyncResult } from '@/types/product';

/**
 * POST /api/products/sync
 * Sync a single product with Metakocka
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
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Sync product
    const metakockaId = await ProductSyncService.syncProductToMetakocka(
      session.user.id,
      { id: productId } as any // We only need the ID for the sync service
    );

    return NextResponse.json({
      success: true,
      metakockaId
    });
  } catch (error) {
    console.error('Error syncing product:', error);

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
      { error: 'Failed to sync product' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/sync?productId=xxx
 * Get sync status for a product
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

    // Get product ID from query params
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Get product mapping
    const mapping = await ProductSyncService.getProductMapping(
      productId,
      session.user.id
    );

    if (!mapping) {
      return NextResponse.json({
        synced: false
      });
    }

    return NextResponse.json({
      synced: true,
      lastSyncedAt: mapping.lastSyncedAt,
      syncStatus: mapping.syncStatus,
      syncError: mapping.syncError,
      metakockaId: mapping.metakockaId
    });
  } catch (error) {
    console.error('Error getting product sync status:', error);

    return NextResponse.json(
      { error: 'Failed to get product sync status' },
      { status: 500 }
    );
  }
}
