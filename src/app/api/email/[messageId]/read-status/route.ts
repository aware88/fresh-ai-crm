import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { messageId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { messageId } = params;
    const { isRead } = await request.json();
    
    if (typeof isRead !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'isRead must be a boolean' },
        { status: 400 }
      );
    }

    const supabase = createServiceRoleClient();

    // Update the read status in email_index
    // First verify the user owns this email through email_accounts
    const { data: emailData, error: verifyError } = await supabase
      .from('email_index')
      .select(`
        id,
        email_accounts!inner (
          user_id
        )
      `)
      .eq('message_id', messageId)
      .single();

    if (verifyError || !emailData || emailData.email_accounts.user_id !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Email not found or access denied' },
        { status: 404 }
      );
    }

    // Update the read status
    const { error } = await supabase
      .from('email_index')
      .update({ 
        is_read: isRead,
        updated_at: new Date().toISOString()
      })
      .eq('message_id', messageId);

    if (error) {
      console.error('Error updating read status:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update read status' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      messageId,
      isRead 
    });
  } catch (error) {
    console.error('Error in read status update:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
