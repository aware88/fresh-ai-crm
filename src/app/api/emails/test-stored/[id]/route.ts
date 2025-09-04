import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@/lib/supabase/server';
import { ImapFlow } from 'imapflow';
import * as crypto from 'crypto';

// Decrypt password with AES-256-GCM
function decryptPassword(encryptedValue: string): string {
  const key = process.env.PASSWORD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
  }
  
  // Use the first 32 bytes of the key for AES-256
  const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
  
  // Split the encrypted value into IV, AuthTag and encrypted content
  const [ivHex, authTagHex, encrypted] = encryptedValue.split(':');
  
  if (!ivHex || !authTagHex || !encrypted) {
    throw new Error('Invalid encrypted value format');
  }
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBuffer, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Await params to fix Next.js 15 requirement
    const { id } = await params;
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Initialize supabase client
    const supabase = await createServerClient();
    
    // Fetch the email account with encrypted password
    const { data: account, error: fetchError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (fetchError || !account) {
      return NextResponse.json(
        { success: false, error: 'Account not found or access denied' },
        { status: 404 }
      );
    }
    
    // Check if we have the necessary connection details
    if (!account.imap_host || !account.username || !account.password_encrypted) {
      return NextResponse.json(
        { success: false, error: 'Missing required connection details' },
        { status: 400 }
      );
    }
    
    // Decrypt the stored password
    let password;
    try {
      password = decryptPassword(account.password_encrypted);
    } catch (error) {
      console.error('Failed to decrypt password:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to decrypt stored credentials' },
        { status: 500 }
      );
    }
    
    // Configure security options based on the selected security type
    const secure = account.imap_security !== 'None';
    const requireTLS = account.imap_security === 'STARTTLS';

    // Create IMAP client config
    const imapConfig = {
      host: account.imap_host,
      port: account.imap_port || 993,
      secure,
      auth: {
        user: account.username || account.email,
        pass: password,
      },
      requireTLS,
      logger: false as const,
      connectTimeout: 30 * 1000, // 30 second timeout
    };

    console.log(`Testing IMAP connection to ${account.imap_host}:${account.imap_port} for ${account.email}`);

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

    // If we get here, the connection was successful
    
    // Update the last_tested timestamp
    await supabase
      .from('email_accounts')
      .update({
        last_tested: new Date().toISOString(),
        last_test_successful: true
      })
      .eq('id', id);

    return NextResponse.json({
      success: true,
      message: 'IMAP connection successful',
    });
  } catch (error: any) {
    console.error('IMAP test error:', error);
    
    // Try to update the last_tested timestamp with failure status
    try {
      const supabase = await createServerClient();
      await supabase
        .from('email_accounts')
        .update({
          last_tested: new Date().toISOString(),
          last_test_successful: false
        })
        .eq('id', id);
    } catch (updateError) {
      console.error('Failed to update test status:', updateError);
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to connect to IMAP server' 
      },
      { status: 500 }
    );
  }
}