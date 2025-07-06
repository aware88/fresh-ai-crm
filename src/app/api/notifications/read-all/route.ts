import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST handler to mark all notifications as read
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const notificationService = new NotificationService();
    
    // Mark all notifications as read
    const { success, error } = await notificationService.markAllNotificationsAsRead(userId);
    
    if (!success || error) {
      console.error('Error marking all notifications as read:', error);
      return NextResponse.json({ error: 'Failed to mark all notifications as read' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark all notifications as read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
