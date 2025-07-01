import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesDocumentSyncService } from '@/lib/integrations/metakocka/sales-document-sync';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/metakocka-error-logger';

/**
 * GET: Get unsynced sales documents from Metakocka
 * POST: Sync a specific sales document from Metakocka to CRM
 */
export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get unsynced sales documents from Metakocka
    const unsyncedDocuments = await SalesDocumentSyncService.getUnsyncedSalesDocumentsFromMetakocka(userId);
    
    return NextResponse.json({
      success: true,
      documents: unsyncedDocuments,
    });
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.API,
      `Error getting unsynced sales documents from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { metakockaId } = await req.json();
    
    if (!metakockaId) {
      return NextResponse.json(
        { error: 'Missing metakockaId parameter' },
        { status: 400 }
      );
    }
    
    // Sync the sales document from Metakocka to CRM
    const documentId = await SalesDocumentSyncService.syncSalesDocumentFromMetakocka(
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
      { error }
    );
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
