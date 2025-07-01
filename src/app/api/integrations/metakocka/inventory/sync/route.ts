import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InventoryService } from '@/lib/integrations/metakocka/inventory-service';

export async function POST() {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await InventoryService.syncInventoryFromMetakocka(session.user.id);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: result.message,
        syncedCount: result.syncedCount,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: result.message,
          errorCount: result.errorCount,
          errors: result.errors,
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error in inventory sync:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to sync inventory',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
