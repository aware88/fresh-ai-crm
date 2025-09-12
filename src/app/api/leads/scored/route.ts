import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch real contacts with lead scores from database
    const { data: contacts, error } = await supabase
      .from('contacts')
      .select(`
        *,
        lead_scores (*)
      `)
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching contacts:', error);
      return NextResponse.json({ contacts: [] });
    }

    // Transform the data to match the expected format
    const transformedContacts = (contacts || []).map(contact => ({
      ...contact,
      lead_score: contact.lead_scores?.[0] || null,
      leadScore: contact.lead_scores?.[0] || null // Include both formats for compatibility
    }));

    return NextResponse.json({ contacts: transformedContacts });
  } catch (error) {
    console.error('Leads API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}