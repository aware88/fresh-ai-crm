import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { cookies } from 'next/headers';

// This endpoint is designed to be called by a scheduled task/cron job
// It scans for unprocessed emails in the supplier_emails table and processes any attachments

export async function GET(request: NextRequest) {
  try {
    // Check for API key authentication
    const authHeader = request.headers.get('authorization');
    const apiKey = process.env.CRON_API_KEY;
    
    // Verify API key if one is set in environment
    if (apiKey && (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.split(' ')[1] !== apiKey)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create a service-level Supabase client that can access all users' data
    // This is necessary because this endpoint is called by a cron job, not a user
    const supabase = createServerClient();
    
    // Get unprocessed emails
    const { data: emails, error: emailsError } = await supabase
      .from('supplier_emails')
      .select(`
        id, 
        supplier_id,
        subject,
        sender,
        received_date,
        has_attachments,
        processed,
        created_by
      `)
      .eq('processed', false)
      .eq('has_attachments', true)
      .order('received_date', { ascending: false });
    
    if (emailsError) {
      console.error('Error fetching unprocessed emails:', emailsError);
      return NextResponse.json({ error: 'Failed to fetch emails' }, { status: 500 });
    }
    
    if (!emails || emails.length === 0) {
      return NextResponse.json({ message: 'No unprocessed emails found' });
    }
    
    // Process each email
    const results = await Promise.all(emails.map(async (email: any) => {
      return await processEmail(supabase, email);
    }));
    
    return NextResponse.json({
      message: `Processed ${results.length} emails`,
      results
    });
  } catch (err) {
    console.error('Error in scan-emails API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

interface EmailAttachment {
  name: string;
  content: string;
  content_type?: string;
  size?: number;
}

interface EmailRecord {
  id: string;
  supplier_id: string;
  subject: string;
  sender: string;
  received_date: string;
  has_attachments: boolean;
  processed: boolean;
  created_by: string;
  body_html?: string;
  body_text?: string;
  attachments?: EmailAttachment[];
}

// Process a single email and its attachments
async function processEmail(supabase: any, email: EmailRecord) {
  try {
    // Get email details including attachments
    const { data: emailDetails, error: detailsError } = await supabase
      .from('supplier_emails')
      .select(`
        id,
        supplier_id,
        subject,
        body_html,
        body_text,
        attachments,
        created_by
      `)
      .eq('id', email.id)
      .single();
    
    if (detailsError || !emailDetails) {
      console.error(`Error fetching details for email ${email.id}:`, detailsError);
      return {
        emailId: email.id,
        status: 'error',
        message: 'Failed to fetch email details'
      };
    }
    
    // Check if there are attachments to process
    if (!emailDetails.attachments || emailDetails.attachments.length === 0) {
      // Mark email as processed even if there are no attachments
      await supabase
        .from('supplier_emails')
        .update({ processed: true })
        .eq('id', email.id);
        
      return {
        emailId: email.id,
        status: 'skipped',
        message: 'No attachments found'
      };
    }
    
    // Process each attachment
    const attachmentResults = await Promise.all((emailDetails.attachments || []).map(async (attachment: EmailAttachment) => {
      return await processAttachment(supabase, attachment, emailDetails);
    }));
    
    // Mark email as processed
    await supabase
      .from('supplier_emails')
      .update({ processed: true })
      .eq('id', email.id);
    
    return {
      emailId: email.id,
      status: 'success',
      attachments: attachmentResults
    };
  } catch (error) {
    console.error(`Error processing email ${email.id}:`, error);
    return {
      emailId: email.id,
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Process a single attachment
async function processAttachment(supabase: any, attachment: EmailAttachment, email: EmailRecord) {
  try {
    // Extract attachment details
    const { name, content, content_type: contentType, size } = attachment;
    
    // Skip if essential data is missing
    if (!name || !content) {
      return {
        name: name || 'unknown',
        status: 'skipped',
        message: 'Missing attachment data'
      };
    }
    
    // Determine file type from extension
    const fileExtension = name.split('.').pop()?.toLowerCase() || '';
    let fileType = '';
    
    if (['pdf'].includes(fileExtension)) {
      fileType = 'PDF';
    } else if (['xls', 'xlsx'].includes(fileExtension)) {
      fileType = 'Excel';
    } else if (['csv'].includes(fileExtension)) {
      fileType = 'CSV';
    } else if (['doc', 'docx'].includes(fileExtension)) {
      fileType = 'Word';
    } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
      fileType = 'Image';
    } else {
      fileType = 'Other';
    }
    
    // Determine document type based on filename or email subject
    // This is a simple heuristic and could be improved with AI
    let documentType = 'Other';
    const subject = email.subject.toLowerCase();
    const fileName = name.toLowerCase();
    
    if (subject.includes('invoice') || fileName.includes('invoice')) {
      documentType = 'Invoice';
    } else if (subject.includes('price') || fileName.includes('price') || 
               subject.includes('pricing') || fileName.includes('pricing')) {
      documentType = 'Price List';
    } else if (subject.includes('catalog') || fileName.includes('catalog')) {
      documentType = 'Catalog';
    } else if (subject.includes('spec') || fileName.includes('spec')) {
      documentType = 'Specification';
    } else if (subject.includes('coa') || fileName.includes('coa') || 
               subject.includes('certificate') || fileName.includes('certificate')) {
      documentType = 'CoA';
    }
    
    // Create a unique file path
    const timestamp = Date.now();
    const filePath = `supplier-documents/${email.created_by}/${email.supplier_id}/${timestamp}-${name}`;
    
    // Convert base64 content to buffer
    const buffer = Buffer.from(content, 'base64');
    
    // Upload to storage
    const { data: storageData, error: storageError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: contentType || 'application/octet-stream',
        upsert: false
      });
    
    if (storageError) {
      console.error('Error uploading attachment to storage:', storageError);
      return {
        name,
        status: 'error',
        message: 'Failed to upload attachment'
      };
    }
    
    // Create metadata for additional document information
    const metadata = {
      original_name: name,
      content_type: contentType || 'application/octet-stream',
      size: size || buffer.length,
      upload_timestamp: timestamp,
      from_email: true,
      email_id: email.id,
      email_subject: email.subject
    };
    
    // Insert record into supplier_documents table
    const { data: documentData, error: documentError } = await supabase
      .from('supplier_documents')
      .insert({
        supplier_id: email.supplier_id,
        file_name: name,
        file_type: fileType,
        document_type: documentType,
        file_path: filePath,
        metadata: metadata,
        created_by: email.created_by,
        processing_status: 'pending' // Initial status for AI processing
      })
      .select()
      .single();
    
    if (documentError) {
      console.error('Error creating document record:', documentError);
      return {
        name,
        status: 'error',
        message: 'Failed to create document record'
      };
    }
    
    // Trigger AI processing for the document
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/documents/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Service-Token': process.env.SERVICE_TOKEN || ''
        },
        body: JSON.stringify({ 
          documentId: documentData.id,
          userId: email.created_by
        })
      });
      
      if (!response.ok) {
        console.warn(`AI processing request failed for document ${documentData.id}`);
      }
    } catch (processingError) {
      console.error('Error triggering AI processing:', processingError);
      // Don't fail the whole operation if AI processing fails
    }
    
    return {
      name,
      status: 'success',
      documentId: documentData.id,
      documentType
    };
  } catch (error) {
    console.error(`Error processing attachment ${attachment.name}:`, error);
    return {
      name: attachment.name || 'unknown',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
