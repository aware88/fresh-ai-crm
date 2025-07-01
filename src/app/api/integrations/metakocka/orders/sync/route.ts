/**
 * API route handler for order synchronization with Metakocka
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrderService } from '@/lib/integrations/metakocka/order-service';
import { getMetakockaCredentials } from '@/lib/integrations/metakocka/credentials';
import { ApiError, handleApiError } from '@/lib/api-utils';

/**
 * GET handler for retrieving order sync status
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
    const searchParams = request.nextUrl.searchParams;
    const orderId = searchParams.get('orderId');
    const orderIds = searchParams.get('orderIds');
    
    // Get Metakocka credentials
    const credentials = await getMetakockaCredentials(userId);
    
    if (!credentials) {
      throw new ApiError(400, 'Metakocka credentials not found');
    }
    
    // Query the database for order mapping
    if (orderId) {
      // Single order sync status
      const { data: mapping, error } = await supabase
        .from('sales_document_mappings')
        .select('*')
        .eq('user_id', userId)
        .eq('document_id', orderId)
        .single();
      
      if (error) {
        console.error('Error fetching order mapping:', error);
        return NextResponse.json({ mapping: null }, { status: 200 });
      }
      
      return NextResponse.json({ mapping }, { status: 200 });
    } else if (orderIds) {
      // Multiple order sync status
      const orderIdArray = orderIds.split(',');
      
      const { data: mappings, error } = await supabase
        .from('sales_document_mappings')
        .select('*')
        .eq('user_id', userId)
        .in('document_id', orderIdArray);
      
      if (error) {
        console.error('Error fetching order mappings:', error);
        throw new ApiError(500, 'Failed to fetch order mappings');
      }
      
      return NextResponse.json({ mappings }, { status: 200 });
    } else {
      throw new ApiError(400, 'Missing orderId or orderIds parameter');
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST handler for syncing orders with Metakocka
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
    const { orderId, orderIds } = requestData;
    
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
    
    if (orderId) {
      // Sync a single order
      // Get the order from the database
      const { data: order, error } = await supabase
        .from('sales_documents')
        .select('*')
        .eq('id', orderId)
        .eq('user_id', userId)
        .eq('document_type', 'order')
        .single();
      
      if (error || !order) {
        throw new ApiError(404, 'Order not found');
      }
      
      // Check if the order is already mapped
      const { data: mapping } = await supabase
        .from('sales_document_mappings')
        .select('*')
        .eq('document_id', orderId)
        .eq('user_id', userId)
        .single();
      
      let result;
      
      if (mapping && mapping.metakocka_id) {
        // Update the order in Metakocka
        result = await orderService.updateInMetakocka(order, mapping.metakocka_id);
      } else {
        // Create the order in Metakocka
        result = await orderService.createOrderInMetakocka(order);
      }
      
      if (result.success && result.metakockaId) {
        // Update or create the mapping
        const mappingData = {
          user_id: userId,
          document_id: orderId,
          metakocka_id: result.metakockaId,
          metakocka_document_type: 'narocilo_kupca',
          sync_direction: 'crm_to_metakocka',
          last_synced_at: new Date().toISOString(),
          sync_status: 'synced'
        };
        
        if (mapping && mapping.id) {
          // Update existing mapping
          await supabase
            .from('sales_document_mappings')
            .update(mappingData)
            .eq('id', mapping.id);
        } else {
          // Create new mapping
          await supabase
            .from('sales_document_mappings')
            .insert([mappingData]);
        }
      } else if (!result.success && result.error) {
        // Update the mapping with error status
        const errorData = {
          sync_status: 'error',
          sync_error: result.error,
          last_synced_at: new Date().toISOString()
        };
        
        if (mapping && mapping.id) {
          await supabase
            .from('sales_document_mappings')
            .update(errorData)
            .eq('id', mapping.id);
        } else {
          await supabase
            .from('sales_document_mappings')
            .insert([{
              user_id: userId,
              document_id: orderId,
              metakocka_document_type: 'narocilo_kupca',
              sync_direction: 'crm_to_metakocka',
              ...errorData
            }]);
        }
      }
      
      return NextResponse.json(result, { status: result.success ? 200 : 400 });
    } else if (orderIds && Array.isArray(orderIds)) {
      // Sync multiple orders
      const results = {
        success: true,
        created: 0,
        updated: 0,
        failed: 0,
        errors: [] as Array<{ orderId: string; error: string }>
      };
      
      // Get all orders from the database
      const { data: orders, error } = await supabase
        .from('sales_documents')
        .select('*')
        .in('id', orderIds)
        .eq('user_id', userId)
        .eq('document_type', 'order');
      
      if (error || !orders) {
        throw new ApiError(500, 'Failed to fetch orders');
      }
      
      // Get existing mappings
      const { data: mappings } = await supabase
        .from('sales_document_mappings')
        .select('*')
        .in('document_id', orderIds)
        .eq('user_id', userId);
      
      const mappingsMap = new Map();
      if (mappings) {
        mappings.forEach(mapping => {
          mappingsMap.set(mapping.document_id, mapping);
        });
      }
      
      // Process each order
      for (const order of orders) {
        const mapping = mappingsMap.get(order.id);
        let result;
        
        if (mapping && mapping.metakocka_id) {
          // Update the order in Metakocka
          result = await orderService.updateInMetakocka(order, mapping.metakocka_id);
        } else {
          // Create the order in Metakocka
          result = await orderService.createOrderInMetakocka(order);
        }
        
        if (result.success && result.metakockaId) {
          // Update or create the mapping
          const mappingData = {
            user_id: userId,
            document_id: order.id,
            metakocka_id: result.metakockaId,
            metakocka_document_type: 'narocilo_kupca',
            sync_direction: 'crm_to_metakocka',
            last_synced_at: new Date().toISOString(),
            sync_status: 'synced'
          };
          
          if (mapping && mapping.id) {
            // Update existing mapping
            await supabase
              .from('sales_document_mappings')
              .update(mappingData)
              .eq('id', mapping.id);
            
            results.updated++;
          } else {
            // Create new mapping
            await supabase
              .from('sales_document_mappings')
              .insert([mappingData]);
            
            results.created++;
          }
        } else {
          // Update the mapping with error status
          const errorData = {
            sync_status: 'error',
            sync_error: result.error || 'Unknown error',
            last_synced_at: new Date().toISOString()
          };
          
          if (mapping && mapping.id) {
            await supabase
              .from('sales_document_mappings')
              .update(errorData)
              .eq('id', mapping.id);
          } else {
            await supabase
              .from('sales_document_mappings')
              .insert([{
                user_id: userId,
                document_id: order.id,
                metakocka_document_type: 'narocilo_kupca',
                sync_direction: 'crm_to_metakocka',
                ...errorData
              }]);
          }
          
          results.failed++;
          results.errors.push({
            orderId: order.id,
            error: result.error || 'Unknown error'
          });
        }
      }
      
      results.success = results.failed === 0;
      return NextResponse.json(results, { status: 200 });
    } else {
      throw new ApiError(400, 'Missing orderId or orderIds parameter');
    }
  } catch (error) {
    return handleApiError(error);
  }
}
