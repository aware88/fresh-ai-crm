/**
 * API route for syncing products from Metakocka to CRM
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ProductSyncService } from '@/lib/integrations/metakocka/product-sync';
import { MetakockaError } from '@/lib/integrations/metakocka/types';
import { withAuth } from '../../middleware';
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
 * GET /api/integrations/metakocka/products/sync-from-metakocka
 * Get unsynced products from Metakocka
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId, request) => {
    try {
      // Create service role client to bypass RLS
      const supabaseServiceClient = createServiceRoleClient();
      
      // Get organization memberships for the user
      const { data: organizations } = await supabaseServiceClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId);
      
      if (!organizations || organizations.length === 0) {
        return NextResponse.json(
          { error: 'No organizations found for user' },
          { status: 404 }
        );
      }
      
      // For now, just return a placeholder response
      // In a real implementation, we would call the Metakocka API to get unsynced products
      return NextResponse.json({
        products: [],
        totalCount: 0
      });
    } catch (error) {
      console.error('Error getting unsynced products from Metakocka:', error);
      
      if (error instanceof MetakockaError) {
        return NextResponse.json(
          { 
            error: error.message,
            type: error.type,
            code: error.code
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to get unsynced products from Metakocka' },
        { status: 500 }
      );
    }
  });
}

/**
 * POST /api/integrations/metakocka/products/sync-from-metakocka
 * Sync a single product from Metakocka to CRM
 * 
 * Request body:
 * - metakockaId: string - Metakocka product ID to sync
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, request) => {
    try {
      // Create service role client to bypass RLS
      const supabaseServiceClient = createServiceRoleClient();
      
      // Get organization memberships for the user
      const { data: organizations } = await supabaseServiceClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId);
      
      if (!organizations || organizations.length === 0) {
        return NextResponse.json(
          { error: 'No organizations found for user' },
          { status: 404 }
        );
      }
      
      // Parse request body
      const body = await request.json();
      const metakockaId = body.metakockaId;
      
      if (!metakockaId) {
        return NextResponse.json(
          { error: 'metakockaId is required' },
          { status: 400 }
        );
      }
      
      // Sync product from Metakocka using the correct method
      // We need to pass an array of metakockaIds to syncProductsFromMetakocka
      const result = await ProductSyncService.syncProductsFromMetakocka(
        userId,
        [metakockaId]
      );
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error syncing product from Metakocka:', error);
      
      if (error instanceof MetakockaError) {
        return NextResponse.json(
          { 
            error: error.message,
            type: error.type,
            code: error.code
          },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to sync product from Metakocka' },
        { status: 500 }
      );
    }
  });
}
