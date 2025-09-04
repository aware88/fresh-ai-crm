import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InventoryService } from '@/lib/integrations/metakocka/inventory-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { productId } = await params;
    
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // Sync inventory for the specific product
    const result = await InventoryService.syncProductInventoryFromMetakocka(
      session.user.id,
      productId
    );
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        productId,
        data: result.data,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          productId,
          error: result.error,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error(`Error in inventory sync for product:`, error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync inventory for product',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
