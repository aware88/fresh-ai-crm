import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { SalesDocumentSyncService } from '@/lib/integrations/metakocka/sales-document-sync';
import { validateServiceToken } from '@/lib/auth/serviceToken';
import { getSession } from '@/lib/auth/session';

/**
 * GET: Get sync status for a sales document or all sales documents
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const searchParams = request.nextUrl.searchParams;
    const documentId = searchParams.get('documentId');
    
    if (documentId) {
      // Get sync status for a specific document
      const mapping = await SalesDocumentSyncService.getSalesDocumentMapping(documentId, userId);
      
      if (!mapping) {
        return NextResponse.json({ synced: false }, { status: 200 });
      }
      
      return NextResponse.json({
        synced: true,
        mapping,
      }, { status: 200 });
    } else {
      // Get all document IDs from query params
      const documentIds = searchParams.get('documentIds')?.split(',') || [];
      
      if (documentIds.length > 0) {
        // Get sync status for multiple documents
        const mappings = await SalesDocumentSyncService.getSalesDocumentMappings(documentIds, userId);
        
        return NextResponse.json({
          mappings,
        }, { status: 200 });
      }
      
      // No document ID provided, return empty response
      return NextResponse.json({ error: 'No document ID provided' }, { status: 400 });
    }
  } catch (error) {
    console.error('Error getting sales document sync status:', error);
    return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
  }
}

/**
 * POST: Sync a sales document to Metakocka
 */
export async function POST(request: NextRequest) {
  try {
    // Check for service token first
    const serviceTokenHeader = request.headers.get('X-Service-Token');
    let userId: string;
    
    if (serviceTokenHeader) {
      // Validate service token
      const isValid = validateServiceToken(serviceTokenHeader);
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid service token' }, { status: 401 });
      }
      
      // For service token requests, user ID must be in the request body
      const body = await request.json();
      userId = body.userId;
      
      if (!userId) {
        return NextResponse.json({ error: 'User ID is required for service token requests' }, { status: 400 });
      }
    } else {
      // Authenticate user
      const session = await getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      userId = session.user.id;
    }
    
    // Get request body
    const body = await request.json();
    const { documentId, documentIds } = body;
    
    if (documentId) {
      // Sync a single document
      const supabase = createServerClient();
      
      // Get document details
      const { data: document, error: documentError } = await supabase
        .from('sales_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', userId)
        .single();
      
      if (documentError || !document) {
        return NextResponse.json({ error: 'Document not found' }, { status: 404 });
      }
      
      // Get document items
      const { data: items, error: itemsError } = await supabase
        .from('sales_document_items')
        .select('*')
        .eq('document_id', documentId);
      
      if (itemsError) {
        return NextResponse.json({ error: 'Failed to fetch document items' }, { status: 500 });
      }
      
      // Sync document
      const metakockaId = await SalesDocumentSyncService.syncSalesDocumentToMetakocka(
        userId,
        document,
        items || []
      );
      
      return NextResponse.json({
        success: true,
        metakockaId,
      }, { status: 200 });
    } else if (documentIds && Array.isArray(documentIds)) {
      // Sync multiple documents
      const result = await SalesDocumentSyncService.syncSalesDocumentsToMetakocka(
        userId,
        documentIds
      );
      
      return NextResponse.json(result, { status: 200 });
    } else {
      // Sync all documents
      const result = await SalesDocumentSyncService.syncSalesDocumentsToMetakocka(userId);
      
      return NextResponse.json(result, { status: 200 });
    }
  } catch (error) {
    console.error('Error syncing sales document:', error);
    return NextResponse.json({ 
      error: 'Failed to sync sales document',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
