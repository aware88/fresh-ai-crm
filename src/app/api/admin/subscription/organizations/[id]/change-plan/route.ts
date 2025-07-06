import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { SubscriptionService } from '@/lib/services/subscription-service';

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  return true;
}

// POST /api/admin/subscription/organizations/[id]/change-plan - Change subscription plan
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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
    const { planId } = await req.json();
    
    if (!planId) {
      return NextResponse.json(
        { error: 'Plan ID is required' },
        { status: 400 }
      );
    }
    
    const subscriptionService = new SubscriptionService();
    
    // Change the subscription plan
    const updatedSubscription = await subscriptionService.changeSubscriptionPlan(id, planId);
    
    return NextResponse.json({ 
      success: true,
      subscription: updatedSubscription 
    });
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    return NextResponse.json(
      { error: 'Failed to change subscription plan' },
      { status: 500 }
    );
  }
}
