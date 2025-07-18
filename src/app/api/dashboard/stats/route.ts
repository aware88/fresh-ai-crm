import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Check if user is authenticated using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = (session.user as any)?.organizationId || userId;

    // Create Supabase client for database queries (using newer SSR package)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    );
    
    // Initialize default values
    let unreadEmails = 0;
    let upcomingTasks = 0;
    let newMessages = 0;
    let completedOrders = 0;
    let prevUnreadEmails = 0;
    let prevUpcomingTasks = 0;
    let prevNewMessages = 0;
    let prevCompletedOrders = 0;

    try {
      // Get dashboard statistics in parallel with error handling for each query
      const [
        unreadEmailsResult,
        upcomingTasksResult,
        newMessagesResult,
        completedOrdersResult
      ] = await Promise.allSettled([
        // Count unread emails from email queue or emails table
        supabase
          .from('email_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('user_id', userId),
        
        // Count upcoming tasks from interactions or a tasks table
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'task')
          .eq('created_by', userId)
          .is('completed_at', null),
        
        // Count new messages from recent interactions
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'message')
          .eq('created_by', userId)
          .gte('createdat', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()), // Last 24 hours
        
        // Count completed orders/sales documents
        supabase
          .from('sales_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('user_id', userId)
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
      ]);

      // Process results with error handling
      if (unreadEmailsResult.status === 'fulfilled' && unreadEmailsResult.value.data !== null) {
        unreadEmails = unreadEmailsResult.value.count || 0;
      }
      if (upcomingTasksResult.status === 'fulfilled' && upcomingTasksResult.value.data !== null) {
        upcomingTasks = upcomingTasksResult.value.count || 0;
      }
      if (newMessagesResult.status === 'fulfilled' && newMessagesResult.value.data !== null) {
        newMessages = newMessagesResult.value.count || 0;
      }
      if (completedOrdersResult.status === 'fulfilled' && completedOrdersResult.value.data !== null) {
        completedOrders = completedOrdersResult.value.count || 0;
      }

      // Get previous period data for calculating changes
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

      const [
        prevUnreadEmailsResult,
        prevUpcomingTasksResult,
        prevNewMessagesResult,
        prevCompletedOrdersResult
      ] = await Promise.allSettled([
        // Previous period unread emails (check email creation date)
        supabase
          .from('email_queue')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('user_id', userId)
          .lt('created_at', thirtyDaysAgo.toISOString()),
        
        // Previous period tasks
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'task')
          .eq('created_by', userId)
          .is('completed_at', null)
          .lt('createdat', thirtyDaysAgo.toISOString()),
        
        // Previous period messages
        supabase
          .from('interactions')
          .select('id', { count: 'exact', head: true })
          .eq('type', 'message')
          .eq('created_by', userId)
          .gte('createdat', sixtyDaysAgo.toISOString())
          .lt('createdat', thirtyDaysAgo.toISOString()),
        
        // Previous period completed orders
        supabase
          .from('sales_documents')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'completed')
          .eq('user_id', userId)
          .gte('created_at', sixtyDaysAgo.toISOString())
          .lt('created_at', thirtyDaysAgo.toISOString())
      ]);

      // Process previous period results with error handling
      if (prevUnreadEmailsResult.status === 'fulfilled' && prevUnreadEmailsResult.value.data !== null) {
        prevUnreadEmails = prevUnreadEmailsResult.value.count || 0;
      }
      if (prevUpcomingTasksResult.status === 'fulfilled' && prevUpcomingTasksResult.value.data !== null) {
        prevUpcomingTasks = prevUpcomingTasksResult.value.count || 0;
      }
      if (prevNewMessagesResult.status === 'fulfilled' && prevNewMessagesResult.value.data !== null) {
        prevNewMessages = prevNewMessagesResult.value.count || 0;
      }
      if (prevCompletedOrdersResult.status === 'fulfilled' && prevCompletedOrdersResult.value.data !== null) {
        prevCompletedOrders = prevCompletedOrdersResult.value.count || 0;
      }

    } catch (dbError) {
      console.warn('Some database queries failed, using fallback data:', dbError);
      // Continue with default values (all zeros)
    }

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      const sign = change >= 0 ? '+' : '';
      return `${sign}${change.toFixed(1)}%`;
    };

    const calculateChangeType = (current: number, previous: number): 'positive' | 'negative' | 'neutral' => {
      if (current > previous) return 'positive';
      if (current < previous) return 'negative';
      return 'neutral';
    };

    // Return the dashboard statistics
    const stats = [
      {
        name: 'Unread Emails',
        value: unreadEmails.toString(),
        change: calculateChange(unreadEmails, prevUnreadEmails),
        changeType: calculateChangeType(unreadEmails, prevUnreadEmails)
      },
      {
        name: 'Upcoming Tasks',
        value: upcomingTasks.toString(),
        change: calculateChange(upcomingTasks, prevUpcomingTasks),
        changeType: calculateChangeType(upcomingTasks, prevUpcomingTasks)
      },
      {
        name: 'New Messages',
        value: newMessages.toString(),
        change: calculateChange(newMessages, prevNewMessages),
        changeType: calculateChangeType(newMessages, prevNewMessages)
      },
      {
        name: 'Completed Orders',
        value: completedOrders.toString(),
        change: calculateChange(completedOrders, prevCompletedOrders),
        changeType: calculateChangeType(completedOrders, prevCompletedOrders)
      }
    ];

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    
    // Return fallback data instead of error
    const fallbackStats = [
      {
        name: 'Unread Emails',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      },
      {
        name: 'Upcoming Tasks',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      },
      {
        name: 'New Messages',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      },
      {
        name: 'Completed Orders',
        value: '0',
        change: '0%',
        changeType: 'neutral' as const
      }
    ];

    return NextResponse.json(fallbackStats);
  }
} 