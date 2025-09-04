import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface EmailIndex {
  id: string;
  message_id: string;
  subject: string;
  folder_name: string;
  email_type: string;
  created_at: string;
}

interface FinalStats {
  total: number;
  by_folder: Record<string, number>;
  by_type: Record<string, number>;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    console.log('🧹 Starting duplicate email cleanup...');
    
    // First, let's see what we have
    const { data: allEmails, error: fetchError } = await supabase
      .from('email_index')
      .select('id, message_id, subject, folder_name, email_type, created_at')
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff')
      .order('created_at', { ascending: false });

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }

    console.log(`📊 Found ${allEmails?.length || 0} total emails`);

    // Group by message_id to find duplicates
    const messageIdGroups: Record<string, EmailIndex[]> = {};
    allEmails?.forEach(email => {
      const msgId = email.message_id || 'unknown';
      if (!messageIdGroups[msgId]) {
        messageIdGroups[msgId] = [];
      }
      messageIdGroups[msgId].push(email);
    });

    // Find duplicates (groups with more than 1 email)
    const duplicateGroups = Object.entries(messageIdGroups).filter(([_, emails]) => (emails as EmailIndex[]).length > 1);
    
    console.log(`🔍 Found ${duplicateGroups.length} duplicate message ID groups`);

    let deletedCount = 0;
    const emailsToDelete: string[] = [];

    // For each duplicate group, keep the oldest one (first synced) and mark others for deletion
    for (const [messageId, emails] of duplicateGroups) {
      // Sort by created_at to keep the oldest
      const typedEmails = emails as EmailIndex[];
      typedEmails.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      
      // Keep the first (oldest), delete the rest
      const toDelete = typedEmails.slice(1);
      emailsToDelete.push(...toDelete.map(e => e.id));
      
      console.log(`📧 Message ID: ${messageId} - keeping 1, deleting ${toDelete.length} duplicates`);
    }

    if (emailsToDelete.length > 0) {
      console.log(`🗑️ Deleting ${emailsToDelete.length} duplicate emails...`);
      
      // Delete from email_content_cache first (foreign key constraint)
      const { error: contentError } = await supabase
        .from('email_content_cache')
        .delete()
        .in('message_id', emailsToDelete.map(id => 
          allEmails?.find(e => e.id === id)?.message_id
        ).filter(Boolean) as string[]);

      if (contentError) {
        console.warn('Warning: Error deleting from content cache:', contentError);
      }

      // Delete from email_index
      const { error: deleteError } = await supabase
        .from('email_index')
        .delete()
        .in('id', emailsToDelete);

      if (deleteError) {
        console.error('Error deleting duplicate emails:', deleteError);
        return NextResponse.json({ error: 'Failed to delete duplicates' }, { status: 500 });
      }

      deletedCount = emailsToDelete.length;
    }

    // Get final counts
    const { data: finalEmails, error: finalError } = await supabase
      .from('email_index')
      .select('folder_name, email_type')
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff');

    const finalStats: FinalStats = {
      total: finalEmails?.length || 0,
      by_folder: {},
      by_type: {}
    };

    finalEmails?.forEach(email => {
      const folder = email.folder_name || 'unknown';
      const type = email.email_type || 'unknown';
      
      finalStats.by_folder[folder] = (finalStats.by_folder[folder] || 0) + 1;
      finalStats.by_type[type] = (finalStats.by_type[type] || 0) + 1;
    });

    console.log('✅ Cleanup complete:', finalStats);

    return NextResponse.json({
      success: true,
      message: `Cleanup complete: deleted ${deletedCount} duplicate emails`,
      deleted_count: deletedCount,
      final_stats: finalStats
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}











