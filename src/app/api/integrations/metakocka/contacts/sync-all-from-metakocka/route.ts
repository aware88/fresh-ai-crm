/**
 * API Route for Bulk Metakocka Contact Synchronization (Metakocka to CRM)
 * 
 * Handles syncing multiple contacts from Metakocka to CRM
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';
import { MetakockaError } from '@/lib/integrations/metakocka/types';
import { withAuth, checkOrgMembership, getContactSyncService } from '../../middleware';

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST - Sync multiple contacts from Metakocka to CRM
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership using the helper function
      const { hasAccess, error, status } = await checkOrgMembership(userId, request);
      
      if (!hasAccess) {
        return NextResponse.json({ error }, { status });
      }
      
      const body = await request.json();
      
      // Get metakockaIds from request body (optional)
      const metakockaIds = body.metakockaIds || [];
      
      // Log the sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting bulk sync of ${metakockaIds.length} Metakocka partners to CRM`,
        { userId, details: { count: metakockaIds.length } }
      );
      
      // Sync contacts from Metakocka to CRM
      try {
        // Get the appropriate service based on test mode
        const ContactSyncService = getContactSyncService(request);
        
        const result = await ContactSyncService.syncContactsFromMetakocka(
          userId,
          metakockaIds
        );
        
        return NextResponse.json({
          success: result.success,
          created: result.created,
          updated: result.updated,
          failed: result.failed,
          errors: result.errors
        }, { status: result.success ? 200 : 400 });
      } catch (syncError) {
        if (syncError instanceof MetakockaError) {
          // Log the sync error
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Error in bulk sync from Metakocka to CRM: ${syncError.message}`,
            { userId, error: syncError }
          );
          
          return NextResponse.json({
            success: false,
            error: syncError.message,
            errorType: syncError.type,
            errorCode: syncError.code,
          }, { status: 400 });
        }
        
        throw syncError;
      }
    } catch (error) {
      console.error('Error syncing contacts from Metakocka:', error);
      
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error in bulk contact sync from Metakocka API: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}
