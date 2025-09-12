import { NextRequest, NextResponse } from 'next/server';
import { initializeEmailSecurity, validateEmailAccountAccess, logEmailAccessAttempt } from '@/lib/email/security-validation';

async function handleEmailRequest(request: NextRequest) {
  try {
    // Initialize security context
    const securityContext = await initializeEmailSecurity();
    if (!securityContext) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let emailAccountId: string;
    let folder = 'INBOX';
    let limit = 100;
    let offset = 0;

    // Handle both GET and POST requests
    if (request.method === 'GET') {
      const { searchParams } = new URL(request.url);
      emailAccountId = searchParams.get('accountId') || '';
      folder = searchParams.get('folder') || 'INBOX';
      limit = parseInt(searchParams.get('limit') || '100');
      offset = parseInt(searchParams.get('offset') || '0');
    } else {
      const body = await request.json();
      emailAccountId = body.emailAccountId;
      folder = body.folder || 'INBOX';
      limit = body.limit || 100;
      offset = body.offset || 0;
    }

    if (!emailAccountId) {
      return NextResponse.json({ error: 'emailAccountId/accountId is required' }, { status: 400 });
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
      
      // Log first 3 emails to verify they're different and show preview data
      console.log('First 3 emails with preview data:');
      emails.slice(0, 3).forEach((email, i) => {
        console.log(`  ${i+1}. ${email.subject} (ID: ${email.message_id?.substring(0, 20)}...)`);
        console.log(`    Preview text: ${email.preview_text?.substring(0, 50)}...`);
      });
    }

    // Process emails to ensure good preview content
    const processedEmails = emails?.map(email => {
      // Helper function to extract text preview from content
      const extractPreview = (content: string, maxLength = 200) => {
        if (!content) return '';
        
        // Strip HTML tags if present
        let textContent = content.replace(/<[^>]*>/g, '');
        
        // Clean whitespace
        textContent = textContent.replace(/\s+/g, ' ').trim();
        
        // Return truncated content
        return textContent.length > maxLength 
          ? textContent.substring(0, maxLength) + '...'
          : textContent;
      };

      // Try different sources for preview content
      let enhancedPreview = email.preview_text;
      
      // If still no preview, try to extract from any text fields that might exist
      if (!enhancedPreview) {
        const textSources = [email.body_text, email.plain_content, email.text_content, email.content];
        for (const source of textSources) {
          if (source) {
            enhancedPreview = extractPreview(source);
            break;
          }
        }
      }

      return {
        ...email,
        preview_text: enhancedPreview || email.preview_text || '',
      };
    }) || [];

    return NextResponse.json({
      success: true,
      emails: processedEmails,
      account: {
        id: accountValidation.accountId,
        email: accountValidation.email
      },
      folder,
      total: processedEmails.length
    });

  } catch (error) {
    console.error('Error in optimized-list API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return handleEmailRequest(request);
}

export async function POST(request: NextRequest) {
  return handleEmailRequest(request);
}
