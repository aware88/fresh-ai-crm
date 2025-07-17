import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../lib/supabase/server';
import { getUID } from '../../../lib/auth/utils';

// GET /api/suppliers - Get all suppliers for the current user
export async function GET(request: NextRequest) {
  try {
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = await createServerClient();
    
    // Fetch suppliers for the current user
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching suppliers:', error);
      return NextResponse.json({ error: 'Failed to fetch suppliers', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ suppliers: suppliers || [] });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/suppliers - Create a new supplier
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { name, email } = body;
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = await createServerClient();
    
    // Add user_id to the supplier data
    const supplierData = {
      ...body,
      user_id: uid
    };
    
    // Insert into database
    const { data, error } = await supabase
      .from('suppliers')
      .insert(supplierData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating supplier:', error);
      return NextResponse.json({ error: 'Failed to create supplier', details: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ supplier: data }, { status: 201 });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/suppliers - Update an existing supplier
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const { id, name, email } = body;
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = await createServerClient();
    
    // Update in database
    const { data, error } = await supabase
      .from('suppliers')
      .update(body)
      .eq('id', id)
      .eq('user_id', uid)  // Ensure user can only update their own suppliers
      .select()
      .single();
    
    if (error) {
      console.error('Error updating supplier:', error);
      return NextResponse.json({ error: 'Failed to update supplier', details: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Supplier not found or you do not have permission to update it' }, { status: 404 });
    }
    
    return NextResponse.json({ supplier: data });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/suppliers - Delete a supplier
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 });
    }
    
    // Get user ID from session
    const uid = await getUID();
    if (!uid) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Create Supabase client
    const supabase = await createServerClient();
    
    // Delete from database
    const { data, error } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('user_id', uid)  // Ensure user can only delete their own suppliers
      .select()
      .single();
    
    if (error) {
      console.error('Error deleting supplier:', error);
      return NextResponse.json({ error: 'Failed to delete supplier', details: error.message }, { status: 500 });
    }
    
    if (!data) {
      return NextResponse.json({ error: 'Supplier not found or you do not have permission to delete it' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error in suppliers API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
