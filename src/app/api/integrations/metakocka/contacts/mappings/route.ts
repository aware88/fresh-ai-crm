/**
 * API Route: /api/integrations/metakocka/contacts/mappings
 * 
 * Endpoints:
 * - GET /api/integrations/metakocka/contacts/mappings
 *   Gets all mappings for the current user
 * 
 * - GET /api/integrations/metakocka/contacts/mappings?contactId=xxx
 *   Gets mapping for a specific contact
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { ContactSyncService } from '@/lib/integrations/metakocka/contact-sync';
import { MetakockaErrorLogger, LogCategory } from '@/lib/integrations/metakocka/error-logger';
import { withAuth, checkOrgMembership, getContactSyncService } from '../../middleware';

// Create a Supabase client with the service role key
const createServiceRoleClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing required environment variables for Supabase service client');
  }
  
  try {
    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    return client;
  } catch (error) {
    console.error('Error creating Supabase service client:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId: string, request: NextRequest) => {
    // Extract query params
    const url = new URL(request.url);
    const contactId = url.searchParams.get('contactId');
    
    try {

      // Log the request
      MetakockaErrorLogger.logInfo(
        LogCategory.SYNC,
        `GET contact mappings${contactId ? ` for contact ${contactId}` : ''}`,
        { userId, contactId: contactId || undefined }
      );

      // Get mappings from database using service role client to bypass RLS
      const supabase = createServiceRoleClient();
      
      // Check organization membership using the helper function
      const { hasAccess, error, status, orgIds = [] } = await checkOrgMembership(userId, request);
      
      if (!hasAccess) {
        return NextResponse.json({ error }, { status });
      }
      
      // Get the appropriate service based on test mode
      const ContactSyncService = getContactSyncService(request);
      
      if (contactId) {
        // Get mapping for specific contact
        if (request.headers.get('x-test-mode') === 'true') {
          // Use mock service in test mode
          const mapping = await ContactSyncService.getContactMapping(contactId, userId);
          return NextResponse.json({ mapping });
        } else {
          // Use database in normal mode
          const { data: mappings, error: mappingsError } = await supabase
            .from('metakocka_contact_mappings')
            .select('*')
            .eq('contact_id', contactId)
            .in('organization_id', orgIds);
          
          if (mappingsError) {
            return NextResponse.json(
              { error: `Failed to get mapping: ${mappingsError.message}` },
              { status: 500 }
            );
          }
          
          const mapping = mappings && mappings.length > 0 ? mappings[0] : null;
          
          if (!mapping) {
            return NextResponse.json(
              { error: 'Contact mapping not found' },
              { status: 404 }
            );
          }
          
          return NextResponse.json({
            mapping
          });
        }
      } else {
        // Get all mappings for user's organizations
        if (request.headers.get('x-test-mode') === 'true') {
          // Use mock service in test mode
          // In test mode, we'll just get all mappings without filtering by contact IDs
          const mappings = await ContactSyncService.getContactMappings([], userId);
          return NextResponse.json({ mappings });
        } else {
          // Use database in normal mode
          const { data: mappings, error: mappingsError } = await supabase
            .from('metakocka_contact_mappings')
            .select(`
              id,
              user_id,
              contact_id,
              metakocka_id,
              metakocka_code,
              last_synced_at,
              sync_status,
              sync_error,
              created_at,
              updated_at,
              organization_id
            `)
            .in('organization_id', orgIds);
          
          if (mappingsError) {
            return NextResponse.json(
              { error: `Failed to get mappings: ${mappingsError.message}` },
              { status: 500 }
            );
          }
          
          return NextResponse.json({
            mappings: mappings || []
          });
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      MetakockaErrorLogger.logError(
        LogCategory.SYNC,
        `Error fetching contact mappings: ${errorMessage}`,
        { userId, contactId: contactId || undefined, error }
      );
      
      return NextResponse.json(
        { error: `Failed to get contact mappings: ${errorMessage}` },
        { status: 500 }
      );
    }
  });
}
