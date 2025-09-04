import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = await params;
    const supabase = createServiceRoleClient();

    // Get email data from email_index and content cache
    const { data: emailIndex, error: indexError } = await supabase
      .from('email_index')
      .select(`
        *,
        email_accounts!inner(user_id)
      `)
      .eq('message_id', messageId)
      .eq('email_accounts.user_id', session.user.id)
      .single();

    if (indexError || !emailIndex) {
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }

    // Get email content from cache
    const { data: contentData } = await supabase
      .from('email_content_cache')
      .select('html_content, plain_content, raw_content')
      .eq('message_id', messageId)
      .single();

    // Combine the data
    const emailData = {
      ...emailIndex,
      html_content: contentData?.html_content || null,
      plain_content: contentData?.plain_content || null,
      raw_content: contentData?.raw_content || null,
    };

    return NextResponse.json(emailData);
  } catch (error) {
    console.error('Error fetching email:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}














