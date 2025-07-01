/**
 * API Route for Metakocka Contact Synchronization
 * 
 * Handles syncing contacts between CRM and Metakocka
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ContactSyncService } from '@/lib/integrations/metakocka/contact-sync';
import { MetakockaError } from '@/lib/integrations/metakocka/types';
import { getSession } from '@/lib/auth/session';

/**
 * GET - Get sync status for a contact or all contacts
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');
    
    if (contactId) {
      // Get mapping for a specific contact
      const mapping = await ContactSyncService.getContactMapping(contactId, userId);
      
      if (!mapping) {
        return NextResponse.json({ synced: false }, { status: 200 });
      }
      
      return NextResponse.json({
        synced: mapping.syncStatus === 'synced',
        status: mapping.syncStatus,
        error: mapping.syncError,
        lastSyncedAt: mapping.lastSyncedAt,
        metakockaId: mapping.metakockaId,
        metakockaCode: mapping.metakockaCode,
      }, { status: 200 });
    } else {
      // Get all contact IDs
      const supabase = createServerClient();
      
      const { data: contacts, error } = await supabase
        .from('contacts')
        .select('id')
        .eq('user_id', userId);
      
      if (error || !contacts) {
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
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST - Sync a contact or multiple contacts to Metakocka
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
    
    // Check if syncing a single contact or multiple
    if (body.contactId) {
      // Get contact details
      const supabase = createServerClient();
      
      const { data: contact, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', body.contactId)
        .eq('user_id', userId)
        .single();
      
      if (error || !contact) {
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
      const result = await ContactSyncService.syncContactsToMetakocka(userId, contactIds);
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    }
  } catch (error) {
    console.error('Error syncing contact(s) to Metakocka:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
