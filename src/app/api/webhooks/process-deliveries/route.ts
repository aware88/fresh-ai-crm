import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhookDeliveryService } from '@/lib/services/webhook-delivery-service';

/**
 * POST /api/webhooks/process-deliveries
 * Process pending webhook deliveries
 * This endpoint is admin-only and can be triggered by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body to determine how many deliveries to process
    const body = await request.json();
    const { limit = 50 } = body;

    // Process pending webhook deliveries
    const result = await WebhookDeliveryService.processPendingDeliveries(limit);

    return NextResponse.json({
      message: 'Webhook deliveries processed',
      ...result
    });
  } catch (error) {
    console.error('Error processing webhook deliveries:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook deliveries' },
      { status: 500 }
    );
  }
}
