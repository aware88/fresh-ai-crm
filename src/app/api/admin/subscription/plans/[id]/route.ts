import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService, SubscriptionPlan } from '@/lib/services/subscription-service';
import { SubscriptionServiceAdmin } from '@/lib/services/subscription-service-admin';
import { RoleService } from '@/services/role-service';

// GET /api/admin/subscription/plans/[id] - Get a specific subscription plan
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Check if user is admin using RoleService
    const isSystemAdmin = await RoleService.isSystemAdmin(userId);
    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    
    const subscriptionService = new SubscriptionService();
    const { data: plan, error } = await subscriptionService.getSubscriptionPlanById(id);
    
    if (error || !plan) {
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
    
    const userId = session.user.id;
    
    // Check if user is admin using RoleService
    const isSystemAdmin = await RoleService.isSystemAdmin(userId);
    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    const { plan } = await req.json();
    
    if (!plan || !plan.name || typeof plan.price !== 'number') {
      return NextResponse.json(
        { error: 'Invalid plan data. Name and price are required.' },
        { status: 400 }
      );
    }
    
    const subscriptionServiceAdmin = new SubscriptionServiceAdmin();
    
    // Check if plan exists
    const subscriptionService = new SubscriptionService();
    const { data: existingPlan, error: planError } = await subscriptionService.getSubscriptionPlanById(id);
    if (planError || !existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Update plan - using correct properties for SubscriptionPlan interface
    const updatedPlan = await subscriptionServiceAdmin.updateSubscriptionPlan(id, {
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
    
    const userId = session.user.id;
    
    // Check if user is admin using RoleService
    const isSystemAdmin = await RoleService.isSystemAdmin(userId);
    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    const updates = await req.json();
    
    const subscriptionServiceAdmin = new SubscriptionServiceAdmin();
    
    // Check if plan exists
    const subscriptionService = new SubscriptionService();
    const { data: existingPlan, error: planError } = await subscriptionService.getSubscriptionPlanById(id);
    if (planError || !existingPlan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }
    
    // Apply partial updates - filter out invalid properties
    const validUpdates: Partial<SubscriptionPlan> = {};
    const validKeys = ['name', 'description', 'price', 'billing_interval', 'features', 'is_active'];
    
    Object.keys(updates).forEach(key => {
      if (validKeys.includes(key)) {
        (validUpdates as any)[key] = updates[key];
      }
    });
    
    const updatedPlan = await subscriptionServiceAdmin.updateSubscriptionPlan(id, validUpdates);
    
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
    
    const userId = session.user.id;
    
    // Check if user is admin using RoleService
    const isSystemAdmin = await RoleService.isSystemAdmin(userId);
    if (!isSystemAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id } = await params;
    
    const subscriptionServiceAdmin = new SubscriptionServiceAdmin();
    
    // Instead of deleting, we'll just deactivate the plan
    // This is safer and preserves historical data
    const updatedPlan = await subscriptionServiceAdmin.updateSubscriptionPlan(id, { is_active: false });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deactivating subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to deactivate subscription plan' },
      { status: 500 }
    );
  }
}