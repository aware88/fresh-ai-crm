/**
 * API route for bulk syncing products from Metakocka to CRM
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
 * POST /api/integrations/metakocka/products/sync-all-from-metakocka
 * Sync multiple products from Metakocka to CRM
 * 
 * Request body:
 * - metakockaIds?: string[] - Optional array of Metakocka product IDs to sync (if not provided, all unsynced products will be synced)
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
      const metakockaIds = body.metakockaIds;
      
      // Validate metakockaIds if provided
      if (metakockaIds && !Array.isArray(metakockaIds)) {
        return NextResponse.json(
          { error: 'metakockaIds must be an array of strings' },
          { status: 400 }
        );
      }
      
      // Sync products from Metakocka
      const result = await ProductSyncService.syncProductsFromMetakocka(
        userId,
        metakockaIds
      );
      
      return NextResponse.json(result);
    } catch (error) {
      console.error('Error syncing products from Metakocka:', error);
      
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
        { error: 'Failed to sync products from Metakocka' },
        { status: 500 }
      );
    }
  });
}
