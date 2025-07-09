import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { supabase } from '@/lib/supabaseClient';
import { getEmailAIContext } from '@/lib/integrations/metakocka/email-context-builder';
import { generateServiceToken } from '@/lib/auth/serviceToken';
import { analyzeEmail } from '@/lib/openai/client';

// GET /api/emails/ai-context?emailId=xxx
// Get AI context for a specific email
export async function GET(req: NextRequest) {
  try {
    // Get the session using getServerSession
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized - Please sign in' }, 
        { status: 401 }
      );
    }
    
    const userId = session.user.id;

    // Get the email ID from the query parameters
    const url = new URL(req.url);
    const emailId = url.searchParams.get('emailId');
    
    if (!emailId) {
      return NextResponse.json(
        { success: false, message: 'Email ID is required' }, 
        { status: 400 }
      );
    }

    // Get AI context for the email
    const aiContext = await getEmailAIContext(emailId, userId);
    
    return NextResponse.json(
      { 
        success: true, 
        data: {
          emailId,
          aiContext
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching email AI context:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}

// POST /api/emails/ai-context
// Generate AI response for an email using Metakocka context
export async function POST(req: NextRequest) {
  try {
    // Check for service token in header
    const serviceTokenHeader = req.headers.get('x-service-token');
    const isServiceRequest = serviceTokenHeader && serviceTokenHeader === generateServiceToken();
    
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
      const session = await getServerSession();
      if (!session?.user) {
        return NextResponse.json(
          { success: false, message: 'Unauthorized - Please sign in' }, 
          { status: 401 }
        );
      }
      
      userId = session.user.id;
    }

    // Parse the request body
    const body = await req.json();
    const { emailId, prompt } = body;
    
    if (!emailId) {
      return NextResponse.json(
        { success: false, message: 'Email ID is required' }, 
        { status: 400 }
      );
    }

    if (!prompt) {
      return NextResponse.json(
        { success: false, message: 'Prompt is required' }, 
        { status: 400 }
      );
    }

    // Get AI context for the email
    const aiContext = await getEmailAIContext(emailId, userId);
    
    // Get the email content
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('subject, raw_content')
      .eq('id', emailId)
      .eq('created_by', userId)
      .single();
    
    if (emailError || !email) {
      return NextResponse.json(
        { success: false, message: emailError?.message || 'Email not found' }, 
        { status: 404 }
      );
    }

    // Prepare the email content with subject and body
    const emailContent = `Subject: ${email.subject}\n\n${email.raw_content}`;
    
    // Generate AI response using the analyzeEmail function with sales tactics context
    const aiResponse = await analyzeEmail(emailContent, aiContext);
    
    // Save the AI response to the database
    const { data: savedResponse, error: saveError } = await supabase
      .from('email_ai_responses')
      .insert({
        email_id: emailId,
        prompt,
        response: aiResponse,
        context_used: aiContext,
        created_by: userId
      })
      .select()
      .single();
    
    if (saveError) {
      console.error('Error saving AI response:', saveError);
    }

    return NextResponse.json(
      { 
        success: true, 
        data: {
          emailId,
          prompt,
          response: aiResponse,
          responseId: savedResponse?.id
        }
      }, 
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating AI response:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Server error' 
      }, 
      { status: 500 }
    );
  }
}
