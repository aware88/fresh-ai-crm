import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    console.log('🧹 Starting complete email database reset...');
    
    // First delete from email_content_cache (due to foreign key constraints)
    console.log('🗑️ Deleting all email content...');
    const { error: contentError } = await supabase
      .from('email_content_cache')
      .delete()
      .neq('message_id', 'preserve-nothing'); // Delete all

    if (contentError) {
      console.error('Error deleting email content:', contentError);
      return NextResponse.json({ error: 'Failed to delete email content' }, { status: 500 });
    }

    // Then delete from email_index
    console.log('🗑️ Deleting all email index entries...');
    const { error: indexError } = await supabase
      .from('email_index')
      .delete()
      .neq('message_id', 'preserve-nothing'); // Delete all

    if (indexError) {
      console.error('Error deleting email index:', indexError);
      return NextResponse.json({ error: 'Failed to delete email index' }, { status: 500 });
    }

    // Reset the last_sync_at timestamp for the email account
    console.log('🔄 Resetting email account sync timestamp...');
    const { error: resetError } = await supabase
      .from('email_accounts')
      .update({
        last_sync_at: null,
        sync_error: null,
        updated_at: new Date().toISOString()
      })
      .eq('email', 'tim.mak@bulknutrition.eu');

    if (resetError) {
      console.error('Error resetting email account:', resetError);
      return NextResponse.json({ error: 'Failed to reset email account' }, { status: 500 });
    }

    console.log('✅ Email database reset complete!');
    
    return NextResponse.json({
      success: true,
      message: 'Email database has been completely reset. You can now perform a fresh sync.'
    });

  } catch (error) {
    console.error('Reset error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}














