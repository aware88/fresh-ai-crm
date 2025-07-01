import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';
import { enrichEmailWithMetakockaData, processUnprocessedEmails } from '@/lib/integrations/metakocka/email-enricher';
import { getServiceToken } from '@/lib/auth/serviceToken';

// GET /api/emails/metakocka?emailId=xxx
// Get Metakocka metadata for a specific email
export async function GET(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }

    // Get the user ID from the session
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Error fetching user data' }, 
        { status: 401 }
      );
    }
    const userId = userData.user.id;

    // Get the email ID from the query parameters
    const url = new URL(req.url);
    const emailId = url.searchParams.get('emailId');
    
    if (!emailId) {
      return NextResponse.json(
        { success: false, message: 'Email ID is required' }, 
        { status: 400 }
      );
    }

    // Fetch the email with its Metakocka metadata
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select(`
        id,
        sender,
        subject,
        metakocka_metadata,
        email_metakocka_contact_mappings (
          id,
          metakocka_contact_id,
          confidence,
          metakocka_mapping_id
        ),
        email_metakocka_document_mappings (
          id,
          metakocka_document_id,
          document_type,
          confidence,
          metakocka_mapping_id
        )
      `)
      .eq('id', emailId)
      .eq('created_by', userId)
      .single();
    
    if (emailError || !email) {
      return NextResponse.json(
        { success: false, message: emailError?.message || 'Email not found' }, 
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, data: email }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching email Metakocka metadata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}

// POST /api/emails/metakocka
// Process an email to extract Metakocka metadata
export async function POST(req: NextRequest) {
  try {
    // Check for service token in header
    const serviceTokenHeader = req.headers.get('x-service-token');
    const isServiceRequest = serviceTokenHeader && serviceTokenHeader === getServiceToken();
    
    let userId: string;
    
    // Handle authentication based on request type
    if (isServiceRequest) {
      // For service requests, get the user ID from the request body
      const body = await req.json();
      userId = body.userId;
      
      if (!userId) {
        return NextResponse.json(
          { success: false, message: 'User ID is required for service requests' }, 
          { status: 400 }
        );
      }
    } else {
      // For user requests, get the user ID from the session
      const session = await getServerSession(authOptions);
      if (!session?.user?.email) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized - Please sign in' }, 
          { status: 401 }
        );
      }
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        return NextResponse.json(
          { success: false, message: 'Error fetching user data' }, 
          { status: 401 }
        );
      }
      userId = userData.user.id;
    }

    // Parse the request body
    const body = await req.json();
    
    // Check if this is a batch processing request
    if (body.processBatch === true) {
      const limit = body.limit || 10;
      const result = await processUnprocessedEmails(userId, limit);
      
      return NextResponse.json(
        { 
          success: true, 
          processed: result.processed,
          errors: result.errors,
          details: result.details
        }, 
        { status: 200 }
      );
    }
    
    // Otherwise, process a single email
    const { emailId } = body;
    
    if (!emailId) {
      return NextResponse.json(
        { success: false, message: 'Email ID is required' }, 
        { status: 400 }
      );
    }

    // Enrich the email with Metakocka data
    const result = await enrichEmailWithMetakockaData(emailId, userId);
    
    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.error || 'Error enriching email' }, 
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: true, 
        data: {
          emailId: result.emailId,
          contactMappings: result.contactMappings,
          documentMappings: result.documentMappings
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error processing email for Metakocka metadata:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}
