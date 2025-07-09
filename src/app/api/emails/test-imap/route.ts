import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import Imap from 'imap';
import { simpleParser } from 'mailparser';

// Define interfaces for IMAP responses
interface ImapBox {
  messages: {
    total: number;
  };
}

interface ImapMessageAttributes {
  uid: number;
  flags: string[];
}

interface EmailHeader {
  from?: string;
  to?: string;
  subject?: string;
  date?: Date;
}

/**
 * API route to test IMAP connection using stored credentials
 * @route GET /api/emails/test-imap?accountId=<account_id>
 */
export async function GET(request: Request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the account ID from the query parameters
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get the user's IMAP credentials from the database
    const { data: accountData, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .eq('provider_type', 'imap')
      .single();

    if (accountError || !accountData) {
      return NextResponse.json(
        { success: false, error: 'IMAP account not found or access denied' },
        { status: 404 }
      );
    }
    
    if (!accountData.is_active) {
      return NextResponse.json(
        { success: false, error: 'This IMAP account is inactive' },
        { status: 400 }
      );
    }

    // Decrypt the password (using base64 for this example, should use proper encryption in production)
    const password = Buffer.from(accountData.password_encrypted, 'base64').toString('utf-8');

    // Create an IMAP client
    const imapConfig = {
      user: accountData.email,
      password: password,
      host: accountData.imap_host,
      port: accountData.imap_port,
      tls: accountData.use_tls,
      tlsOptions: { rejectUnauthorized: false } // For CRM Mind testing only, must be removed in production
    };

    // Log the connection attempt for debugging
    console.log(`Testing IMAP connection for account ${accountId} (${accountData.email})`);
    
    // Test the connection by fetching the last 5 emails
    return new Promise((resolve) => {
      const imap = new (Imap as any)(imapConfig);

      imap.once('ready', () => {
        imap.openBox('INBOX', true, (err: Error | null, box: ImapBox) => {
          if (err) {
            imap.end();
            resolve(NextResponse.json(
              { success: false, error: `Failed to open inbox: ${err.message}` },
              { status: 500 }
            ));
            return;
          }

          // Get the last 5 messages
          const fetch = imap.seq.fetch(`${Math.max(1, box.messages.total - 4)}:${box.messages.total}`, {
            bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)'],
            struct: true
          });

          const messages: any[] = [];

          fetch.on('message', (msg: Imap.ImapMessage) => {
            let headerInfo: any = null;

            msg.on('body', (stream: any) => {
              simpleParser(stream as any, {}, (err: Error | null, parsed: any) => {
                if (!err) {
                  headerInfo = {
                    from: parsed.from?.text,
                    to: parsed.to?.text,
                    subject: parsed.subject,
                    date: parsed.date
                  };
                }
              });
            });

            msg.once('attributes', (attrs: ImapMessageAttributes) => {
              if (headerInfo) {
                messages.push({
                  ...headerInfo,
                  uid: attrs.uid,
                  flags: attrs.flags
                });
              }
            });
          });

          fetch.once('error', (err: Error) => {
            imap.end();
            resolve(NextResponse.json(
              { success: false, error: `Fetch error: ${err.message}` },
              { status: 500 }
            ));
          });

          fetch.once('end', () => {
            imap.end();
            resolve(NextResponse.json({
              success: true,
              message: 'IMAP connection successful',
              emailCount: box.messages.total,
              recentEmails: messages,
              accountId: accountId,
              email: accountData.email
            }));
          });
        });
      });

      imap.once('error', (err: Error) => {
        console.error(`IMAP connection error for account ${accountId}:`, err.message);
        imap.end();
        resolve(NextResponse.json(
          { 
            success: false, 
            error: `Connection error: ${err.message}`,
            accountId: accountId,
            email: accountData.email
          },
          { status: 500 }
        ));
      });

      imap.connect();
    });
  } catch (error: any) {
    console.error('Error in test IMAP API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
