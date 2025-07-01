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
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Group by month for trend analysis
    const pricesByMonth: Record<string, { min: number; max: number; avg: number; count: number; sum: number }> = {};
    
    data.forEach(item => {
      const date = new Date(item.created_at);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const price = item.price;
      
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
    });

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
