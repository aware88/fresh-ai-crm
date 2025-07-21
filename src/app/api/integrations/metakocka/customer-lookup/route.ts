import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createMetakockaClientForUser } from '@/lib/integrations/metakocka';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Get user's Metakocka client
    const metakockaClient = await createMetakockaClientForUser(session.user.id);
    if (!metakockaClient) {
      return NextResponse.json({ 
        error: 'Metakocka not configured. Please set up your Metakocka credentials in Settings.' 
      }, { status: 400 });
    }

    try {
      // Look up customer by email
      const customer = await metakockaClient.getCustomerByEmail(email);
      
      if (!customer) {
        return NextResponse.json({ 
          customer: null,
          message: 'Customer not found in Metakocka' 
        }, { status: 404 });
      }

      // Get customer's recent orders
      const orders = await metakockaClient.getCustomerOrders(email, 5);

      return NextResponse.json({
        success: true,
        customer: {
          id: customer.id,
          email: customer.email,
          name: customer.name,
          totalOrders: customer.totalOrders,
          lastOrderDate: customer.lastOrderDate,
          status: customer.status
        },
        orders: orders.slice(0, 5), // Limit to 5 most recent orders
        message: `Found customer with ${customer.totalOrders} orders`
      });

    } catch (metakockaError) {
      console.error('Metakocka API error:', metakockaError);
      
      return NextResponse.json({
        error: 'Failed to connect to Metakocka. Please check your credentials.',
        details: metakockaError instanceof Error ? metakockaError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Customer lookup error:', error);
    
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 