import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { createServerClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { canAddMoreEmailAccounts } from '@/lib/subscription-feature-check';
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
    
    // Get user's current organization for subscription checking
    const { data: userPrefs, error: prefsError } = await supabase
      .from('user_preferences')
      .select('current_organization_id')
      .eq('user_id', session.user.id)
      .single();

    if (prefsError || !userPrefs?.current_organization_id) {
      console.error('IMAP connect: Could not find user organization:', prefsError);
      return NextResponse.json(
        { success: false, error: 'Could not determine organization for subscription check' },
        { status: 400 }
      );
    }

    const organizationId = userPrefs.current_organization_id;

    // Check if this email already exists for this user or organization
    const { data: existingAccount, error: checkError } = await supabase
      .from('email_accounts')
      .select('id')
      .or(`user_id.eq.${session.user.id},organization_id.eq.${organizationId}`)
      .eq('email', email)
      .eq('provider_type', providerType || 'imap')
      .maybeSingle();

    // If this is a new account (not updating existing), check subscription limits
    if (!existingAccount) {
      // Count current email accounts for this organization
      const { count: currentEmailAccountCount, error: countError } = await supabase
        .from('email_accounts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', organizationId);

      if (countError) {
        console.error('Error counting email accounts:', countError);
        return NextResponse.json(
          { success: false, error: 'Failed to check email account limits' },
          { status: 500 }
        );
      }

      // Check if organization can add more email accounts
      const { canAdd, reason, limit } = await canAddMoreEmailAccounts(
        organizationId, 
        currentEmailAccountCount || 0
      );

      if (!canAdd) {
        return NextResponse.json(
          { 
            success: false, 
            error: reason || 'Email account limit reached',
            limit,
            currentCount: currentEmailAccountCount || 0
          },
          { status: 403 }
        );
      }
    }
    
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
            organization_id: organizationId,
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

    const account = result.data?.[0];
    
    // Automatically trigger email sync for new accounts
    if (!existingAccount && account) {
      console.log('🔄 Triggering automatic email sync for new account...');
      try {
        // Call the sync API internally
        const syncResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/email/sync-to-database`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'User-Agent': 'Internal-IMAP-Setup'
          },
          body: JSON.stringify({ 
            accountId: account.id, 
            maxEmails: 10000 
          })
        });
        
        const syncResult = await syncResponse.json();
        
        if (syncResult.success) {
          console.log(`✅ Auto-sync completed: ${syncResult.totalSaved} emails synced`);
          
          return NextResponse.json({
            success: true,
            message: `IMAP account connected and ${syncResult.totalSaved} emails synced successfully!`,
            accountId: account.id,
            syncResult: {
              totalSaved: syncResult.totalSaved,
              breakdown: syncResult.breakdown
            }
          });
        } else {
          console.warn('⚠️ Auto-sync failed but account created:', syncResult.error);
          
          return NextResponse.json({
            success: true,
            message: 'IMAP account connected successfully. Email sync will be available shortly.',
            accountId: account.id,
            syncWarning: syncResult.error
          });
        }
      } catch (syncError) {
        console.warn('⚠️ Auto-sync failed but account created:', syncError);
        
        return NextResponse.json({
          success: true,
          message: 'IMAP account connected successfully. Email sync will be available shortly.',
          accountId: account.id,
          syncWarning: syncError instanceof Error ? syncError.message : 'Sync failed'
        });
      }
    } else {
      return NextResponse.json({
        success: true,
        message: existingAccount ? 'IMAP account updated successfully' : 'IMAP credentials stored successfully',
        accountId: account?.id,
      });
    }
  } catch (error: any) {
    console.error('Error in IMAP connect API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
