import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';
import { getUID } from '../../../lib/auth/utils';

// GET /api/products - Get all products for the current user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');
    const query = searchParams.get('query');
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createServerClient();
    
    // Build query
    let dbQuery = supabase
      .from('products')
      .select('*')
      .eq('user_id', uid);
    
    // Apply filters if provided
    if (category) {
      dbQuery = dbQuery.eq('category', category);
    }
    
    if (query) {
      dbQuery = dbQuery.ilike('name', `%${query}%`);
    }
    
    // Execute query
    const { data: products, error } = await dbQuery.order('name');
    
    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
    
    return NextResponse.json(products);
  } catch (err) {
    console.error('Error in products API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name } = body;
    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Add user_id to the product data
    const productData = {
      ...body,
      user_id: uid
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
    
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Error in products API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/products - Update an existing product
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, name } = body;
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    if (!name) {
      return NextResponse.json({ error: 'Product name is required' }, { status: 400 });
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Update in database
    const { data, error } = await supabase
      .from('products')
      .update(body)
      .eq('id', id)
      .eq('user_id', uid)  // Ensure user can only update their own products
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
  } catch (err) {
    console.error('Error in products API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/products - Delete a product
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = createServerClient();
    
    // Delete from database
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
      .eq('user_id', uid);  // Ensure user can only delete their own products
    
    if (error) {
      console.error('Error deleting product:', error);
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in products API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
