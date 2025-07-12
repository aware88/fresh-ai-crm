/**
 * API route handler for updating order status in Metakocka
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { OrderService } from '@/lib/integrations/metakocka/order-service';
import { getMetakockaCredentials } from '@/lib/integrations/metakocka/credentials';
import { ApiError, handleApiError } from '@/lib/api-utils';
import { OrderStatus } from '@/types/order';

/**
 * POST handler for updating order status in Metakocka
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
    const { orderId, status } = requestData;
    
    if (!orderId) {
      throw new ApiError(400, 'Missing orderId parameter');
    }
    
    if (!status) {
      throw new ApiError(400, 'Missing status parameter');
    }
    
    // Validate status
    const validStatuses: OrderStatus[] = [
      'draft',
      'confirmed',
      'processing',
      'partially_fulfilled',
      'fulfilled',
      'cancelled',
      'on_hold'
    ];
    
    if (!validStatuses.includes(status as OrderStatus)) {
      throw new ApiError(400, `Invalid status: ${status}. Valid statuses are: ${validStatuses.join(', ')}`);
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
    
    // Update the order status in Metakocka
    const result = await orderService.updateOrderStatus(
      orderId,
      mapping.metakocka_id,
      status as OrderStatus
    );
    
    if (result.success) {
      // Update the order status in the database
      await supabase
        .from('sales_documents')
        .update({ status: status })
        .eq('id', orderId)
        .eq('user_id', userId);
      
      // Update the mapping
      await supabase
        .from('sales_document_mappings')
        .update({
          metakocka_status: status,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', mapping.id);
      
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
