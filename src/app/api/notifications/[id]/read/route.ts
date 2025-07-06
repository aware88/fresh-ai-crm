import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * POST handler to mark a notification as read
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const notificationId = params.id;
    const notificationService = new NotificationService();
    
    // Mark the notification as read
    const { success, error } = await notificationService.markNotificationAsRead(notificationId);
    
    if (!success || error) {
      console.error('Error marking notification as read:', error);
      return NextResponse.json({ error: 'Failed to mark notification as read' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark notification as read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
