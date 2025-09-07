import { NextRequest, NextResponse } from 'next/server';
import { getMagentoClient } from '@/lib/integrations/magento/magento-api-client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createLazyServerClient } from '@/lib/supabase/lazy-client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    console.log(`[Magento API] Fetching orders for email: ${email}`);

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
    
    // Fetch orders by email
    const orders = await magentoClient.getOrdersByEmail(email);
    
    console.log(`[Magento API] Found ${orders.length} orders for ${email}`);

    return NextResponse.json({ 
      success: true,
      orders,
      count: orders.length
    });
  } catch (error: any) {
    console.error('[Magento API] Error fetching orders:', error);
    
    // Handle specific error types
    if (error.message.includes('Failed to load Magento connection settings')) {
      return NextResponse.json({ 
        error: 'Magento integration not configured',
        details: 'Please configure Magento API credentials in settings'
      }, { status: 400 });
    }
    
    if (error.message.includes('401') || error.message.includes('Authentication')) {
      return NextResponse.json({ 
        error: 'Magento authentication failed',
        details: 'Please check API credentials'
      }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Failed to fetch orders from Magento',
      details: error.message
    }, { status: 500 });
  }
}


