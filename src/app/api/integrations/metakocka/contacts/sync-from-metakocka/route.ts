/**
 * API Route for Metakocka Contact Synchronization (Metakocka to CRM)
 * 
 * Handles syncing contacts from Metakocka to CRM
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { ContactSyncService } from '@/lib/integrations/metakocka/contact-sync';
import { MetakockaError } from '@/lib/integrations/metakocka/types';
import { getSession } from '@/lib/auth/session';

/**
 * GET - Get list of Metakocka partners that are not yet synced to CRM
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Get unsynced partners from Metakocka
    const partners = await ContactSyncService.getUnsyncedPartnersFromMetakocka(userId);
    
    return NextResponse.json({
      total: partners.length,
      partners: partners.map(p => ({
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
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

/**
 * POST - Sync a partner from Metakocka to CRM
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
    
    // Check if metakockaId is provided
    if (!body.metakockaId) {
      return NextResponse.json({
        error: 'Metakocka partner ID is required',
      }, { status: 400 });
    }
    
    // Sync partner from Metakocka to CRM
    try {
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
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
