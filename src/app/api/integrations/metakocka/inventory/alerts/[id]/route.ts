import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlertService } from '@/lib/services/inventory-alert-service';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alert = await InventoryAlertService.getAlertById(session.user.id, params.id);
    
    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    }

    return NextResponse.json(alert);
  } catch (error) {
    console.error(`Error fetching inventory alert ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch inventory alert' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const updates = await request.json();
    const updatedAlert = await InventoryAlertService.updateAlert(
      session.user.id,
      params.id,
      updates
    );
    
    return NextResponse.json(updatedAlert);
  } catch (error) {
    console.error(`Error updating inventory alert ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update inventory alert' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await InventoryAlertService.deleteAlert(session.user.id, params.id);
    
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(`Error deleting inventory alert ${params.id}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete inventory alert' },
      { status: 400 }
    );
  }
}
