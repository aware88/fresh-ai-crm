/**
 * API route handler for syncing orders from Metakocka to CRM
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrderService } from '@/lib/integrations/metakocka/order-service';
import { getMetakockaCredentials } from '@/lib/integrations/metakocka/credentials';
import { ApiError, handleApiError } from '@/lib/api-utils';

/**
 * GET handler for retrieving unsynced orders from Metakocka
 */
export async function GET(request: NextRequest) {
  try {
    // Get the user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    const userId = session.user.id;
    
    // Get Metakocka credentials
    const credentials = await getMetakockaCredentials(userId);
    
    if (!credentials) {
      throw new ApiError(400, 'Metakocka credentials not found');
    }
    
    // Initialize the order service
    const orderService = new OrderService(
      credentials.secretKey,
      credentials.companyId,
      userId
    );
    
    // Get all existing mappings for this user
    const { data: mappings } = await supabase
      .from('sales_document_mappings')
      .select('metakocka_id')
      .eq('user_id', userId)
      .eq('metakocka_document_type', 'narocilo_kupca');
    
    const syncedIds = mappings ? mappings.map(m => m.metakocka_id) : [];
    
    // Get unsynced orders from Metakocka
    const unsyncedOrders = await orderService.getUnsyncedOrdersFromMetakocka(syncedIds);
    
    return NextResponse.json({ unsyncedOrders }, { status: 200 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST handler for syncing orders from Metakocka to CRM
 */
export async function POST(request: NextRequest) {
  try {
    // Get the user session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    const userId = session.user.id;
    const requestData = await request.json();
    const { metakockaId, metakockaIds } = requestData;
    
    // Get Metakocka credentials
    const credentials = await getMetakockaCredentials(userId);
    
    if (!credentials) {
      throw new ApiError(400, 'Metakocka credentials not found');
    }
    
    // Initialize the order service
    const orderService = new OrderService(
      credentials.secretKey,
      credentials.companyId,
      userId
    );
    
    if (metakockaId) {
      // Sync a single order from Metakocka
      const result = await orderService.syncOrderFromMetakocka(metakockaId);
      
      if (result.success && result.orderId) {
        // Create or update mapping
        const mappingData = {
          user_id: userId,
          document_id: result.orderId,
          metakocka_id: metakockaId,
          metakocka_document_type: 'narocilo_kupca',
          sync_direction: 'metakocka_to_crm',
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced'
        };
        
        // Check if mapping already exists
        const { data: existingMapping } = await supabase
          .from('sales_document_mappings')
          .select('id')
          .eq('metakocka_id', metakockaId)
          .eq('user_id', userId)
          .single();
        
        if (existingMapping) {
          // Update existing mapping
          await supabase
            .from('sales_document_mappings')
            .update(mappingData)
            .eq('id', existingMapping.id);
        } else {
          // Create new mapping
          await supabase
            .from('sales_document_mappings')
            .insert([mappingData]);
        }
      }
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } else if (metakockaIds && Array.isArray(metakockaIds)) {
      // Sync multiple orders from Metakocka
      const results = {
        success: true,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [] as Array<{ metakockaId: string; error: string }>
      };
      
      for (const id of metakockaIds) {
        const result = await orderService.syncOrderFromMetakocka(id);
        
        if (result.success && result.orderId) {
          // Create or update mapping
          const mappingData = {
            user_id: userId,
            document_id: result.orderId,
            metakocka_id: id,
            metakocka_document_type: 'narocilo_kupca',
            sync_direction: 'metakocka_to_crm',
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced'
          };
          
          // Check if mapping already exists
          const { data: existingMapping } = await supabase
            .from('sales_document_mappings')
            .select('id, document_id')
            .eq('metakocka_id', id)
            .eq('user_id', userId)
            .single();
          
          if (existingMapping) {
            // Update existing mapping
            await supabase
              .from('sales_document_mappings')
              .update(mappingData)
              .eq('id', existingMapping.id);
            
            results.updated++;
          } else {
            // Create new mapping
            await supabase
              .from('sales_document_mappings')
              .insert([mappingData]);
            
            results.created++;
          }
        } else {
          results.failed++;
          results.errors.push({
            metakockaId: id,
            error: result.error || 'Unknown error'
          });
        }
      }
      
      results.success = results.failed === 0;
      return NextResponse.json(results, { status: 200 });
    } else {
      throw new ApiError(400, 'Missing metakockaId or metakockaIds parameter');
    }
  } catch (error) {
    return handleApiError(error);
  }
}
