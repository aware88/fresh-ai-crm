import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { initializeSupplierData } from '@/lib/suppliers/init';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

// Initialize Supabase connection
const initSupabaseConnection = async () => {
  // Keep the initialization function for backward compatibility
  await initializeSupplierData();
};

// Get all emails for a supplier
export async function GET(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    
    // Get the current user's session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      console.error('Error getting user: Auth session missing!');
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const organizationId = session.user.id;
    
    // Fetch emails from Supabase - if supplierId is provided, filter by it, otherwise get all
    let query = supabase
      .from('supplier_emails')
      .select('*')
.eq('organization_id', organizationId);
    
    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }
    
    const { data: emails, error } = await query.order('received_date', { ascending: false });
    
    if (error) {
      console.error('Error fetching supplier emails from Supabase:', error);
      return NextResponse.json(
        { error: 'Failed to fetch supplier emails' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(emails);
  } catch (error) {
    console.error('Error fetching supplier emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch supplier emails' },
      { status: 500 }
    );
  }
}

// Create a new supplier email
export async function POST(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { supplierId, senderEmail, senderName, subject, body, receivedDate, productTags, metadata } = await request.json();
    
    if (!supplierId || !senderEmail || !body) {
      return NextResponse.json(
        { error: 'Supplier ID, sender email, and body are required' },
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
    
    const organizationId = session.user.id;
    
    // Check if supplier exists and belongs to the user
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
.eq('organization_id', organizationId)
      .single();
    
    if (supplierError) {
      console.error('Error checking supplier existence:', supplierError);
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      );
    }
    
    // Create new email in Supabase
    const { data: email, error: insertError } = await supabase
      .from('supplier_emails')
      .insert({
        supplier_id: supplierId,
        sender_email: senderEmail,
        sender_name: senderName || senderEmail.split('@')[0],
        subject: subject || '(No Subject)',
        body,
        received_date: receivedDate || new Date().toISOString(),
        product_tags: productTags || [],
        metadata: metadata || {},
        organization_id: organizationId
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Error creating email in Supabase:', insertError);
      return NextResponse.json(
        { error: 'Failed to create email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(email);
  } catch (error) {
    console.error('Error creating supplier email:', error);
    return NextResponse.json(
      { error: 'Failed to create supplier email' },
      { status: 500 }
    );
  }
}

// Delete a supplier email
export async function DELETE(request: NextRequest) {
  await initSupabaseConnection();
  try {
    const { searchParams } = new URL(request.url);
    const emailId = searchParams.get('id');
    
    if (!emailId) {
      return NextResponse.json(
        { error: 'Email ID is required' },
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
    
    const organizationId = session.user.id;
    
    // Check if email exists and belongs to the user
    const { data: email, error: checkError } = await supabase
      .from('supplier_emails')
      .select('id')
      .eq('id', emailId)
.eq('organization_id', organizationId)
      .single();
    
    if (checkError) {
      console.error('Error checking email existence:', checkError);
      return NextResponse.json(
        { error: 'Email not found' },
        { status: 404 }
      );
    }
    
    // Delete email from Supabase
    const { error: deleteError } = await supabase
      .from('supplier_emails')
      .delete()
      .eq('id', emailId)
.eq('organization_id', organizationId);
    
    if (deleteError) {
      console.error('Error deleting email from Supabase:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete email' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting supplier email:', error);
    return NextResponse.json(
      { error: 'Failed to delete supplier email' },
      { status: 500 }
    );
  }
}
