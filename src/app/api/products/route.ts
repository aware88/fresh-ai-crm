import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: Request) {
  try {
    // Check if user is authenticated via NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = userId; // Use user ID as organization ID for now

    // Fetch products from database
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json({ products: products || [] });
  } catch (error) {
    console.error('Products API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Check if user is authenticated via NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = userId; // Use user ID as organization ID for now

    const body = await request.json();
    const { name, sku, description, category, unit, selling_price, cost_price, min_stock_level, quantity_on_hand } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    // Insert new product
    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        sku,
        description,
        category,
        unit: unit || 'pcs',
        selling_price: selling_price ? parseFloat(selling_price) : null,
        cost_price: cost_price ? parseFloat(cost_price) : null,
        min_stock_level: min_stock_level ? parseInt(min_stock_level) : 0,
        quantity_on_hand: quantity_on_hand ? parseFloat(quantity_on_hand) : 0,
        user_id: userId,
        organization_id: organizationId
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    console.error('Products POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/products - Update an existing product
export async function PUT(request: Request) {
  try {
    // Check if user is authenticated via NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = userId; // Use user ID as organization ID for now

    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }

    // Update in database
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .eq('user_id', userId)  // Ensure user can only update their own products
      .select()
      .single();
    
    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Product not found or you do not have permission to update it' }, { status: 404 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Products PUT API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/products - Delete a product
export async function DELETE(request: Request) {
  try {
    // Check if user is authenticated via NextAuth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const organizationId = userId; // Use user ID as organization ID for now

         const url = new URL(request.url);
     const id = url.searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Delete from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);  // Ensure user can only delete their own products
    
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Products DELETE API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
