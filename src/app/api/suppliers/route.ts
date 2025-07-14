import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { Supplier } from '@/types/supplier';
import { initializeSupplierData } from '@/lib/suppliers/init';
import { getServerSession } from '@/lib/auth';

// Keep the initialization function for backward compatibility
// but we'll use Supabase for data storage now
const initSupabaseConnection = async () => {
  // This is a placeholder for any initialization that might be needed
  // We'll keep the initializeSupplierData call for backward compatibility
  await initializeSupplierData();
};

// Get all suppliers
export async function GET() {
  await initSupabaseConnection();
  try {
    // Get the current user's session
    const session = await getServerSession();
    
    if (!session?.user) {
      console.log('No authenticated user session found, returning empty suppliers list');
      // Return empty array instead of error when not authenticated
      return NextResponse.json([]);
    }
    
    const userId = session.user.id;
    if (!userId) {
      console.log('No user ID found in session, returning empty suppliers list');
      return NextResponse.json([]);
    }
    
    // Fetch suppliers from Supabase
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .eq('created_by', userId);
    
    if (error) {
      console.error('Error fetching suppliers from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to fetch suppliers' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(suppliers || []);
  } catch (error) {
    console.error('Error fetching suppliers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    );
  }
}

// Create a new supplier
export async function POST(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { name, email, phone, website, notes } = await request.json();
    
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }
    
    // Get the current user's session
    const session = await getServerSession();
    
    if (!session?.user) {
      console.error('Error getting user: Auth session missing!');
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if supplier with same email already exists
    const { data: existingSuppliers, error: checkError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('email', email)
      .eq('created_by', userId);
    
    if (checkError) {
      console.error('Error checking existing supplier:', checkError);
      return NextResponse.json(
        { error: 'Failed to check existing supplier' },
        { status: 500 }
      );
    }
    
    if (existingSuppliers && existingSuppliers.length > 0) {
      return NextResponse.json(
        { error: 'Supplier with this email already exists', supplierId: existingSuppliers[0].id },
        { status: 409 }
      );
    }
    
    // Create new supplier in Supabase
    const { data: newSupplier, error: insertError } = await supabase
      .from('suppliers')
      .insert({
        name,
        email,
        phone,
        website,
        notes,
        reliability_score: 0,
        created_by: userId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating supplier in Supabase:', insertError);
      return NextResponse.json(
        { error: 'Failed to create supplier' },
        { status: 500 }
      );
    }
    
    // Map the database column names to our interface property names
    const mappedSupplier: Supplier = {
      id: newSupplier.id,
      name: newSupplier.name,
      email: newSupplier.email,
      phone: newSupplier.phone,
      website: newSupplier.website,
      notes: newSupplier.notes,
      reliabilityScore: newSupplier.reliability_score,
      createdAt: new Date(newSupplier.created_at),
      updatedAt: new Date(newSupplier.updated_at)
    };
    
    return NextResponse.json(mappedSupplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    );
  }
}

// Update an existing supplier by ID
export async function PUT(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { id, name, email, phone, website, notes, reliabilityScore } = await request.json();
    
    if (!id || !name || !email) {
      return NextResponse.json(
        { error: 'ID, name and email are required' },
        { status: 400 }
      );
    }
    
    // Get the current user's session
    const session = await getServerSession();
    
    if (!session?.user) {
      console.error('Error getting user: Auth session missing!');
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if supplier exists and belongs to the user
    const { data: existingSupplier, error: checkError } = await supabase
      .from('suppliers')
      .select('*')
      .eq('id', id)
      .eq('created_by', userId)
      .single();
    
    if (checkError) {
      console.error('Error checking existing supplier:', checkError);
      return NextResponse.json(
        { error: 'Supplier not found or access denied' },
        { status: 404 }
      );
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
        reliability_score: reliabilityScore || existingSupplier.reliability_score
      })
      .eq('id', id)
      .eq('created_by', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating supplier in Supabase:', updateError);
      return NextResponse.json(
        { error: 'Failed to update supplier' },
        { status: 500 }
      );
    }
    
    // Map the database column names to our interface property names
    const mappedSupplier: Supplier = {
      id: updatedSupplier.id,
      name: updatedSupplier.name,
      email: updatedSupplier.email,
      phone: updatedSupplier.phone,
      website: updatedSupplier.website,
      notes: updatedSupplier.notes,
      reliabilityScore: updatedSupplier.reliability_score,
      createdAt: new Date(updatedSupplier.created_at),
      updatedAt: new Date(updatedSupplier.updated_at)
    };
    
    return NextResponse.json(mappedSupplier);
  } catch (error) {
    console.error('Error updating supplier:', error);
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    );
  }
}

// Delete a supplier by ID
export async function DELETE(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current user's session
    const session = await getServerSession();
    
    if (!session?.user) {
      console.error('Error getting user: Auth session missing!');
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if supplier exists and belongs to the user
    const { data: existingSupplier, error: checkError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', id)
      .eq('created_by', userId)
      .single();
    
    if (checkError) {
      console.error('Error checking existing supplier:', checkError);
      return NextResponse.json(
        { error: 'Supplier not found or access denied' },
        { status: 404 }
      );
    }
    
    // Delete supplier from Supabase
    const { error: deleteError } = await supabase
      .from('suppliers')
      .delete()
      .eq('id', id)
      .eq('created_by', userId);
    
    if (deleteError) {
      console.error('Error deleting supplier from Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete supplier' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    );
  }
}
