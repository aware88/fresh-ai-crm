import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationJobs } from '@/lib/jobs/notification-jobs';

// This endpoint runs notification jobs manually or can be triggered by a cron job
export async function POST(request: Request) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body to determine which jobs to run
    const body = await request.json();
    const { jobs = ['all'] } = body;
    
    const notificationJobs = new NotificationJobs();
    const results: Record<string, any> = {};
    
    // Run renewal reminder job
    if (jobs.includes('all') || jobs.includes('renewal_reminders')) {
      results.renewalReminders = await notificationJobs.processRenewalReminders();
    }
    
    // Run trial ending reminder job
    if (jobs.includes('all') || jobs.includes('trial_ending_reminders')) {
      results.trialEndingReminders = await notificationJobs.processTrialEndingReminders();
    }
    
    // Run payment failure notification job
    if (jobs.includes('all') || jobs.includes('payment_failure_notifications')) {
      results.paymentFailureNotifications = await notificationJobs.processPaymentFailureNotifications();
    }
    
    // Calculate total processed and errors
    const totals = {
      processed: Object.values(results).reduce((sum: number, result: any) => sum + result.processed, 0),
      errors: Object.values(results).reduce((sum: number, result: any) => sum + result.errors, 0)
    };
    
    return NextResponse.json({
      message: 'Notification jobs completed',
      results,
      totals
    });
  } catch (error) {
    console.error('Error running notification jobs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
