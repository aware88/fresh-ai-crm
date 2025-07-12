/**
 * API route handler for cancelling orders in Metakocka
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrderService } from '@/lib/integrations/metakocka/order-service';
import { getMetakockaCredentials } from '@/lib/integrations/metakocka/credentials';
import { ApiError, handleApiError } from '@/lib/api-utils';

/**
 * POST handler for cancelling orders in Metakocka
 */
export async function POST(request: NextRequest) {
  // Get cookies using async pattern for Next.js 15+
  const cookieStore = await cookies();
  try {
    // Get the user session
    const supabase = createRouteHandlerClient({ cookies: cookieStore });
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new ApiError(401, 'Unauthorized');
    }
    
    const userId = session.user.id;
    const requestData = await request.json();
    const { orderId, cancellationReason } = requestData;
    
    if (!orderId) {
      throw new ApiError(400, 'Missing orderId parameter');
    }
    
    // Get Metakocka credentials
    const credentials = await getMetakockaCredentials(userId);
    
    if (!credentials) {
      throw new ApiError(400, 'Metakocka credentials not found');
    }
    
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
    
    // Initialize the order service
    const orderService = new OrderService(
      credentials.secretKey,
      credentials.companyId,
      userId
    );
    
    // Cancel the order in Metakocka
    const result = await orderService.cancelOrder(
      orderId,
      mapping.metakocka_id,
      cancellationReason
    );
    
    if (result.success) {
      // Update the order status in the database
      await supabase
        .from('sales_documents')
        .update({ 
          status: 'cancelled',
          metadata: {
            ...((await supabase.from('sales_documents').select('metadata').eq('id', orderId).single()).data?.metadata || {}),
            cancellation_reason: cancellationReason,
            cancelled_at: new Date().toISOString()
          }
        })
        .eq('id', orderId)
        .eq('user_id', userId);
      
      // Update the mapping
      await supabase
        .from('sales_document_mappings')
        .update({
          metakocka_status: 'cancelled',
          last_synced_at: new Date().toISOString()
        })
        .eq('id', mapping.id);
      
      // Release inventory allocations
      await supabase
        .from('order_inventory_allocations')
        .update({
          allocation_status: 'released',
          updated_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('allocation_status', 'allocated');
      
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
