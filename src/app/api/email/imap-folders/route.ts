import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { ImapFlow } from 'imapflow';
import * as crypto from 'crypto';

// Decrypt password with AES-256-GCM (simplified version)
function decryptPassword(encryptedPassword: string): string {
  // For now, use a simple base64 decode as fallback
  // This should match the encryption used in other parts of the app
  try {
    return Buffer.from(encryptedPassword, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt password');
  }
}

export async function GET(request: Request) {
  try {
    // Check if the user is authenticated
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('accountId');
    
    if (!accountId) {
      return NextResponse.json(
        { success: false, error: 'Account ID is required' },
        { status: 400 }
      );
    }

    // Get Supabase client
    const supabase = createServiceRoleClient();

    // Get the IMAP account details
    const { data: account, error: accountError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', session.user.id)
      .eq('provider_type', 'imap')
      .eq('is_active', true)
      .single();

    if (accountError || !account) {
      return NextResponse.json(
        { success: false, error: 'IMAP account not found or access denied' },
        { status: 404 }
      );
    }

    // Decrypt the password
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

    // Configure IMAP client
    const secure = account.imap_security === 'SSL/TLS';
    const requireTLS = account.imap_security === 'STARTTLS';
    
    const clientOptions: any = {
      host: account.imap_host,
      port: account.imap_port || 993,
      secure,
      auth: {
        user: account.username || account.email,
        pass: password,
      },
      logger: false,
      connectTimeout: 30000, // 30 second timeout
      // Add TLS options to handle certificate issues
      tls: {
        rejectUnauthorized: false // Allow self-signed or mismatched certificates
      }
    };
    
    if (requireTLS) {
      clientOptions.requireTLS = true;
    }

    const client = new ImapFlow(clientOptions);

    try {
      console.log(`Connecting to IMAP server for ${account.email} to list folders...`);
      await client.connect();
      
      // List all mailboxes
      const mailboxes = await client.list();
      
      // Filter and map folders to standardized names
      const folders = mailboxes
        .filter(box => !box.flags.has('\\Noselect'))
        .map(box => ({
          name: box.name,
          path: box.path,
          displayName: getFolderDisplayName(box.name)
        }))
        .filter(folder => 
          // Include important folders
          folder.name.toLowerCase().includes('inbox') ||
          folder.name.toLowerCase().includes('sent') ||
          folder.name.toLowerCase().includes('draft')
        );

      return NextResponse.json({
        success: true,
        folders,
        account: account.email
      });
      
    } finally {
      try {
        await client.logout();
      } catch (error) {
        console.error('Error closing IMAP connection:', error);
      }
    }
  } catch (error: any) {
    console.error('Error in IMAP folders API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list folders' },
      { status: 500 }
    );
  }
}

// Helper function to get user-friendly folder display names
function getFolderDisplayName(folderName: string): string {
  if (folderName.toLowerCase() === 'inbox') {
    return 'Inbox';
  }
  if (folderName.toLowerCase().includes('sent')) {
    return 'Sent';
  }
  if (folderName.toLowerCase().includes('draft')) {
    return 'Drafts';
  }
  
  return folderName;
} 