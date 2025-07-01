/**
 * API route for syncing products with Metakocka
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { getSession } from '../../../../../../lib/auth/session';
import { ProductSyncService } from '../../../../../../lib/integrations/metakocka/product-sync';
import { MetakockaError } from '../../../../../../lib/integrations/metakocka';

/**
 * POST /api/integrations/metakocka/products/sync
 * Sync products with Metakocka
 * 
 * Request body:
 * - productIds?: string[] - Optional array of product IDs to sync (if not provided, all products will be synced)
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    const productIds = body.productIds;
    
    // Validate productIds if provided
    if (productIds && !Array.isArray(productIds)) {
      return NextResponse.json(
        { error: 'productIds must be an array of strings' },
        { status: 400 }
      );
    }
    
    // Sync products
    const result = await ProductSyncService.syncProductsToMetakocka(
      session.user.id,
      productIds
    );
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing products with Metakocka:', error);
    
    if (error instanceof MetakockaError) {
      return NextResponse.json(
        { 
          error: error.message,
          type: error.type,
          code: error.code
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to sync products with Metakocka' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/metakocka/products/sync/:id
 * Sync a single product with Metakocka
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get product ID from URL
    const productId = params.id;
    
    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }
    
    // Get product
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('user_id', session.user.id)
      .single();
    
    if (error || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }
    
    // Sync product
    try {
      const metakockaId = await ProductSyncService.syncProductToMetakocka(
        session.user.id,
        product
      );
      
      return NextResponse.json({
        success: true,
        metakockaId,
      });
    } catch (error) {
      if (error instanceof MetakockaError) {
        return NextResponse.json(
          { 
            success: false,
            error: error.message,
            type: error.type,
            code: error.code
          },
          { status: 400 }
        );
      }
      
      throw error;
    }
  } catch (error) {
    console.error('Error syncing product with Metakocka:', error);
    
    return NextResponse.json(
      { error: 'Failed to sync product with Metakocka' },
      { status: 500 }
    );
  }
}
