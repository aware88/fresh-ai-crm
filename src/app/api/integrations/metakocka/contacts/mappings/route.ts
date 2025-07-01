/**
 * API Route: Get contact mappings between CRM and Metakocka
 * 
 * Endpoints:
 * - GET /api/integrations/metakocka/contacts/mappings
 *   Gets all contact mappings for the current user
 * 
 * - GET /api/integrations/metakocka/contacts/mappings?contactId=xxx
 *   Gets mapping for a specific contact
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';
import { ContactSyncService } from '@/lib/integrations/metakocka/contact-sync';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';
import { getSession } from '@/lib/auth/session';

/**
 * GET handler for contact mappings
 */
export async function GET(request: NextRequest) {
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
    const contactId = request.nextUrl.searchParams.get('contactId');
    const supabase = createServerClient();
    
    // Log the request
    MetakockaErrorLogger.logInfo(
      LogCategory.API,
      `Fetching contact mappings${contactId ? ` for contact ${contactId}` : ''}`,
      { userId, contactId }
    );
    
    if (contactId) {
      // Get mapping for specific contact
      const mapping = await ContactSyncService.getContactMapping(contactId, userId);
      
      if (!mapping) {
        return NextResponse.json(
          { 
            success: false,
            error: 'No mapping found for this contact'
          },
          { status: 404 }
        );
      }
      
      return NextResponse.json({
        success: true,
        mapping
      });
    } else {
      // Get all mappings for user
      const { data, error } = await supabase
        .from('metakocka_contact_mappings')
        .select(`
          id,
          contact_id,
          metakocka_id,
          metakocka_code,
          last_synced_at,
          sync_status,
          sync_error,
          contacts:contact_id (
            id,
            firstname,
            lastname,
            full_name,
            company,
            email
          )
        `)
        .eq('user_id', userId)
        .order('last_synced_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      // Format the response
      const mappings = data.map((item: any) => ({
        id: item.id,
        contactId: item.contact_id,
        metakockaId: item.metakocka_id,
        metakockaCode: item.metakocka_code,
        lastSyncedAt: item.last_synced_at,
        syncStatus: item.sync_status,
        syncError: item.sync_error,
        contact: item.contacts ? {
          id: item.contacts.id,
          name: item.contacts.full_name || `${item.contacts.firstname || ''} ${item.contacts.lastname || ''}`.trim(),
          company: item.contacts.company,
          email: item.contacts.email
        } : null
      }));
      
      return NextResponse.json({
        success: true,
        mappings
      });
    }
  } catch (error) {
    console.error('Error in contact mappings API:', error);
    
    // Log the error
    MetakockaErrorLogger.logError(
      LogCategory.API,
      `Error in contact mappings API: ${error instanceof Error ? error.message : String(error)}`,
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
