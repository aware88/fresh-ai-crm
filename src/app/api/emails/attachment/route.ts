/**
 * API Endpoint: Download Email Attachment
 * 
 * This endpoint allows downloading attachments from emails.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

interface AttachmentRequest {
  messageId: string;
  attachmentId: string;
  filename: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: AttachmentRequest = await request.json();
    const { messageId, attachmentId, filename } = body;

    if (!messageId || !attachmentId) {
      return NextResponse.json(
        { error: 'Missing required fields: messageId, attachmentId' },
        { status: 400 }
      );
    }

    console.log(`📎 Fetching attachment ${attachmentId} from message ${messageId}`);

    // Get email content from cache
    const { data: cachedContent, error: cacheError } = await supabase
      .from('email_content_cache')
      .select('attachments')
      .eq('message_id', messageId)
      .single();

    if (cacheError || !cachedContent || !cachedContent.attachments) {
      console.error('Attachment not found in cache:', cacheError);
      return NextResponse.json(
        { error: 'Attachment not found or access denied' },
        { status: 404 }
      );
    }

    // Find the specific attachment
    const attachment = cachedContent.attachments.find((att: any) => 
      att.contentId === attachmentId || att.filename === filename
    );

    if (!attachment || !attachment.content) {
      return NextResponse.json(
        { error: 'Attachment not found' },
        { status: 404 }
      );
    }

    // Return the attachment content
    return NextResponse.json({
      filename: attachment.filename,
      contentType: attachment.contentType,
      content: attachment.content,
      success: true
    });

  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
