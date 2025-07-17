import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  try {
    // Create Supabase client with proper cookies handling for Next.js 15+
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = (session.user as any).organizationId || userId;

    // Get dashboard statistics in parallel
    const [
      unreadEmailsResult,
      upcomingTasksResult,
      newMessagesResult,
      completedOrdersResult
    ] = await Promise.all([
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

    // Get previous period data for calculating changes
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

    const [
      prevUnreadEmailsResult,
      prevUpcomingTasksResult,
      prevNewMessagesResult,
      prevCompletedOrdersResult
    ] = await Promise.all([
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

    // Calculate current counts
    const unreadEmails = unreadEmailsResult.count || 0;
    const upcomingTasks = upcomingTasksResult.count || 0;
    const newMessages = newMessagesResult.count || 0;
    const completedOrders = completedOrdersResult.count || 0;

    // Calculate previous counts
    const prevUnreadEmails = prevUnreadEmailsResult.count || 0;
    const prevUpcomingTasks = prevUpcomingTasksResult.count || 0;
    const prevNewMessages = prevNewMessagesResult.count || 0;
    const prevCompletedOrders = prevCompletedOrdersResult.count || 0;

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
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
} 