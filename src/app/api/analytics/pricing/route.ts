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

    // Get pricing data with product information
    const { data, error } = await supabase
      .from('supplier_pricing')
      .select(`
        id,
        price,
        currency,
        unit,
        created_at,
        products (
          id,
          name
        ),
        suppliers (
          id,
          name
        )
      `)
      // Type assertion to handle TypeScript error with string parameter
      .eq('user_id', userId as any);

    if (error) {
      throw error;
    }

    // Group by month for trend analysis
    const pricesByMonth: Record<string, { min: number; max: number; avg: number; count: number; sum: number }> = {};
    
    // Ensure we're working with valid pricing data
    if (Array.isArray(data)) {
      data.forEach(item => {
        // Safely access properties with type checking
        if (item && typeof item === 'object' && 'created_at' in item && 'price' in item) {
          const createdAt = (item as any).created_at;
          const price = Number((item as any).price) || 0;
          
          if (createdAt && !isNaN(price)) {
            const date = new Date(createdAt);
            const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!pricesByMonth[monthYear]) {
              pricesByMonth[monthYear] = {
                min: price,
                max: price,
                avg: price,
                count: 1,
                sum: price
              };
            } else {
              const month = pricesByMonth[monthYear];
              month.min = Math.min(month.min, price);
              month.max = Math.max(month.max, price);
              month.count += 1;
              month.sum += price;
              month.avg = month.sum / month.count;
            }
          }
        }
      });
    }

    // Convert to array format for charts
    const priceTrends = Object.entries(pricesByMonth).map(([name, stats]) => ({
      name,
      min: stats.min,
      avg: stats.avg,
      max: stats.max
    }));

    // Sort by date
    priceTrends.sort((a, b) => a.name.localeCompare(b.name));

    // Return the price trend data
    return NextResponse.json(priceTrends);
  } catch (error) {
    console.error('Error fetching price trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price trend data' },
      { status: 500 }
    );
  }
}
