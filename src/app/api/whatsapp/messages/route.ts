import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createLazyServiceRoleClient } from '@/lib/supabase/lazy-client';

// GET /api/whatsapp/messages?contactId=...&limit=50&offset=0
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const contactId = searchParams.get('contactId');
    if (!contactId) return NextResponse.json({ error: 'contactId required' }, { status: 400 });
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const supabase = await createLazyServiceRoleClient();
    const { data, error } = await supabase
      .from('interactions')
      .select('*')
      .eq('contact_id', contactId)
      .order('interaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Messages fetch error:', error);
      return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 });
    }

    const whatsappMessages = (data || []).filter((i: any) => i?.metadata?.channel === 'whatsapp');
    return NextResponse.json({ messages: whatsappMessages });
  } catch (error) {
    console.error('Messages endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



