import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withAuth, checkOrgMembership, getSalesDocumentSyncService } from '../../middleware';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';
import { SalesDocumentSyncService } from '@/lib/integrations/metakocka/sales-document-sync';
import { MockSalesDocumentSyncService } from '@/lib/integrations/metakocka/mock-services';

// Define an interface for services that have the required methods
interface SalesDocumentSyncServiceType {
  getSalesDocumentMapping: (documentId: string, userId: string) => Promise<any>;
  getSalesDocumentMappings: (documentIds: string[], userId: string) => Promise<any[]>;
  syncSalesDocumentToMetakocka: (userId: string, document: any, items: any[]) => Promise<string>;
  syncSalesDocumentsToMetakocka: (userId: string, documentIds?: string[]) => Promise<any>;
}

// Type guard to check if service has the required methods
function isSalesDocumentSyncService(service: any): service is SalesDocumentSyncServiceType {
  return typeof service.getSalesDocumentMapping === 'function' && 
         typeof service.getSalesDocumentMappings === 'function' &&
         typeof service.syncSalesDocumentToMetakocka === 'function' &&
         typeof service.syncSalesDocumentsToMetakocka === 'function';
}

/**
 * GET: Get sync status for a sales document or all sales documents
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership
      const membershipCheck = await checkOrgMembership(userId, request);
      if (!membershipCheck.hasAccess) {
        return NextResponse.json({ error: membershipCheck.error }, { status: membershipCheck.status || 403 });
      }
      
      // Get the appropriate service based on test mode
      const SalesDocumentSyncServiceToUse = getSalesDocumentSyncService(request);
      
      const searchParams = request.nextUrl.searchParams;
      const documentId = searchParams.get('documentId');
    
    if (documentId) {
      // Get sync status for a specific document
      // Use type guard to ensure service has required methods
      if (!isSalesDocumentSyncService(SalesDocumentSyncServiceToUse)) {
        return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
      }
      const mapping = await SalesDocumentSyncServiceToUse.getSalesDocumentMapping(documentId, userId);
      
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
        // Use type guard to ensure service has required methods
        if (!isSalesDocumentSyncService(SalesDocumentSyncServiceToUse)) {
          return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
        }
        const mappings = await SalesDocumentSyncServiceToUse.getSalesDocumentMappings(documentIds, userId);
        
        return NextResponse.json({
          mappings,
        }, { status: 200 });
      }
      
      // No document ID provided, return empty response
      return NextResponse.json({ error: 'No document ID provided' }, { status: 400 });
    }
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error getting sales document sync status: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      return NextResponse.json({ error: 'Failed to get sync status' }, { status: 500 });
    }
  });
}

/**
 * POST: Sync a sales document to Metakocka
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership
      const membershipCheck = await checkOrgMembership(userId, request);
      if (!membershipCheck.hasAccess) {
        return NextResponse.json({ error: membershipCheck.error }, { status: membershipCheck.status || 403 });
      }
      
      // Get the appropriate service based on test mode
      const SalesDocumentSyncServiceToUse = getSalesDocumentSyncService(request);
    
      // Get request body
      const body = await request.json();
      const { documentId, documentIds } = body;
      
      if (documentId) {
        // Sync a single document
        const supabase = await createServerClient();
        
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
        
        // Use type guard to ensure service has required methods
        if (!isSalesDocumentSyncService(SalesDocumentSyncServiceToUse)) {
          return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
        }
        
        // Sync document
        const metakockaId = await SalesDocumentSyncServiceToUse.syncSalesDocumentToMetakocka(
          userId,
          document,
          items || []
        );
        
        return NextResponse.json({
          success: true,
          metakockaId,
        }, { status: 200 });
      } else if (documentIds && Array.isArray(documentIds)) {
        // Use type guard to ensure service has required methods
        if (!isSalesDocumentSyncService(SalesDocumentSyncServiceToUse)) {
          return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
        }
        
        // Sync multiple documents
        const result = await SalesDocumentSyncServiceToUse.syncSalesDocumentsToMetakocka(
          userId,
          documentIds
        );
        
        // Ensure consistent response format with success property
        const response = {
          ...result,
          success: true
        };
        
        return NextResponse.json(response, { status: 200 });
      } else {
        // Use type guard to ensure service has required methods
        if (!isSalesDocumentSyncService(SalesDocumentSyncServiceToUse)) {
          return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
        }
        
        // Sync all documents
        const result = await SalesDocumentSyncServiceToUse.syncSalesDocumentsToMetakocka(userId);
        
        // Ensure consistent response format with success property
        const response = {
          ...result,
          success: true
        };
        
        return NextResponse.json(response, { status: 200 });
      }
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error syncing sales document: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      return NextResponse.json({ 
        error: 'Failed to sync sales document',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 500 });
    }
  });
}
