/**
 * API endpoint for managing upsell settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { OrganizationSettingsService } from '@/lib/services/organization-settings-service';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from user session
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const settingsService = new OrganizationSettingsService();
    const config = await settingsService.getUpsellingFrameworkConfig(organizationId);

    return NextResponse.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('[Upsell Settings API] Error fetching settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get organization ID from user session
    const organizationId = session.user.organizationId;
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    const body = await request.json();
    const { config } = body;

    if (!config) {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 });
    }

    const settingsService = new OrganizationSettingsService();
    await settingsService.updateUpsellingFrameworkConfig(organizationId, config);

    return NextResponse.json({
      success: true,
      message: 'Upsell settings updated successfully'
    });

  } catch (error) {
    console.error('[Upsell Settings API] Error updating settings:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
