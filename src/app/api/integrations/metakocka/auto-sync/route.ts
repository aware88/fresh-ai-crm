/**
 * API endpoint for controlling Metakocka automatic sync
 */
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { AutoSyncManager, AutoSyncConfig, initializeAutoSync, stopAutoSync, triggerManualSync } from '@/lib/integrations/metakocka/auto-sync';

/**
 * GET /api/integrations/metakocka/auto-sync
 * Get current auto-sync status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const syncManager = AutoSyncManager.getInstance();
    const status = syncManager.getSyncStatus();

    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting auto-sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get auto-sync status' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/metakocka/auto-sync
 * Start or configure automatic sync
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, config } = body;

    if (action === 'start') {
      await initializeAutoSync(session.user.id, config);
      return NextResponse.json({ success: true, message: 'Auto-sync started' });
    } else if (action === 'stop') {
      stopAutoSync(session.user.id);
      return NextResponse.json({ success: true, message: 'Auto-sync stopped' });
    } else if (action === 'configure') {
      const syncManager = AutoSyncManager.getInstance();
      syncManager.updateConfig(config);
      return NextResponse.json({ success: true, message: 'Auto-sync configured' });
    } else if (action === 'manual-sync') {
      // Trigger immediate sync
      await triggerManualSync(session.user.id);
      return NextResponse.json({ success: true, message: 'Manual sync completed successfully' });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error controlling auto-sync:', error);
    return NextResponse.json(
      { error: 'Failed to control auto-sync' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/metakocka/auto-sync
 * Stop automatic sync
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    stopAutoSync(session.user.id);
    return NextResponse.json({ success: true, message: 'Auto-sync stopped' });
  } catch (error) {
    console.error('Error stopping auto-sync:', error);
    return NextResponse.json(
      { error: 'Failed to stop auto-sync' },
      { status: 500 }
    );
  }
} 