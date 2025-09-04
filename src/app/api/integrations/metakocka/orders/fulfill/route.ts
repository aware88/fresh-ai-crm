/**
 * API route handler for fulfilling orders in Metakocka
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrderService } from '@/lib/integrations/metakocka/order-service';
import { getMetakockaCredentials } from '@/lib/integrations/metakocka/credentials';
import { ApiError, handleApiError } from '@/lib/api-utils';
import { OrderFulfillment } from '@/types/order';

/**
 * POST handler for fulfilling orders in Metakocka
 */
export async function POST(request: NextRequest) {
  try {
    // Get cookies using async pattern for Next.js 15+
    const cookieStore = await cookies();
    // Get the user session
    const supabase = createRouteHandlerClient({ cookies: async () => cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    const userId = session.user.id;
    const requestData = await request.json();
    const { orderId, fulfillmentData } = requestData;
    
    if (!orderId) {
      throw new ApiError(400, 'Missing orderId parameter');
    }
    
    // Get Metakocka credentials
    const credentialsResult = await getMetakockaCredentials(userId);
    
    if (!credentialsResult || !credentialsResult.data) {
      throw new ApiError(400, 'Metakocka credentials not found');
    }
    
    const credentials = credentialsResult.data;
    
    // Get the order mapping to find the Metakocka ID
    const { data: mapping, error: mappingError } = await supabase
      .from('sales_document_mappings')
      .select('*')
      .eq('document_id', orderId)
      .eq('user_id', userId)
      .single();
    
    if (mappingError || !mapping || !mapping.metakocka_id) {
      throw new ApiError(404, 'Order mapping not found. Please sync the order first.');
    }
    
    // Get the order from the database
    const { data: order, error: orderError } = await supabase
      .from('sales_documents')
      .select('*, items:sales_document_items(*)')
      .eq('id', orderId)
      .eq('user_id', userId)
      .eq('document_type', 'order')
      .single();
    
    if (orderError || !order) {
      throw new ApiError(404, 'Order not found');
    }
    
    // Initialize the order service
    const orderService = new OrderService(
      credentials.secret_key,
      credentials.company_id,
      userId
    );
    
    // Create fulfillment data if not provided
    const fulfillment: OrderFulfillment = fulfillmentData || {
      order_id: orderId,
      fulfillment_date: new Date().toISOString().split('T')[0],
      items: order.items.map((item: any) => ({
        product_id: item.product_id,
        quantity: item.quantity
      }))
    };
    
    // Fulfill the order in Metakocka
    const result = await orderService.fulfillOrder(
      orderId,
      mapping.metakocka_id,
      fulfillment
    );
    
    if (result.success) {
      // Update the order status in the database
      await supabase
        .from('sales_documents')
        .update({ 
          status: 'fulfilled',
          fulfillment_date: fulfillment.fulfillment_date,
          tracking_number: fulfillment.tracking_number || null
        })
        .eq('id', orderId)
        .eq('user_id', userId);
      
      // Update the mapping
      await supabase
        .from('sales_document_mappings')
        .update({
          metakocka_status: 'fulfilled',
          last_synced_at: new Date().toISOString()
        })
        .eq('id', mapping.id);
      
      // Create a fulfillment record
      await supabase
        .from('order_fulfillments')
        .insert([{
          order_id: orderId,
          user_id: userId,
          fulfillment_date: fulfillment.fulfillment_date,
          tracking_number: fulfillment.tracking_number || null,
          shipping_carrier: fulfillment.shipping_carrier || null,
          notes: fulfillment.notes || null,
          metadata: fulfillment.metadata || {},
          items: fulfillment.items
        }]);
      
      // Update inventory allocations
      for (const item of fulfillment.items) {
        // Mark allocations as fulfilled
        await supabase
          .from('order_inventory_allocations')
          .update({
            fulfilled_quantity: item.quantity,
            allocation_status: 'fulfilled',
            updated_at: new Date().toISOString()
          })
          .eq('order_id', orderId)
          .eq('product_id', item.product_id);
      }
      
      return NextResponse.json(result, { status: 200 });
    } else {
      // Update the mapping with error status
      await supabase
        .from('sales_document_mappings')
        .update({
          sync_status: 'error',
          sync_error: result.error,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', mapping.id);
      
      return NextResponse.json(result, { status: 400 });
    }
  } catch (error) {
    return handleApiError(error);
  }
}