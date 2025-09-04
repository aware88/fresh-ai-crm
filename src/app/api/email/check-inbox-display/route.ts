import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

interface EmailIndex {
  id: string;
  message_id: string;
  subject: string;
  sender_email: string;
  folder_name: string;
  email_type: string;
  created_at: string;
}

interface DuplicateSubjectGroup {
  subject: string;
  count: number;
  emails: {
    id: string;
    message_id: string;
    sender_email: string;
    created_at: string;
  }[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceRoleClient();
    
    // Check INBOX emails specifically
    const { data: inboxEmails, error } = await supabase
      .from('email_index')
      .select(`
        id, 
        message_id, 
        subject, 
        sender_email, 
        folder_name, 
        email_type, 
        created_at
      `)
      .eq('email_account_id', '9c10c0d6-b92b-4581-b81a-db5df168d5ff')
      .eq('folder_name', 'INBOX')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch inbox emails' }, { status: 500 });
    }

    // Check for subject duplicates (which might appear as duplicates in UI)
    const subjectGroups: Record<string, EmailIndex[]> = {};
    inboxEmails?.forEach(email => {
      const subject = email.subject || 'No Subject';
      if (!subjectGroups[subject]) {
        subjectGroups[subject] = [];
      }
      subjectGroups[subject].push(email);
    });

    const duplicateSubjects: DuplicateSubjectGroup[] = Object.entries(subjectGroups)
      .filter(([_, emails]) => emails.length > 1)
      .map(([subject, emails]) => ({
        subject,
        count: emails.length,
        emails: emails.map(e => ({
          id: e.id,
          message_id: e.message_id,
          sender_email: e.sender_email || '',
          created_at: e.created_at
        }))
      }));

    return NextResponse.json({
      success: true,
      inbox_count: inboxEmails?.length || 0,
      recent_inbox_emails: inboxEmails?.slice(0, 10).map(e => ({
        subject: e.subject,
        sender_email: e.sender_email,
        message_id: e.message_id,
        created_at: e.created_at
      })),
      duplicate_subjects: duplicateSubjects,
      duplicate_subjects_count: duplicateSubjects.length
    });

  } catch (error) {
    console.error('Check inbox error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}











