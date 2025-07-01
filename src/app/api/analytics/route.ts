import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: Request) {
  try {
    const supabase = createRouteHandlerClient<Database>({ cookies });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get counts for different entities
    const [
      suppliersResult,
      productsResult,
      documentsResult,
      emailsResult,
      pricingResult
    ] = await Promise.all([
      // Count suppliers
      supabase
        .from('suppliers')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count products
      supabase
        .from('products')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count documents
      supabase
        .from('supplier_documents')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Count emails
      supabase
        .from('supplier_emails')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId),
      
      // Get pricing stats
      supabase
        .from('supplier_pricing')
        .select('price')
        .eq('user_id', userId)
    ]);

    // Calculate price statistics
    let avgPrice = 0;
    let minPrice = 0;
    let maxPrice = 0;
    
    if (pricingResult.data && pricingResult.data.length > 0) {
      const prices = pricingResult.data.map(item => item.price);
      avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
      minPrice = Math.min(...prices);
      maxPrice = Math.max(...prices);
    }

    // Return the analytics data
    return NextResponse.json({
      counts: {
        suppliers: suppliersResult.count || 0,
        products: productsResult.count || 0,
        documents: documentsResult.count || 0,
        emails: emailsResult.count || 0,
      },
      pricing: {
        average: avgPrice,
        minimum: minPrice,
        maximum: maxPrice,
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}
