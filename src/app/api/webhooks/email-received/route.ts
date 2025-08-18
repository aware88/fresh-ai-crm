import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getBackgroundProcessor } from '@/lib/email/background-ai-processor';
import OpenAI from 'openai';

/**
 * WEBHOOK: Email Received
 * 
 * Triggered when new emails arrive via webhooks from email providers
 * Immediately starts background AI processing for instant UI responses
 * 
 * Supports:
 * - Gmail webhooks (Google Pub/Sub)
 * - Outlook webhooks (Microsoft Graph)
 * - Generic IMAP webhooks
 */
export async function POST(request: NextRequest) {
  try {
    console.log('[EmailWebhook] Received email webhook');
    
    // Verify webhook authenticity (basic security)
    const authHeader = request.headers.get('authorization');
    const webhookSecret = process.env.EMAIL_WEBHOOK_SECRET;
    
    if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
      console.log('[EmailWebhook] Unauthorized webhook request');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload = await request.json();
    console.log('[EmailWebhook] Payload received:', JSON.stringify(payload, null, 2));

    // Parse webhook payload based on provider
    const emailData = await parseWebhookPayload(payload);
    
    if (!emailData) {
      console.log('[EmailWebhook] Could not parse webhook payload');
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Save email to database first
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: savedEmail, error: saveError } = await supabase
      .from('emails')
      .insert({
        user_id: emailData.userId,
        from_address: emailData.from,
        to_address: emailData.to,
        subject: emailData.subject,
        raw_content: emailData.body,
        text_content: emailData.body,
        date: emailData.date || new Date().toISOString(),
        message_id: emailData.messageId,
        provider: emailData.provider || 'webhook',
        folder: 'INBOX',
        is_read: false
      })
      .select()
      .single();

    if (saveError) {
      console.error('[EmailWebhook] Error saving email:', saveError);
      return NextResponse.json(
        { error: 'Failed to save email' },
        { status: 500 }
      );
    }

    console.log(`[EmailWebhook] Email saved with ID: ${savedEmail.id}`);

    // Start background AI processing immediately
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    if (openai.apiKey) {
      const processor = getBackgroundProcessor(supabase, openai);
      
      // Process in background (don't wait for completion)
      processor.processEmailInBackground({
        emailId: savedEmail.id,
        userId: emailData.userId,
        organizationId: emailData.organizationId,
        priority: determinePriority(emailData),
        skipDraft: shouldSkipDraft(emailData)
      }).then(result => {
        console.log(`[EmailWebhook] Background processing completed for ${savedEmail.id}:`, result.success);
      }).catch(error => {
        console.error(`[EmailWebhook] Background processing failed for ${savedEmail.id}:`, error);
      });
    }

    // Send real-time notification to user (optional)
    if (emailData.userId) {
      await sendRealtimeNotification(emailData.userId, {
        type: 'new_email',
        emailId: savedEmail.id,
        from: emailData.from,
        subject: emailData.subject
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Email received and processing started',
      emailId: savedEmail.id
    });

  } catch (error) {
    console.error('[EmailWebhook] Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Parse webhook payload from different email providers
 */
async function parseWebhookPayload(payload: any): Promise<{
  userId: string;
  organizationId?: string;
  messageId: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date?: string;
  provider: string;
} | null> {
  
  // Gmail webhook (Google Pub/Sub format)
  if (payload.message?.data) {
    try {
      const decoded = JSON.parse(Buffer.from(payload.message.data, 'base64').toString());
      
      if (decoded.emailAddress && decoded.historyId) {
        // This is a Gmail notification - we'd need to fetch the actual email
        // For now, return null to indicate we need to implement Gmail API integration
        console.log('[EmailWebhook] Gmail webhook detected, but full integration not implemented');
        return null;
      }
    } catch (e) {
      console.error('[EmailWebhook] Error parsing Gmail webhook:', e);
    }
  }

  // Outlook webhook (Microsoft Graph format)
  if (payload.value && Array.isArray(payload.value)) {
    for (const notification of payload.value) {
      if (notification.resource && notification.resourceData) {
        console.log('[EmailWebhook] Outlook webhook detected, but full integration not implemented');
        return null;
      }
    }
  }

  // Generic webhook format (for testing and custom integrations)
  if (payload.email) {
    return {
      userId: payload.userId || payload.email.userId,
      organizationId: payload.organizationId,
      messageId: payload.email.messageId || `webhook-${Date.now()}`,
      from: payload.email.from,
      to: payload.email.to,
      subject: payload.email.subject || '(No Subject)',
      body: payload.email.body || payload.email.content || '',
      date: payload.email.date,
      provider: 'webhook'
    };
  }

  return null;
}

/**
 * Determine processing priority based on email content
 */
function determinePriority(emailData: any): 'low' | 'normal' | 'high' {
  const subject = emailData.subject?.toLowerCase() || '';
  const body = emailData.body?.toLowerCase() || '';
  
  // High priority keywords
  const highPriorityKeywords = ['urgent', 'asap', 'emergency', 'critical', 'important', 'deadline'];
  if (highPriorityKeywords.some(keyword => subject.includes(keyword) || body.includes(keyword))) {
    return 'high';
  }
  
  // Low priority keywords
  const lowPriorityKeywords = ['newsletter', 'unsubscribe', 'marketing', 'promotion', 'spam'];
  if (lowPriorityKeywords.some(keyword => subject.includes(keyword) || body.includes(keyword))) {
    return 'low';
  }
  
  return 'normal';
}

/**
 * Determine if we should skip draft generation
 */
function shouldSkipDraft(emailData: any): boolean {
  const subject = emailData.subject?.toLowerCase() || '';
  const body = emailData.body?.toLowerCase() || '';
  
  // Skip drafts for automated emails
  const skipKeywords = ['no-reply', 'noreply', 'automated', 'do not reply', 'newsletter', 'notification'];
  return skipKeywords.some(keyword => 
    emailData.from.toLowerCase().includes(keyword) ||
    subject.includes(keyword) ||
    body.includes(keyword)
  );
}

/**
 * Send real-time notification to user
 */
async function sendRealtimeNotification(userId: string, notification: any) {
  try {
    // This could integrate with WebSocket, Server-Sent Events, or push notifications
    // For now, just log the notification
    console.log(`[EmailWebhook] Notification for user ${userId}:`, notification);
    
    // TODO: Implement real-time notification system
    // - WebSocket connection
    // - Server-Sent Events
    // - Push notifications
    // - Email notifications
    
  } catch (error) {
    console.error('[EmailWebhook] Error sending notification:', error);
  }
}

