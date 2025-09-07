import { NextRequest, NextResponse } from 'next/server';
import { getMagentoClient } from '@/lib/integrations/magento/magento-api-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('[Magento Test] Testing Magento connection...');

    // Get user's organization
    const supabase = createLazyServerClient();
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('email', session.user.email)
      .single();

    if (!userProfile?.current_organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get Magento client for this organization
    const magentoClient = await getMagentoClient(userProfile.current_organization_id);
    
    // Test the connection
    const testResult = await magentoClient.testConnection();
    
    console.log('[Magento Test] Connection test result:', testResult);

    if (testResult.success) {
      return NextResponse.json({
        success: true,
        message: testResult.message,
        data: testResult.data,
        timestamp: new Date().toISOString()
      });
    } else {
      return NextResponse.json({
        success: false,
        message: testResult.message,
        data: testResult.data,
        timestamp: new Date().toISOString()
      }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Magento Test] Connection test failed:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Connection test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const supabase = createLazyServerClient();
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('current_organization_id')
      .eq('email', session.user.email)
      .single();

    if (!userProfile?.current_organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 });
    }

    // Get Magento connection settings
    const { data: settings, error } = await supabase
      .from('magento_connection_settings')
      .select('api_url, api_user, store_id, is_active, created_at, updated_at')
      .eq('organization_id', userProfile.current_organization_id)
      .eq('is_active', true)
      .single();

    if (error || !settings) {
      return NextResponse.json({
        configured: false,
        message: 'Magento integration not configured'
      });
    }

    return NextResponse.json({
      configured: true,
      settings: {
        apiUrl: settings.api_url,
        apiUser: settings.api_user,
        storeId: settings.store_id,
        isActive: settings.is_active,
        createdAt: settings.created_at,
        updatedAt: settings.updated_at
      }
    });
  } catch (error: any) {
    console.error('[Magento Test] Error checking configuration:', error);
    
    return NextResponse.json({
      configured: false,
      message: 'Error checking configuration',
      error: error.message
    }, { status: 500 });
  }
}


