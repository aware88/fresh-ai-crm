import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';
import { FollowUpService } from '@/lib/email/follow-up-service';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { getValidMicrosoftAccessToken } from '@/lib/services/microsoft-token';

/**
 * POST handler for sending emails via Microsoft Graph API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();

    let accessToken: string | null = (session as any)?.accessToken || null;
    if (!accessToken && session?.user?.id) {
      const valid = await getValidMicrosoftAccessToken({ userId: (session.user as any).id });
      accessToken = valid?.accessToken || null;
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Unauthorized or missing Microsoft Graph access token' },
        { status: 401 },
      );
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.subject || !body.toRecipients || body.toRecipients.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: subject, toRecipients' },
        { status: 400 }
      );
    }
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(accessToken);
    
    // Format the message for Microsoft Graph API
    const message = {
      subject: body.subject,
      body: {
        contentType: body.contentType || 'HTML',
        content: body.content || '',
      },
      toRecipients: body.toRecipients.map((recipient: string) => ({
        emailAddress: {
          address: recipient,
        },
      })),
    };
    
    // Add CC recipients if provided
    if (body.ccRecipients && body.ccRecipients.length > 0) {
      message.ccRecipients = body.ccRecipients.map((recipient: string) => ({
        emailAddress: {
          address: recipient,
        },
      }));
    }
    
    // Add BCC recipients if provided
    if (body.bccRecipients && body.bccRecipients.length > 0) {
      message.bccRecipients = body.bccRecipients.map((recipient: string) => ({
        emailAddress: {
          address: recipient,
        },
      }));
    }
    
    // Add attachments if provided
    if (body.attachments && body.attachments.length > 0) {
      message.attachments = body.attachments.map((attachment: any) => ({
        '@odata.type': '#microsoft.graph.fileAttachment',
        name: attachment.name,
        contentType: attachment.contentType,
        contentBytes: attachment.contentBytes,
      }));
    }
    
    // Send the email
    const emailResult = await graphService.sendEmail({ message });
    
    // Get user info for follow-up tracking
    const userId = session.user?.id;
    const organizationId = session.user?.organizationId;
    
    // Automatically create follow-up if this is an outbound email (not a reply)
    if (userId && !body.subject.toLowerCase().startsWith('re:')) {
      try {
        const followUpService = new FollowUpService();
        
        await followUpService.trackSentEmail({
          emailId: `sent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          userId: userId,
          organizationId: organizationId,
          subject: body.subject,
          recipients: body.toRecipients,
          sentAt: new Date(),
          autoFollowup: true, // Enable automatic follow-up tracking
          followUpDays: 3, // Default to 3 days
          priority: 'medium'
        });
        
        console.log('✅ Follow-up tracking created for sent email:', body.subject);
      } catch (followUpError) {
        console.error('⚠️ Failed to create follow-up tracking:', followUpError);
        // Don't fail the email send if follow-up creation fails
      }
    }
    
    return NextResponse.json({ 
      success: true,
      emailId: emailResult?.id || `sent-${Date.now()}`,
      followUpCreated: userId && !body.subject.toLowerCase().startsWith('re:')
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', message: error.message },
      { status: 500 }
    );
  }
}
