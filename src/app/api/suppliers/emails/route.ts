import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { initializeSupplierData } from '@/lib/suppliers/init';

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
    
    if (!supplierId) {
      return NextResponse.json(
        { error: 'Supplier ID is required' },
        { status: 400 }
      );
    }
    
    // Get the current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Fetch emails from Supabase
    const { data: emails, error } = await supabase
      .from('supplier_emails')
      .select('*')
      .eq('supplier_id', supplierId)
      .eq('created_by', userId)
      .order('received_date', { ascending: false });
    
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
    
    // Get the current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if supplier exists and belongs to the user
    const { data: supplier, error: supplierError } = await supabase
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('created_by', userId)
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
        created_by: userId
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
    
    // Get the current user's ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      );
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    // Check if email exists and belongs to the user
    const { data: email, error: checkError } = await supabase
      .from('supplier_emails')
      .select('id')
      .eq('id', emailId)
      .eq('created_by', userId)
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
      .eq('created_by', userId);
    
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
