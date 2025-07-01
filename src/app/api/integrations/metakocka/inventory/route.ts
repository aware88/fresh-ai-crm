/**
 * API endpoints for Metakocka inventory operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { InventoryService } from '@/lib/integrations/metakocka/inventory-service';

/**
 * GET /api/integrations/metakocka/inventory
 * Get inventory data for products
 * 
 * Query parameters:
 * - productId: Optional product ID to get inventory for a specific product
 * - productIds: Optional comma-separated list of product IDs
 * 
 * If neither productId nor productIds are provided, returns inventory for all products
 */
export async function GET(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    
    // Check if we're getting inventory for a specific product
    const productId = searchParams.get('productId');
    if (productId) {
      const inventory = await InventoryService.getProductInventory(userId, productId);
      return NextResponse.json(inventory);
    }
    
    // Check if we're getting inventory for multiple products
    const productIdsParam = searchParams.get('productIds');
    if (productIdsParam) {
      const productIds = productIdsParam.split(',');
      const inventory = await InventoryService.getProductsInventory(userId, productIds);
      return NextResponse.json(inventory);
    }
    
    // Get inventory for all products
    const inventory = await InventoryService.getAllProductsInventory(userId);
    return NextResponse.json(inventory);
  } catch (error) {
    console.error('Error getting inventory data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/metakocka/inventory/check
 * Check if products are available in the required quantities
 * 
 * Request body:
 * {
 *   items: [
 *     { productId: string, quantity: number }
 *   ]
 * }
 * 
 * Returns:
 * {
 *   available: boolean,
 *   items: [
 *     { productId: string, quantity: number, available: boolean }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    // Get user session
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get request body
    const body = await request.json();
    const items = body.items || [];
    
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. Expected items array.' },
        { status: 400 }
      );
    }
    
    // Check availability for each item
    const results = [];
    let allAvailable = true;
    
    for (const item of items) {
      const { productId, quantity } = item;
      
      if (!productId || typeof quantity !== 'number' || quantity <= 0) {
        return NextResponse.json(
          { error: 'Invalid item. Each item must have productId and quantity > 0.' },
          { status: 400 }
        );
      }
      
      const available = await InventoryService.isProductAvailable(userId, productId, quantity);
      
      results.push({
        productId,
        quantity,
        available
      });
      
      if (!available) {
        allAvailable = false;
      }
    }
    
    return NextResponse.json({
      available: allAvailable,
      items: results
    });
  } catch (error) {
    console.error('Error checking inventory availability:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
