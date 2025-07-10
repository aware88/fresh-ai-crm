import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { withAuth, checkOrgMembership, getSalesDocumentSyncService } from '@/app/api/integrations/metakocka/middleware';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';

// Define an interface for services that have the required methods
interface SalesDocumentSyncFromMetakockaServiceType {
  getUnsyncedSalesDocumentsFromMetakocka: (userId: string) => Promise<any[]>;
  syncSalesDocumentFromMetakocka: (userId: string, metakockaId: string) => Promise<string>;
}

// Type guard to check if service has the required methods
function isSalesDocumentSyncFromMetakockaService(service: any): service is SalesDocumentSyncFromMetakockaServiceType {
  return typeof service.getUnsyncedSalesDocumentsFromMetakocka === 'function' && 
         typeof service.syncSalesDocumentFromMetakocka === 'function';
}

/**
 * GET: Get unsynced sales documents from Metakocka
 * POST: Sync a specific sales document from Metakocka to CRM
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership (bypassed in test mode)
      const orgCheckResult = await checkOrgMembership(userId, request);
      if (!orgCheckResult.hasAccess) {
        return NextResponse.json({ error: orgCheckResult.error }, { status: orgCheckResult.status });
      }
      
      // Get the appropriate service based on test mode
      const SalesDocumentSyncServiceToUse = getSalesDocumentSyncService(request);
      
      // Use type guard to ensure service has required methods
      if (!isSalesDocumentSyncFromMetakockaService(SalesDocumentSyncServiceToUse)) {
        return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
      }
      
      // Get unsynced sales documents from Metakocka
      const unsyncedDocuments = await SalesDocumentSyncServiceToUse.getUnsyncedSalesDocumentsFromMetakocka(userId);
      
      return NextResponse.json({
        success: true,
        documents: unsyncedDocuments,
      });
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error getting unsynced sales documents from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership (bypassed in test mode)
      const orgCheckResult = await checkOrgMembership(userId, request);
      if (!orgCheckResult.hasAccess) {
        return NextResponse.json({ error: orgCheckResult.error }, { status: orgCheckResult.status });
      }
      
      // Get the appropriate service based on test mode
      const SalesDocumentSyncServiceToUse = getSalesDocumentSyncService(request);
      
      // Use type guard to ensure service has required methods
      if (!isSalesDocumentSyncFromMetakockaService(SalesDocumentSyncServiceToUse)) {
        return NextResponse.json({ error: 'Service does not implement required methods' }, { status: 500 });
      }
      
      const { metakockaId } = await request.json();
      
      if (!metakockaId) {
        return NextResponse.json(
          { error: 'Missing metakockaId parameter' },
          { status: 400 }
        );
      }
      
      // Sync the sales document from Metakocka to CRM
      const documentId = await SalesDocumentSyncServiceToUse.syncSalesDocumentFromMetakocka(
        userId,
        metakockaId
      );
      
      return NextResponse.json({
        success: true,
        documentId,
        metakockaId,
      });
    } catch (error) {
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error syncing sales document from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { userId, error }
      );
      
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }
  });
}
