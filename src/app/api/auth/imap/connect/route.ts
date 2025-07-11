import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
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

export async function POST(request: Request) {
  try {
    // Check if the user is authenticated using our custom auth helper
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      console.error('IMAP connect: Unauthorized - No valid session');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please sign in again' },
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
    if (!email || !password || !imapHost || !imapPort) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Verify the userId matches the authenticated user (security check)
    console.log('IMAP connect: Comparing user IDs', { 
      providedUserId: userId, 
      sessionUserId: session.user.id 
    });
    
    if (!userId || userId !== session.user.id) {
      console.error('IMAP connect: User ID mismatch or missing', { 
        providedUserId: userId, 
        sessionUserId: session.user.id 
      });
      return NextResponse.json(
        { success: false, error: 'User ID mismatch or invalid' },
        { status: 403 }
      );
    }

    // Encrypt the password securely before storing it
    let passwordEncrypted;
    try {
      passwordEncrypted = encryptPassword(password);
    } catch (error: any) {
      console.error('Error encrypting password:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to securely store credentials' },
        { status: 500 }
      );
    }
    
    // Initialize supabase client with service role to bypass RLS
    const supabase = createServiceRoleClient();
    
    // Check if this email already exists for this user
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('email', email)
      .eq('provider_type', providerType || 'imap')
      .maybeSingle();
    
    let result;
    
    if (existingAccount) {
      // Update existing account
      result = await supabase
        .from('email_accounts')
        .update({
          display_name: name || email,
          password_encrypted: passwordEncrypted,
          username: username,
          imap_host: imapHost,
          imap_port: imapPort,
          imap_security: imapSecurity || 'SSL/TLS',
          smtp_host: smtpHost || imapHost,
          smtp_port: smtpPort,
          smtp_security: smtpSecurity || 'STARTTLS',
          is_active: isActive !== undefined ? isActive : true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingAccount.id)
        .select();
    } else {
      // Insert new account
      result = await supabase
        .from('email_accounts')
        .insert([
          {
            user_id: session.user.id,
            email,
            display_name: name || email,
            provider_type: providerType || 'imap',
            password_encrypted: passwordEncrypted,
            username: username,
            imap_host: imapHost,
            imap_port: imapPort,
            imap_security: imapSecurity || 'SSL/TLS',
            smtp_host: smtpHost || imapHost,
            smtp_port: smtpPort,
            smtp_security: smtpSecurity || 'STARTTLS',
            is_active: isActive !== undefined ? isActive : true
          }
        ])
        .select();
    }

    if (result.error) {
      console.error('Error storing IMAP credentials:', result.error);
      return NextResponse.json(
        { success: false, error: 'Failed to store IMAP credentials' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'IMAP credentials stored successfully',
      accountId: result.data?.[0]?.id,
    });
  } catch (error: any) {
    console.error('Error in IMAP connect API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
