import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';

// Helper function to check if user is an admin
async function isAdmin(userId: string) {
  // This is a placeholder - implement your actual admin check logic
  return true;
}

// GET /api/admin/subscription/organizations - Get all organization subscriptions
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
    
    const supabase = createClient();
    
    // Get all organization subscriptions with organization and plan details
    const { data: subscriptions, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        organization:organizations(*),
        subscription_plan:subscription_plans(*)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching organization subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch organization subscriptions' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ subscriptions });
  } catch (error) {
    console.error('Error fetching organization subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization subscriptions' },
      { status: 500 }
    );
  }
}
