import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/lib/services/subscription-service';

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  // For example, query the database to check if the user has admin role
  // For now, we'll just return true for demonstration purposes
  return true;
}

// GET /api/admin/subscription/plans - Get all subscription plans (including inactive)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    
    // Check if user is admin
    const admin = await isAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const subscriptionService = new SubscriptionService();
    const plans = await subscriptionService.getAllSubscriptionPlans(true); // Include inactive plans
    
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}

// POST /api/admin/subscription/plans - Create a new subscription plan
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = (session.user as any).id;
    
    // Check if user is admin
    const admin = await isAdmin(userId);
    if (!admin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { plan } = await req.json();
    
    if (!plan || !plan.name || typeof plan.price !== 'number') {
      return NextResponse.json(
        { error: 'Invalid plan data. Name and price are required.' },
        { status: 400 }
      );
    }
    
    const subscriptionService = new SubscriptionService();
    const newPlan = await subscriptionService.createSubscriptionPlan({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billing_interval: plan.billing_interval || 'monthly',
      features: plan.features || {},
      is_active: plan.is_active !== undefined ? plan.is_active : true
    });
    
    return NextResponse.json({ plan: newPlan }, { status: 201 });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription plan' },
      { status: 500 }
    );
  }
}
