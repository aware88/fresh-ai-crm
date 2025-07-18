import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@supabase/ssr';
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
    
    const activities: ActivityItem[] = [];

    try {
      // Get recent activities from multiple sources with error handling
      const [
        emailActivities,
        orderActivities,
        agentActivities,
        interactionActivities,
        userActivities
      ] = await Promise.allSettled([
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

      // Process email activities
      if (emailActivities.status === 'fulfilled' && emailActivities.value.data) {
        emailActivities.value.data.forEach(email => {
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
      if (orderActivities.status === 'fulfilled' && orderActivities.value.data) {
        orderActivities.value.data.forEach(order => {
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
      if (agentActivities.status === 'fulfilled' && agentActivities.value.data) {
        agentActivities.value.data.forEach(activity => {
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
      if (interactionActivities.status === 'fulfilled' && interactionActivities.value.data) {
        interactionActivities.value.data.forEach(interaction => {
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
      if (userActivities.status === 'fulfilled' && userActivities.value.data) {
        userActivities.value.data.forEach(activity => {
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

    } catch (dbError) {
      console.warn('Some database queries failed for activities:', dbError);
      // Continue with empty activities array
    }

    // Sort all activities by timestamp (most recent first)
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Return the top 10 most recent activities
    const recentActivities = activities.slice(0, 10);

    return NextResponse.json(recentActivities);
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    
    // Return fallback data instead of error
    const fallbackActivities: ActivityItem[] = [
      {
        id: 'welcome-1',
        type: 'task',
        title: 'Welcome to your dashboard!',
        description: 'Start by exploring the quick actions below',
        timestamp: new Date().toISOString(),
        icon: 'Activity',
        color: 'blue'
      }
    ];

    return NextResponse.json(fallbackActivities);
  }
} 