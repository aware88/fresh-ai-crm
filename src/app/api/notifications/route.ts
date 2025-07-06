import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * GET handler to fetch user notifications
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const notificationService = new NotificationService();
    
    // Get limit from query params or use default
    const url = new URL(req.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    
    const { data, error } = await notificationService.getUserNotifications(userId, limit);
    
    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in notifications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
