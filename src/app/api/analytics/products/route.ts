import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase';

export async function GET(request: Request) {
  try {
    // Create Supabase client with proper cookies handling for Next.js 15+
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: cookieStore });
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // Get product category distribution data
    const { data, error } = await supabase
      .from('products')
      .select('category')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Process data for chart display - count products by category
    const categoryCount: Record<string, number> = {};
    
    // Ensure we're working with valid product data
    if (Array.isArray(data)) {
      data.forEach(product => {
        // Check if product has category property
        if (product && typeof product === 'object') {
          const category = (product as any).category || 'Uncategorized';
          categoryCount[category] = (categoryCount[category] || 0) + 1;
        }
      });
    }

    // Convert to array format for charts
    const productData = Object.entries(categoryCount).map(([name, value]) => ({
      name,
      value
    }));

    // Return the product distribution data
    return NextResponse.json(productData);
  } catch (error) {
    console.error('Error fetching product distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product distribution data' },
      { status: 500 }
    );
  }
}
