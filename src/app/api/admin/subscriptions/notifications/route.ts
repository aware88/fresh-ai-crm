import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionNotificationService } from '@/lib/services/subscription-notification-service';
import { getServerSession } from 'next-auth';

// Check if user is an admin
async function isAdmin(session: any) {
  return session?.user?.role === 'admin';
}

/**
 * API handler for subscription notifications
 * This endpoint is used to trigger notification jobs
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin authorization
    const admin = await isAdmin(session);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json();
    const { type } = body;

    const notificationService = new SubscriptionNotificationService();
    let result;

    switch (type) {
      case 'trial_expiration':
        result = await notificationService.sendTrialExpirationNotifications();
        break;
      case 'renewal_reminder':
        result = await notificationService.sendRenewalReminders();
        break;
      default:
        return NextResponse.json({ error: `Invalid notification type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      type,
      result
    });
  } catch (error: any) {
    console.error('Error processing subscription notifications:', error);
    return NextResponse.json(
      { 
        error: `Failed to send notifications: ${error.message}`,
        type: type
      },
      { status: 500 }
    );
  }
}
