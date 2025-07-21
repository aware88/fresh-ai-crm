import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';

export async function POST(request: Request) {
  try {
    const { host, port, secure, username, password, type } = await request.json();

    // Validate required fields
    if (!host || !port || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Test IMAP connection (default for email account testing)
    const isSecure = secure === 'true' || secure === true;
    
    const clientOptions: any = {
      host,
      port: Number(port),
      secure: isSecure,
      auth: {
        user: username,
        pass: password,
      },
      logger: false,
      connectTimeout: 30000,
      // Handle certificate issues (common for hosted email services)
      tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
      },
    };
    
    // Handle different security configurations
    if (!isSecure && (port === '143' || port === 143)) {
      clientOptions.requireTLS = true;
    } else if (!isSecure && (port === '587' || port === 587)) {
      clientOptions.requireTLS = true;
      clientOptions.secure = false;
    }

    // Ensure secure flag is correct for SSL/TLS ports
    if (port === '993' || port === 993 || port === '465' || port === 465) {
      clientOptions.secure = true;
    }

    const client = new ImapFlow(clientOptions);

    try {
      console.log(`Testing IMAP connection to ${host}:${port} (secure: ${isSecure})`);
      await client.connect();
      
      // Try to open the inbox to verify permissions
      const mailbox = await client.mailboxOpen('INBOX');
      console.log(`Successfully connected to INBOX with ${mailbox.exists} messages`);
      
      await client.logout();
      
      return NextResponse.json({ 
        success: true, 
        message: 'IMAP connection successful',
        messageCount: mailbox.exists
      });
      
    } finally {
      try {
        await client.logout();
      } catch (error) {
        // Ignore logout errors
      }
    }

  } catch (error) {
    console.error('Error testing IMAP connection:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to test connection' 
      },
      { status: 500 }
    );
  }
}
