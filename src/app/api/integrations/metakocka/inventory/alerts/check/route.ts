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

    const triggeredAlerts = await InventoryAlertService.checkAlerts(session.user.id);
    return NextResponse.json(triggeredAlerts);
  } catch (error) {
    console.error('Error checking inventory alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check inventory alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { alertId } = await request.json();
    
    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 });
    }

    // Acknowledge the alert
    await supabase.rpc('acknowledge_inventory_ert', {
      p_alert_id: alertId,
      p_user_id: session.user.id
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error acknowledging inventory alert:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to acknowledge inventory alert' },
      { status: 500 }
    );
  }
}
