import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/utils/supabase/server';
import { isAdmin } from '@/utils/auth/admin';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = await createServerClient();
  
  // Check if user is admin
  const isUserAdmin = await isAdmin();
  if (!isUserAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const userId = id;
  if (!userId) {
    return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
  }

  // Get query parameters
  const url = new URL(req.url);
  const page = parseInt(url.searchParams.get('page') || '1');
  const limit = parseInt(url.searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    // Check if user exists
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get activity logs for the user
    const { data: logs, error: logsError } = await supabase
      .from('user_activity_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (logsError) {
      console.error('Error fetching activity logs:', logsError);
      return NextResponse.json({ error: 'Failed to fetch activity logs' }, { status: 500 });
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('user_activity_logs')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (countError) {
      console.error('Error counting activity logs:', countError);
    }

    const hasMore = count ? offset + limit < count : false;

    return NextResponse.json({
      logs,
      page,
      limit,
      total: count || 0,
      has_more: hasMore
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
