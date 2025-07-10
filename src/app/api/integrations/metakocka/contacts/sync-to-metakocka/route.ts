/**
 * API Route: Sync contacts from CRM to Metakocka
 * 
 * Endpoints:
 * - POST /api/integrations/metakocka/contacts/sync-to-metakocka
 *   Syncs a single contact from CRM to Metakocka
 * 
 * - POST /api/integrations/metakocka/contacts/sync-to-metakocka?bulk=true
 *   Syncs multiple contacts from CRM to Metakocka
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';
import { withAuth, checkOrgMembership, getContactSyncToMetakockaService } from '../../middleware';

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * POST handler for contact synchronization
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      const isBulk = request.nextUrl.searchParams.get('bulk') === 'true';
      
      // Check organization membership using the helper function
      const { hasAccess, error, status, orgIds } = await checkOrgMembership(userId, request);
      
      if (!hasAccess) {
        return NextResponse.json({ error }, { status });
      }
      
      // Parse request body
      const body = await request.json();
      
      if (isBulk) {
        // Bulk sync
        const { contactIds } = body;
        
        if (!contactIds || !Array.isArray(contactIds)) {
          return NextResponse.json(
            { error: 'Invalid request. contactIds array is required for bulk sync.' },
            { status: 400 }
          );
        }
        
        // Log the sync attempt
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting bulk sync of ${contactIds.length} contacts to Metakocka`,
          { userId, details: { count: contactIds.length } }
        );
        
        // Get the appropriate service based on test mode
        const ContactSyncService = getContactSyncToMetakockaService(request);
        
        // Perform bulk sync
        const result = await ContactSyncService.syncContactsToMetakocka(
          userId,
          contactIds
        );
        
        return NextResponse.json(result);
      } else {
        // Single contact sync
        const { contactId } = body;
        
        if (!contactId) {
          return NextResponse.json(
            { error: 'Invalid request. contactId is required.' },
            { status: 400 }
          );
        }
        
        // Log the sync attempt
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting sync of contact ${contactId} to Metakocka`,
          { userId, contactId }
        );
        
        // Get the appropriate service based on test mode
        const ContactSyncService = getContactSyncToMetakockaService(request);
        
        // Perform single contact sync
        const metakockaId = await ContactSyncService.syncContactToMetakocka(
          userId,
          contactId
        );
        
        return NextResponse.json({
          success: true,
          metakockaId
        });
      }
    } catch (error) {
      console.error('Error in contact sync to Metakocka API:', error);
      
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error in contact sync to Metakocka API: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        },
        { status: 500 }
      );
    }
  });
}
