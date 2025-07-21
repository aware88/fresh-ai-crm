import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createMetakockaClientForUser } from '@/lib/integrations/metakocka';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const metakockaClient = await createMetakockaClientForUser(session.user.id);
    
    if (!metakockaClient) {
      return NextResponse.json({
        success: false,
        error: 'Metakocka not configured. Please set up your credentials in Settings > Integrations > Metakocka.',
        setup_url: '/settings/integrations/metakocka'
      }, { status: 400 });
    }

    // Test connection
    const connectionTest = await metakockaClient.testConnection();
    
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: connectionTest.message,
        suggestion: 'Check your Metakocka credentials and API URL'
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Metakocka integration is working correctly',
      connection_status: connectionTest.message,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metakocka test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      suggestion: 'Check server logs for detailed error information'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, orderNumber } = await request.json();
    
    const metakockaClient = await createMetakockaClientForUser(session.user.id);
    if (!metakockaClient) {
      return NextResponse.json({
        success: false,
        error: 'Metakocka not configured. Please set up your credentials in Settings.'
      }, { status: 400 });
    }

    let results: any = {};

    // Test customer lookup if email provided
    if (email) {
      console.log(`Testing customer lookup for: ${email}`);
      const customer = await metakockaClient.getCustomerByEmail(email);
      results.customer = customer;

      if (customer) {
        const orders = await metakockaClient.getCustomerOrders(email, 5);
        results.customerOrders = orders;
      }
    }

    // Test order lookup if order number provided
    if (orderNumber) {
      console.log(`Testing order lookup for: ${orderNumber}`);
      const order = await metakockaClient.getOrderByNumber(orderNumber);
      results.order = order;
    }

    return NextResponse.json({
      success: true,
      message: 'Metakocka lookup completed',
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Metakocka lookup test error:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Lookup failed',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 