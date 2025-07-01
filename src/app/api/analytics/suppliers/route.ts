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

    // Get supplier distribution data
    const { data, error } = await supabase
      .from('suppliers')
      .select('name, id, reliabilityScore')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    // Process data for chart display
    const supplierData = data.map(supplier => ({
      name: supplier.name,
      count: 1, // Each supplier counts as 1
      reliabilityScore: supplier.reliabilityScore || 0
    }));

    // Return the supplier distribution data
    return NextResponse.json(supplierData);
  } catch (error) {
    console.error('Error fetching supplier distribution:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier distribution data' },
      { status: 500 }
    );
  }
}
