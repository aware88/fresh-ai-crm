import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('emailId');

    if (!emailId) {
      return NextResponse.json({ error: 'Email ID is required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const userId = session.user.id;
    const organizationId = (session.user as any)?.organizationId || userId;

    // Get notes for this email that user can see (own notes + public org notes)
    const { data: notes, error } = await supabase
      .from('email_notes')
      .select('*')
      .eq('email_id', emailId)
      .or(`user_id.eq.${userId},and(organization_id.eq.${organizationId},is_private.eq.false)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json({ error: 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json(notes || []);
  } catch (error) {
    console.error('Error in notes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      email_id,
      email_subject,
      email_from,
      note_content,
      note_type = 'note',
      is_private = false
    } = body;

    if (!email_id || !note_content) {
      return NextResponse.json({ error: 'Email ID and note content are required' }, { status: 400 });
    }

    const supabase = createServiceRoleClient();
    const userId = session.user.id;
    const organizationId = (session.user as any)?.organizationId || userId;

    const { data: note, error } = await supabase
      .from('email_notes')
      .insert([{
        user_id: userId,
        organization_id: organizationId,
        email_id,
        email_subject,
        email_from,
        note_content: note_content.trim(),
        note_type,
        is_private,
        created_by_name: session.user.name || 'Unknown'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating note:', error);
      return NextResponse.json({ error: 'Failed to create note' }, { status: 500 });
    }

    return NextResponse.json(note);
  } catch (error) {
    console.error('Error in notes POST API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
