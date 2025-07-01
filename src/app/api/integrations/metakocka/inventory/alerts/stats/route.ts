import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlertService } from '@/lib/services/inventory-alert-service';

export async function GET() {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const stats = await InventoryAlertService.getAlertStats(session.user.id);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching alert statistics:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch alert statistics' },
      { status: 500 }
    );
  }
}
