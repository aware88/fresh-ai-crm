import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

interface ActivityItem {
  id: string;
  type: 'email' | 'order' | 'ai_agent' | 'interaction' | 'task';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

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

    // Get recent activities from multiple sources
    const [
      emailActivities,
      orderActivities,
      agentActivities,
      interactionActivities,
      userActivities
    ] = await Promise.all([
      // Recent email activities
      supabase
        .from('email_queue')
        .select('id, status, created_at, emails(subject, sender)')
        .eq('user_id', userId)
        .in('status', ['completed', 'requires_review'])
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent order/sales document activities
      supabase
        .from('sales_documents')
        .select('id, status, total_amount, created_at, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(5),
      
      // Recent AI agent activities (if table exists)
      supabase
        .from('user_activity_logs')
        .select('id, action, entity_type, entity_id, created_at, details')
        .eq('user_id', userId)
        .eq('entity_type', 'ai_agent')
        .order('created_at', { ascending: false })
        .limit(5),
      
      // Recent interactions
      supabase
        .from('interactions')
        .select('id, type, title, content, createdat, contacts(name)')
        .eq('created_by', userId)
        .order('createdat', { ascending: false })
        .limit(5),
      
      // Recent user activity logs
      supabase
        .from('user_activity_logs')
        .select('id, action, entity_type, entity_id, created_at, details')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
    ]);

    const activities: ActivityItem[] = [];

    // Process email activities
    if (emailActivities.data) {
      emailActivities.data.forEach(email => {
        const emailData = email.emails as any;
        activities.push({
          id: `email-${email.id}`,
          type: 'email',
          title: email.status === 'completed' ? 'Email processed successfully' : 'Email requires review',
          description: emailData?.subject || 'New email activity',
          timestamp: email.created_at,
          icon: 'Mail',
          color: email.status === 'completed' ? 'blue' : 'yellow'
        });
      });
    }

    // Process order activities
    if (orderActivities.data) {
      orderActivities.data.forEach(order => {
        let title = 'Sales document updated';
        if (order.status === 'completed') {
          title = 'Order completed successfully';
        } else if (order.status === 'pending') {
          title = 'New order created';
        }

        activities.push({
          id: `order-${order.id}`,
          type: 'order',
          title,
          description: `Sales document ${order.total_amount ? `worth $${order.total_amount}` : 'processed'}`,
          timestamp: order.updated_at || order.created_at,
          icon: 'CheckCircle',
          color: order.status === 'completed' ? 'green' : 'blue'
        });
      });
    }

    // Process AI agent activities
    if (agentActivities.data) {
      agentActivities.data.forEach(activity => {
        const details = activity.details as any;
        activities.push({
          id: `agent-${activity.id}`,
          type: 'ai_agent',
          title: `AI agent ${activity.action}`,
          description: details?.description || `AI agent performed ${activity.action}`,
          timestamp: activity.created_at,
          icon: 'Brain',
          color: 'purple'
        });
      });
    }

    // Process interaction activities
    if (interactionActivities.data) {
      interactionActivities.data.forEach(interaction => {
        const contactData = interaction.contacts as any;
        activities.push({
          id: `interaction-${interaction.id}`,
          type: 'interaction',
          title: interaction.title || `New ${interaction.type}`,
          description: contactData?.name ? `With ${contactData.name}` : interaction.content?.substring(0, 50) || 'New interaction',
          timestamp: interaction.createdat,
          icon: interaction.type === 'email' ? 'Mail' : 'MessageSquare',
          color: 'indigo'
        });
      });
    }

    // Process general user activities
    if (userActivities.data) {
      userActivities.data.forEach(activity => {
        // Skip AI agent activities as they're already processed
        if (activity.entity_type === 'ai_agent') return;

        const details = activity.details as any;
        let title = `${activity.action} ${activity.entity_type}`;
        let description = details?.description || `User performed ${activity.action} on ${activity.entity_type}`;
        let icon = 'Activity';
        let color = 'gray';

        // Customize based on action and entity type
        if (activity.entity_type === 'contact') {
          icon = 'Users';
          color = 'green';
          if (activity.action === 'create') {
            title = 'New contact added';
            description = details?.name || 'New contact created';
          }
        } else if (activity.entity_type === 'product') {
          icon = 'Package';
          color = 'teal';
          if (activity.action === 'create') {
            title = 'New product added';
            description = details?.name || 'New product created';
          }
        }

        activities.push({
          id: `activity-${activity.id}`,
          type: 'task',
          title,
          description,
          timestamp: activity.created_at,
          icon,
          color
        });
      });
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the top 10 most recent activities
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json(recentActivities);
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard activities' },
      { status: 500 }
    );
  }
} 