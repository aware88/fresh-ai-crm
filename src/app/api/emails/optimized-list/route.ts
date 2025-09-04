import { NextRequest, NextResponse } from 'next/server';
import { initializeEmailSecurity, validateEmailAccountAccess, logEmailAccessAttempt } from '@/lib/email/security-validation';

export async function POST(request: NextRequest) {
  try {
    // Initialize security context
    const securityContext = await initializeEmailSecurity();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { emailAccountId, folder = 'INBOX', limit = 100, offset = 0 } = await request.json();

    if (!emailAccountId) {
      return NextResponse.json({ error: 'emailAccountId is required' }, { status: 400 });
    }

    // Validate email account access using centralized security
    const accountValidation = await validateEmailAccountAccess(emailAccountId, securityContext);
    
    if (!accountValidation.valid) {
      logEmailAccessAttempt(
        securityContext.userId, 
        'list_emails', 
        emailAccountId, 
        false, 
        { folder, error: accountValidation.error }
      );
      return NextResponse.json({ error: accountValidation.error }, { status: 404 });
    }

    // Load emails from email_index
    let query = securityContext.supabase
      .from('email_index')
      .select('*')
      .eq('email_account_id', emailAccountId);
    
    // Filter by folder
    if (folder && folder !== 'INBOX') {
      query = query.eq('folder_name', folder);
    } else {
      // For INBOX, get emails with folder_name = 'INBOX'
      query = query.eq('folder_name', 'INBOX');
    }
    
    const { data: emails, error } = await query
      .order('received_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error loading emails:', error);
      logEmailAccessAttempt(
        securityContext.userId, 
        'list_emails', 
        emailAccountId, 
        false, 
        { folder, error: error.message }
      );
      return NextResponse.json({ 
        success: false, 
        error: `Failed to load emails: ${error.message}` 
      }, { status: 500 });
    }

    console.log(`✅ Loaded ${emails?.length || 0} emails for account ${accountValidation.email}, folder ${folder}`);
    
    // Log successful access
    logEmailAccessAttempt(
      securityContext.userId, 
      'list_emails', 
      emailAccountId, 
      true, 
      { folder, count: emails?.length || 0 }
    );
    
    // Debug: Check for duplicates
    if (emails && emails.length > 0) {
      const uniqueIds = new Set(emails.map(e => e.message_id));
      if (uniqueIds.size !== emails.length) {
        console.warn(`⚠️ Duplicate emails in query result! ${emails.length} emails but only ${uniqueIds.size} unique IDs`);
      }
      
      // Log first 3 emails to verify they're different
      console.log('First 3 emails:');
      emails.slice(0, 3).forEach((email, i) => {
        console.log(`  ${i+1}. ${email.subject} (ID: ${email.message_id?.substring(0, 20)}...)`);
      });
    }

    return NextResponse.json({
      success: true,
      emails: emails || [],
      account: {
        id: accountValidation.accountId,
        email: accountValidation.email
      },
      folder,
      total: emails?.length || 0
    });

  } catch (error) {
    console.error('Error in optimized-list API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
