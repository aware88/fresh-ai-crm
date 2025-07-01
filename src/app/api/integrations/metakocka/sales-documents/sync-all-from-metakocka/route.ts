import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SalesDocumentSyncService } from '@/lib/integrations/metakocka/sales-document-sync';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/metakocka-error-logger';

/**
 * POST: Sync all or specific sales documents from Metakocka to CRM
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { metakockaIds } = await req.json();
    
    // Log the sync attempt
    MetakockaErrorLogger.logInfo(
      LogCategory.API,
      `Starting sync of sales documents from Metakocka to CRM`,
      { userId, metakockaIds: metakockaIds?.length || 'all' }
    );
    
    // Sync sales documents from Metakocka to CRM
    const result = await SalesDocumentSyncService.syncSalesDocumentsFromMetakocka(
      userId,
      metakockaIds
    );
    
    return NextResponse.json({
      success: result.success,
      created: result.created,
      updated: result.updated,
      failed: result.failed,
      errors: result.errors,
    });
  } catch (error) {
    MetakockaErrorLogger.logError(
      LogCategory.API,
      `Error syncing sales documents from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
      { error }
    );
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
