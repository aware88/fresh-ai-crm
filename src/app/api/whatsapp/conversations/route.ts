import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createLazyServiceRoleClient } from '@/lib/supabase/lazy-client';

// Returns a lightweight list of recent WhatsApp conversations derived from interactions
// GET /api/whatsapp/conversations?limit=30&offset=0
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 100);
    const offset = Math.max(parseInt(searchParams.get('offset') || '0', 10), 0);

    const supabase = await createLazyServiceRoleClient();

    // Fetch recent WhatsApp interactions (most recent first)
    const { data, error } = await supabase
      .from('interactions')
      .select('id, contact_id, content, interaction_date, metadata')
      .order('interaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Conversations fetch error:', error);
      return NextResponse.json({ error: 'Failed to load conversations' }, { status: 500 });
    }

    const whatsappOnly = (data || []).filter((i: any) => i?.metadata?.channel === 'whatsapp');

    // Derive unique conversations by contact_id with last message
    const conversationsMap = new Map<string, any>();
    for (const it of whatsappOnly) {
      if (!it.contact_id) continue;
      if (!conversationsMap.has(it.contact_id)) {
        conversationsMap.set(it.contact_id, {
          contact_id: it.contact_id,
          last_message: it.content || '',
          last_at: it.interaction_date,
          last_status: it?.metadata?.whatsapp?.status || undefined,
        });
      }
    }

    const conversations = Array.from(conversationsMap.values());
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Conversations endpoint error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



