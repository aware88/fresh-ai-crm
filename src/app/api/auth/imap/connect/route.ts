import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';

export async function POST(request: Request) {
  try {
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
      email,
      password,
      imapHost,
      imapPort,
      smtpHost,
      smtpPort,
      useTLS,
    } = await request.json();

    // Validate required fields
    if (!email || !password || !imapHost || !imapPort || !smtpHost || !smtpPort) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Encrypt the password before storing it
    // In CRM Mind production, we should use a proper encryption method
    // For this example, we'll use base64 encoding (not secure for production)
    const passwordEncrypted = Buffer.from(password).toString('base64');
    
    // Check if this email already exists for this user
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('email', email)
      .eq('provider_type', 'imap')
      .maybeSingle();
    
    let result;
    
    if (existingAccount) {
      // Update existing account
      result = await supabase
        .from('email_accounts')
        .update({
          password_encrypted: passwordEncrypted,
          imap_host: imapHost,
          imap_port: parseInt(imapPort),
          smtp_host: smtpHost,
          smtp_port: parseInt(smtpPort),
          use_tls: useTLS,
          is_active: true,
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
            provider_type: 'imap',
            password_encrypted: passwordEncrypted,
            imap_host: imapHost,
            imap_port: parseInt(imapPort),
            smtp_host: smtpHost,
            smtp_port: parseInt(smtpPort),
            use_tls: useTLS,
            is_active: true
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
