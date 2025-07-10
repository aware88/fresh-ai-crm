/**
 * API Route for Metakocka Contact Synchronization (Metakocka to CRM)
 * 
 * Handles syncing contacts from Metakocka to CRM
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
 * GET - Get list of Metakocka partners that are not yet synced to CRM
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership using the helper function
      const { hasAccess, error, status } = await checkOrgMembership(userId, request);
      
      if (!hasAccess) {
        return NextResponse.json({ error }, { status });
      }
      
      // Log the request
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Getting unsynced partners from Metakocka for user ${userId}`,
        { userId }
      );
      
      // Get the appropriate service based on test mode
      const ContactSyncService = getContactSyncService(request);
      
      // Get unsynced partners from Metakocka
      const partners = await ContactSyncService.getUnsyncedPartnersFromMetakocka(userId);
      
      return NextResponse.json({
        total: partners.length,
        partners: partners.map((p: any) => ({
          id: p.mk_id,
          code: p.count_code,
          name: p.name,
          email: p.email,
          phone: p.phone,
          type: p.partner_type,
        })),
      }, { status: 200 });
    } catch (error) {
      console.error('Error getting unsynced partners from Metakocka:', error);
      
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error getting unsynced partners from Metakocka: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}

/**
 * POST - Sync a partner from Metakocka to CRM
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
      
      // Check if metakockaId is provided
      if (!body.metakockaId) {
        return NextResponse.json({
          error: 'Metakocka partner ID is required',
        }, { status: 400 });
      }
      
      // Log the sync attempt
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `Starting sync of Metakocka partner ${body.metakockaId} to CRM`,
        { userId, metakockaId: body.metakockaId }
      );
      
      // Sync partner from Metakocka to CRM
      try {
        // Get the appropriate service based on test mode
        const ContactSyncService = getContactSyncService(request);
        
        const contactId = await ContactSyncService.syncContactFromMetakocka(
          userId,
          body.metakockaId
        );
        
        return NextResponse.json({
          success: true,
          contactId,
        }, { status: 200 });
      } catch (syncError) {
        if (syncError instanceof MetakockaError) {
          // Log the sync error
          MetakockaErrorLogger.logError(
            LogCategory.SYNC,
            `Error syncing Metakocka partner ${body.metakockaId} to CRM: ${syncError.message}`,
            { userId, metakockaId: body.metakockaId, error: syncError }
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
      console.error('Error syncing partner from Metakocka:', error);
      
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error in Metakocka partner sync API: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}
