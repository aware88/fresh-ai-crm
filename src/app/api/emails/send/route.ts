import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

/**
 * POST handler for sending emails via Microsoft Graph API
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
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
    const graphService = new MicrosoftGraphService(session.accessToken);
    
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
    await graphService.sendEmail({ message });
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email', message: error.message },
      { status: 500 }
    );
  }
}
