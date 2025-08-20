import { NextRequest, NextResponse } from 'next/server';
import { getBackgroundProcessor } from '@/lib/email/background-ai-processor';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate webhook payload
    if (!body.email || !body.email.id) {
      return NextResponse.json(
        { error: 'Invalid webhook payload - missing email data' },
        { status: 400 }
      );
    }

    const { email } = body;
    
    // Process the email with AI in the background
    const processor = getBackgroundProcessor();
    
    // Convert webhook email format to our internal format
    const emailData = {
      id: email.id,
      from: email.from,
      to: email.to,
      subject: email.subject,
      body: email.body || email.content,
      date: email.date || email.receivedDateTime || new Date().toISOString(),
      messageId: email.messageId || email.id
    };

    // Start background processing
    await processor.processEmailsWithAI([emailData]);

    console.log(`Webhook processed email: ${email.id} - ${email.subject}`);

    return NextResponse.json({
      success: true,
      message: 'Email processed successfully',
      emailId: email.id
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'email-webhook',
    timestamp: new Date().toISOString()
  });
}