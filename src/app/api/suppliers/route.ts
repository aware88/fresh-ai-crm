import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with proper Next.js 15+ cookie handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Fetch suppliers for the current user
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to fetch suppliers', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ suppliers: suppliers || [] });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { name, email, phone, address, notes } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Create Supabase client with proper Next.js 15+ cookie handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Insert new supplier
    const { data: supplier, error } = await supabase
      .from('suppliers')
      .insert({
        name,
        email,
        phone,
        address,
        notes,
        user_id: session.user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create supplier', details: error.message }, { status: 500 });
    }

    return NextResponse.json({ supplier });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Update an existing supplier by ID
export async function PUT(request: NextRequest) {
  try {
    const { id, name, email, phone, website, notes, reliabilityScore } = await request.json();
    
    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'ID, name and email are required' },
        { status: 400 }
      );
    }
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with proper Next.js 15+ cookie handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if supplier exists and belongs to the user
    const { data: existingSupplier, error: checkError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (checkError) {
      console.error('Supabase error:', checkError);
      return NextResponse.json({ error: 'Supplier not found or access denied', details: checkError.message }, { status: 404 });
    }
    
    // Update supplier in Supabase
    const { data: updatedSupplier, error: updateError } = await supabase
      .from('suppliers')
      .update({
        name,
        email,
        phone,
        website,
        notes,
        reliabilityScore: reliabilityScore || existingSupplier.reliabilityScore
      })
      .eq('id', id)
      .eq('user_id', session.user.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Supabase error:', updateError);
      return NextResponse.json({ error: 'Failed to update supplier', details: updateError.message }, { status: 500 });
    }
    
    return NextResponse.json({ supplier: updatedSupplier });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

// Delete a supplier by ID
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    // Get session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('No session or user ID found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client with proper Next.js 15+ cookie handling
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if supplier exists and belongs to the user
    const { data: existingSupplier, error: checkError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', id)
      .eq('user_id', session.user.id)
      .single();
    
    if (checkError) {
      console.error('Supabase error:', checkError);
      return NextResponse.json({ error: 'Supplier not found or access denied', details: checkError.message }, { status: 404 });
    }
    
    // Delete supplier from Supabase
    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);
    
    if (deleteError) {
      console.error('Supabase error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete supplier', details: deleteError.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
