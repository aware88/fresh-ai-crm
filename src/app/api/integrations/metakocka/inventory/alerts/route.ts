import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlertService } from '@/lib/services/inventory-alert-service';

export async function GET() {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alerts = await InventoryAlertService.getAlerts(session.user.id);
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Error fetching inventory alerts:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch inventory alerts' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alertData = await request.json();
    const newAlert = await InventoryAlertService.createAlert(session.user.id, alertData);
    
    return NextResponse.json(newAlert, { status: 201 });
  } catch (error) {
    console.error('Error creating inventory alert:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inventory alert' },
      { status: 400 }
    );
  }
}
