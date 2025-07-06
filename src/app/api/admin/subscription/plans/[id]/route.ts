import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/lib/services/subscription-service';

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  // For example, query the database to check if the user has admin role
  return true;
}

// GET /api/admin/subscription/plans/[id] - Get a specific subscription plan
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    
    const subscriptionService = new SubscriptionService();
    const plan = await subscriptionService.getSubscriptionPlanById(id);
    
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    return NextResponse.json({ plan });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plan' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subscription/plans/[id] - Update a subscription plan
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    const { plan } = await req.json();
    
    if (!plan || !plan.name || typeof plan.price !== 'number') {
      return NextResponse.json(
        { error: 'Invalid plan data. Name and price are required.' },
        { status: 400 }
      );
    }
    
    const subscriptionService = new SubscriptionService();
    
    // Check if plan exists
    const existingPlan = await subscriptionService.getSubscriptionPlanById(id);
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Update plan
    const updatedPlan = await subscriptionService.updateSubscriptionPlan(id, {
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billing_interval: plan.billing_interval || 'monthly',
      features: plan.features || {},
      is_active: plan.is_active !== undefined ? plan.is_active : true
    });
    
    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/subscription/plans/[id] - Partially update a subscription plan (e.g., toggle active status)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    const updates = await req.json();
    
    const subscriptionService = new SubscriptionService();
    
    // Check if plan exists
    const existingPlan = await subscriptionService.getSubscriptionPlanById(id);
    if (!existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Apply partial updates
    const updatedPlan = await subscriptionService.updateSubscriptionPlan(id, {
      ...existingPlan,
      ...updates
    });
    
    return NextResponse.json({ plan: updatedPlan });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to update subscription plan' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/subscription/plans/[id] - Delete a subscription plan
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    const { id } = params;
    
    const subscriptionService = new SubscriptionService();
    
    // Instead of deleting, we'll just deactivate the plan
    // This is safer and preserves historical data
    await subscriptionService.updateSubscriptionPlan(id, { is_active: false });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate subscription plan' },
      { status: 500 }
    );
  }
}
