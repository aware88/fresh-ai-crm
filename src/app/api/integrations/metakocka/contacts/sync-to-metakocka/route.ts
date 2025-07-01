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
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { ContactSyncToMetakockaService } from '@/lib/integrations/metakocka/contact-sync-to-metakocka';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';
import { getSession } from '@/lib/auth/session';

/**
 * POST handler for contact synchronization
 */
export async function POST(request: NextRequest) {
  try {
    // Get session and verify authentication
    const session = await getSession();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    const isBulk = request.nextUrl.searchParams.get('bulk') === 'true';
    
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
        { userId, contactCount: contactIds.length }
      );
      
      // Perform bulk sync
      const result = await ContactSyncToMetakockaService.syncContactsToMetakocka(
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
      
      // Perform single contact sync
      const metakockaId = await ContactSyncToMetakockaService.syncContactToMetakocka(
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
}
