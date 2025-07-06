import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { buildEmailProcessingContext } from '@/lib/ai/email-context-builder-with-recommendations';

/**
 * GET handler for email context with product recommendations
 * 
 * @param request - The incoming request
 * @param { params } - Route parameters
 * @returns A response with email context including product recommendations
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const emailId = params.id;
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
        { status: 400 }
      );
    }
    
    // Get the email context with product recommendations
    const context = await buildEmailProcessingContext(emailId);
    
    return NextResponse.json(context);
  } catch (error: any) {
    console.error('Error in email context API:', error);
    return NextResponse.json(
      { error: 'Failed to get email context', message: error.message },
      { status: 500 }
    );
  }
}
