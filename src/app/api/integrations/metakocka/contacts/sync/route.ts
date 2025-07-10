/**
 * API Route for Metakocka Contact Synchronization
 * 
 * Handles syncing contacts between CRM and Metakocka
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ContactSyncService } from '@/lib/integrations/metakocka/contact-sync';
import { MetakockaError } from '@/lib/integrations/metakocka/types';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';

// Type definitions for mock mapping format
type MockMapping = {
  id: string;
  user_id: string;
  contact_id: string;
  metakocka_id: string;
  organization_id: string;
  synced_at: string;
  status: string;
};

// Type guard to check if the mapping is from the mock service
function isMockMapping(mapping: any): mapping is MockMapping {
  return 'metakocka_id' in mapping && 'synced_at' in mapping;
}
import { withAuth, checkOrgMembership, getContactSyncService } from '../../middleware';

// Create a Supabase client with the service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET - Get sync status for a contact or all contacts
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    try {
      // Check organization membership using the helper function
      const { hasAccess, error, status, orgIds } = await checkOrgMembership(userId, request);
      
      if (!hasAccess) {
        return NextResponse.json({ error }, { status });
      }
      
      const url = new URL(request.url);
      const contactId = url.searchParams.get('contactId') || undefined;
      
      // Get the appropriate service based on test mode
      const ContactSyncService = getContactSyncService(request);
      
      // Log the request
      MetakockaErrorLogger.logInfo(
        LogCategory.API,
        `Getting contact sync status${contactId ? ` for contact ${contactId}` : ' for all contacts'}`,
        { userId, contactId }
      );
      
      if (contactId) {
        // Get mapping for a specific contact
        const mapping = await ContactSyncService.getContactMapping(contactId, userId);
        
        if (!mapping) {
          return NextResponse.json({ synced: false }, { status: 200 });
        }
        
        // Handle different mapping formats between real and mock services
        let status, error, lastSyncedAt, metakockaId, metakockaCode;
        
        if (isMockMapping(mapping)) {
          // Mock service format
          status = mapping.status;
          error = null;
          lastSyncedAt = mapping.synced_at;
          metakockaId = mapping.metakocka_id;
          metakockaCode = '';
        } else {
          // Real ContactSyncService format
          status = mapping.syncStatus;
          error = mapping.syncError;
          lastSyncedAt = mapping.lastSyncedAt;
          metakockaId = mapping.metakockaId;
          metakockaCode = mapping.metakockaCode;
        }
        
        return NextResponse.json({
          synced: status === 'synced',
          status,
          error,
          lastSyncedAt,
          metakockaId,
          metakockaCode,
        }, { status: 200 });
      } else {
        // Get all contact IDs
        const { data: contacts, error } = await supabase
          .from('contacts')
          .select('id')
          .eq('user_id', userId);
        
        if (error || !contacts) {
          MetakockaErrorLogger.logError(
            LogCategory.API,
            `Failed to get contacts for user ${userId}`,
            { userId, error }
          );
          
          return NextResponse.json({ error: 'Failed to get contacts' }, { status: 500 });
        }
        
        // Get mappings for all contacts
        const contactIds = contacts.map(contact => contact.id);
        const mappings = await ContactSyncService.getContactMappings(contactIds, userId);
        
        return NextResponse.json({
          total: contactIds.length,
          synced: mappings.length,
          mappings: mappings.map(m => ({
            contactId: m.contactId,
            metakockaId: m.metakockaId,
            metakockaCode: m.metakockaCode,
            status: m.syncStatus,
            lastSyncedAt: m.lastSyncedAt,
          })),
        }, { status: 200 });
      }
    } catch (error) {
      console.error('Error getting contact sync status:', error);
      
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error getting contact sync status: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      
      return NextResponse.json({
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}

/**
 * POST - Sync a contact or multiple contacts to Metakocka
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
      
      // Get the appropriate service based on test mode
      const ContactSyncService = getContactSyncService(request);
      
      // Check if syncing a single contact or multiple
      if (body.contactId) {
        // Log the sync attempt for a single contact
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting sync of contact ${body.contactId} to Metakocka`,
          { userId, contactId: body.contactId }
        );
        
        // Get contact details
        const { data: contact, error } = await supabase
          .from('contacts')
          .select('*')
          .eq('id', body.contactId)
          .eq('user_id', userId)
          .single();
        
        if (error || !contact) {
          MetakockaErrorLogger.logError(
            LogCategory.API,
            `Contact not found: ${body.contactId}`,
            { userId, contactId: body.contactId, error }
          );
          
          return NextResponse.json({
            error: 'Contact not found',
          }, { status: 404 });
        }
        
        // Sync contact to Metakocka
        try {
          const metakockaId = await ContactSyncService.syncContactToMetakocka(userId, contact);
          
          return NextResponse.json({
            success: true,
            metakockaId,
          }, { status: 200 });
        } catch (syncError) {
          if (syncError instanceof MetakockaError) {
            // Log the sync error
            MetakockaErrorLogger.logError(
              LogCategory.SYNC,
              `Error syncing contact ${body.contactId} to Metakocka: ${syncError.message}`,
              { userId, contactId: body.contactId, error: syncError }
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
      } else {
        // Sync multiple contacts
        const contactIds = body.contactIds || [];
        
        // Log the bulk sync attempt
        MetakockaErrorLogger.logInfo(
          LogCategory.SYNC,
          `Starting bulk sync of ${contactIds.length} contacts to Metakocka`,
          { userId, details: { count: contactIds.length } }
        );
        
        const result = await ContactSyncService.syncContactsToMetakocka(userId, contactIds);
        
        // Add success property based on failed count for consistent response format
        const responseResult = {
          ...result,
          success: result.failed === 0
        };
        
        return NextResponse.json(responseResult, { status: responseResult.success ? 200 : 400 });
      }
    } catch (error) {
      console.error('Error syncing contact(s) to Metakocka:', error);
      
      // Log the error
      MetakockaErrorLogger.logError(
        LogCategory.API,
        `Error in contact sync to Metakocka API: ${error instanceof Error ? error.message : String(error)}`,
        { error }
      );
      
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  });
}
