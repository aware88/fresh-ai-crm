/**
 * API Route for Bulk Metakocka Contact Synchronization (Metakocka to CRM)
 * 
 * Handles syncing multiple contacts from Metakocka to CRM
 */
import { NextRequest, NextResponse } from 'next/server';
import { ContactSyncService } from '@/lib/integrations/metakocka/contact-sync';
import { MetakockaError } from '@/lib/integrations/metakocka/types';
import { getSession } from '@/lib/auth/session';

/**
 * POST - Sync multiple contacts from Metakocka to CRM
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const body = await request.json();
    
    // Get metakockaIds from request body (optional)
    const metakockaIds = body.metakockaIds || [];
    
    // Sync contacts from Metakocka to CRM
    try {
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
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
