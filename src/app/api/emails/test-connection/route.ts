import { NextResponse } from 'next/server';
import { ImapFlow } from 'imapflow';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      email, 
      imapHost, 
      imapPort, 
      imapSecurity,
      username, 
      password 
    } = data;

    // Validate required fields
    if (!imapHost || !username || !password) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Configure security options based on the selected security type
    const secure = imapSecurity !== 'None';
    const requireTLS = imapSecurity === 'STARTTLS';

    // Create IMAP client config
    const imapConfig = {
      host: imapHost,
      port: imapPort || 993,
      secure,
      auth: {
        user: username,
        pass: password,
      },
      requireTLS,
      logger: false as const, // Use 'as const' to ensure type compatibility
      // Timeout after 30 seconds
      connectTimeout: 30 * 1000,
    };

    console.log(`Testing IMAP connection to ${imapHost}:${imapPort} for ${username}`);

    // Create and connect to IMAP server
    const client = new ImapFlow(imapConfig);
    
    // Set a timeout for the connection attempt
    const connectionTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 30000);
    });

    // Try to connect and open the mailbox
    await Promise.race([
      (async () => {
        try {
          await client.connect();
          const mailbox = await client.mailboxOpen('INBOX');
          console.log(`Connected successfully. Mailbox has ${mailbox.exists} messages`);
          await client.logout();
          return true;
        } catch (error) {
          console.error('Error during IMAP test:', error);
          throw error;
        } finally {
          try {
            // Only attempt logout if client exists and is authenticated
            if (client && client.authenticated) {
              try {
                await client.logout();
              } catch (error) {
                // Ignore specific NoConnection errors
                const logoutError = error as any;
                if (!logoutError.code || logoutError.code !== 'NoConnection') {
                  throw error; // Re-throw if it's a different error
                }
                // Otherwise, silently ignore NoConnection errors
                console.log('Ignoring expected NoConnection error during logout');
              }
            }
          } catch (e) {
            // This is a non-critical error, just log it
            console.error('Error closing IMAP connection:', e);
            // Continue execution - don't let this error affect the response
          }
        }
      })(),
      connectionTimeout
    ]);

    return NextResponse.json({
      success: true,
      message: 'IMAP connection successful',
    });
  } catch (error: any) {
    console.error('IMAP test error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to connect to IMAP server' 
      },
      { status: 500 }
    );
  }
}
