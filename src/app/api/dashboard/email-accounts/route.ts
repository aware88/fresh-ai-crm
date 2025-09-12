import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/dashboard/email-accounts
 * Returns the count of email accounts for the dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    
    // Simple count query - RLS will handle access control
    const { count, error } = await supabase
      .from('email_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', session.user.id);
    
    if (error) {
      console.error('Error fetching email accounts count:', error);
      return NextResponse.json({ count: 0 });
    }
    
    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Error in email accounts API:', error);
    return NextResponse.json({ count: 0 });
  }
}
