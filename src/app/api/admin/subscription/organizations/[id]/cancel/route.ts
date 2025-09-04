import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/lib/services/subscription-service';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  return true;
}

// POST /api/admin/subscription/organizations/[id]/cancel - Cancel subscription
export async function POST(req: NextRequest, { params }: RouteParams) {
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
    const { cancelAtPeriodEnd = true } = await req.json();
    
    const subscriptionService = new SubscriptionService();
    
    // Cancel the subscription
    const updatedSubscription = await subscriptionService.cancelSubscription(id, cancelAtPeriodEnd);
    
    return NextResponse.json({ 
      success: true,
      subscription: updatedSubscription 
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}