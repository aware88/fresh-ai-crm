/**
 * API route for getting product sync status
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAuth } from '../../../middleware';
import { Database } from '@/types/supabase';

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

/**
 * GET /api/integrations/metakocka/products/sync/[productId]
 * Get sync status for a specific product
 */
export async function GET(request: NextRequest, { params }: { params: { productId: string } }) {
  // Log that we're using service role authentication
  console.log('Using service role authentication for testing');
  
  return withAuth(request, async (userId, request) => {
    try {
      // In Next.js App Router, params should be properly awaited
      // Use async pattern for params in Next.js 15+
    const { productId } = await params;
      
      if (!productId) {
        return NextResponse.json(
          { error: 'Product ID is required' },
          { status: 400 }
        );
      }
      
      // Get product using service role client to bypass RLS
      const supabaseClient = createServiceRoleClient();
      const { data: product, error } = await supabaseClient
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();
      
      if (error || !product) {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        );
      }
      
      // Get metakocka mapping using organization_id from product
      const { data: mapping, error: mappingError } = await supabaseClient
        .from('metakocka_product_mappings')
        .select('*')
        .eq('product_id', productId)
        .eq('organization_id', product.organization_id)
        .single();
      
      return NextResponse.json({
        product,
        mapping: mapping || null,
        syncStatus: mapping ? mapping.sync_status || 'synced' : 'not_synced',
        metakockaId: mapping?.metakocka_id || null
      });
    } catch (error) {
      console.error('Error getting product sync status:', error);
      return NextResponse.json(
        { error: 'Failed to get product sync status' },
        { status: 500 }
      );
    }
  });
}
