import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createServerClient } from '@/lib/supabase/server';
import * as crypto from 'crypto';

// Encrypt password with AES-256-GCM
function encryptPassword(password: string): string {
  const key = process.env.PASSWORD_ENCRYPTION_KEY;
  if (!key) {
    throw new Error('PASSWORD_ENCRYPTION_KEY not set in environment variables');
  }
  
  // Use the first 32 bytes of the key for AES-256
  const keyBuffer = Buffer.from(key, 'hex').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
  
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return IV + AuthTag + Encrypted content
  return iv.toString('hex') + ':' + authTag + ':' + encrypted;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
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

    // Get the IMAP credentials from the request body
    const {
      userId,
      email,
      name,
      providerType,
      imapHost,
      imapPort,
      imapSecurity,
      username,
      password,
      smtpHost,
      smtpPort,
      smtpSecurity,
      isActive,
    } = await request.json();

    // Validate required fields
    if (!email || !imapHost || !imapPort) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the userId matches the authenticated user (security check)
    if (userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'User ID mismatch' },
        { status: 403 }
      );
    }
    
    // Initialize supabase client
    const supabase = await createServerClient();
    
    // Check if this email account exists and belongs to this user
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (checkError || !existingAccount) {
      return NextResponse.json(
        { success: false, error: 'Account not found or access denied' },
        { status: 404 }
      );
    }
    
    // Prepare update data
    const updateData: Record<string, any> = {
      email,
      display_name: name || email,
      imap_host: imapHost,
      imap_port: imapPort,
      imap_security: imapSecurity || 'SSL/TLS',
      username,
      smtp_host: smtpHost || imapHost,
      smtp_port: smtpPort,
      smtp_security: smtpSecurity || 'STARTTLS',
      is_active: isActive !== undefined ? isActive : true,
      updated_at: new Date().toISOString()
    };
    
    // Only update password if provided
    if (password) {
      try {
        updateData.password_encrypted = encryptPassword(password);
      } catch (error: any) {
        console.error('Error encrypting password:', error);
        return NextResponse.json(
          { success: false, error: 'Failed to securely store credentials' },
          { status: 500 }
        );
      }
    }
    
    // Update the account
    const { data, error } = await supabase
      .from('email_accounts')
      .update(updateData)
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Error updating IMAP account:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update IMAP account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'IMAP account updated successfully',
      accountId: data?.[0]?.id,
    });
  } catch (error: any) {
    console.error('Error in update IMAP account API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
