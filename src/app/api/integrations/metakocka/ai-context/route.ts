/**
 * Metakocka AI Context API Route
 * 
 * This API route provides Metakocka data formatted for AI context and UI display.
 * It can be queried by document ID or user ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getMetakockaDataForAIContext } from '@/lib/integrations/metakocka/metakocka-ai-integration';
import { getSession } from '@/lib/auth/session';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify the user is authenticated
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    const userId = searchParams.get('userId');
    
    // Validate parameters
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing required parameter: userId' },
        { status: 400 }
      );
    }
    
    // If documentId is provided, verify the user has access to it
    if (documentId) {
      const supabase = await createServerClient();
      
      // Check if the document belongs to the user or their organization
      const { data: document, error } = await supabase
        .from('supplier_documents')
        .select('id, created_by')
        .eq('id', documentId)
        .single();
      
      if (error || !document) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }
      
      // Verify the user has access to this document
      if (document.created_by !== session.user.id) {
        // In a multi-tenant system, we would also check organization_id here
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }
    
    // Get Metakocka data for the specified user
    const metakockaData = await getMetakockaDataForAIContext(userId);
    
    if (!metakockaData) {
      return NextResponse.json(
        { error: 'No Metakocka integration found for this user' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(metakockaData);
  } catch (error: any) {
    console.error('Error in Metakocka AI context API:', error);
    
    return NextResponse.json(
      { error: 'Internal server error', message: error.message },
      { status: 500 }
    );
  }
}
