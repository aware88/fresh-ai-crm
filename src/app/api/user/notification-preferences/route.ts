import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NotificationPreferencesService } from '@/lib/services/notification-preferences-service';

// GET /api/user/notification-preferences
export async function GET(req: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const preferencesService = new NotificationPreferencesService();
    
    // Get user's notification preferences
    const { data: preferences, error } = await preferencesService.getUserPreferences(userId);
    
    if (error) {
      console.error('Error fetching notification preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch notification preferences' }, { status: 500 });
    }
    
    // Get all available notification types
    const { data: templates, error: templatesError } = await preferencesService.getNotificationTemplates();
    
    if (templatesError) {
      console.error('Error fetching notification templates:', templatesError);
      return NextResponse.json({ error: 'Failed to fetch notification templates' }, { status: 500 });
    }
    
    // Group templates by category
    const groupedTemplates = templates?.reduce((acc, template) => {
      const type = template.type;
      let category = 'System';
      
      if (type.startsWith('subscription_')) {
        category = 'Subscription';
      } else if (type.startsWith('metakocka_')) {
        category = 'Metakocka';
      } else if (type.includes('domain_') || type.includes('branding_')) {
        category = 'White-label';
      } else if (type.startsWith('user_')) {
        category = 'User';
      }
      
      if (!acc[category]) {
        acc[category] = [];
      }
      
      acc[category].push({
        ...template,
        // Find user preference if it exists
        preference: preferences?.find(p => p.notification_type === type) || {
          notification_type: type,
          email_enabled: true,
          in_app_enabled: true
        }
      });
      
      return acc;
    }, {} as Record<string, any[]>) || {};
    
    return NextResponse.json({ categories: groupedTemplates });
  } catch (error) {
    console.error('Error in notification preferences API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/user/notification-preferences
export async function PUT(req: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const preferencesService = new NotificationPreferencesService();
    
    // Get request body
    const body = await req.json();
    const { preferences } = body;
    
    if (!preferences || !Array.isArray(preferences)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    // Ensure all preferences belong to the current user
    const validatedPreferences = preferences.map(pref => ({
      ...pref,
      user_id: userId
    }));
    
    // Update preferences
    const { data, error } = await preferencesService.upsertPreferences(validatedPreferences);
    
    if (error) {
      console.error('Error updating notification preferences:', error);
      return NextResponse.json({ error: 'Failed to update notification preferences' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error in notification preferences API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
