import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';
import { SubscriptionService } from '@/lib/services/subscription-service';

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  return true;
}

// GET /api/admin/subscription/organizations/[id] - Get a specific organization subscription
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
    
    const { id } = await params;
    
    const supabase = await createClient();
    
    // Get the specific subscription with organization and plan details
    const { data: subscription, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        organization:organizations(*),
        subscription_plan:subscription_plans(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching organization subscription:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization subscription' },
        { status: 500 }
      );
    }
    
    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }
    
    // Get subscription invoices
    const { data: invoices, error: invoicesError } = await supabase
      .from('subscription_invoices')
      .select('*')
      .eq('subscription_id', id)
      .order('created_at', { ascending: false });
    
    if (invoicesError) {
      console.error('Error fetching subscription invoices:', invoicesError);
    }
    
    return NextResponse.json({ 
      subscription,
      invoices: invoices || []
    });
  } catch (error) {
    console.error('Error fetching organization subscription:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization subscription' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/subscription/organizations/[id] - Update a subscription
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
    
    const { id } = await params;
    const updates = await req.json();
    
    const subscriptionService = new SubscriptionService();
    
    // Update the subscription
    const updatedSubscription = await subscriptionService.updateOrganizationSubscription(id, updates);
    
    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error) {
    console.error('Error updating organization subscription:', error);
    return NextResponse.json(
      { error: 'Failed to update organization subscription' },
      { status: 500 }
    );
  }
}
