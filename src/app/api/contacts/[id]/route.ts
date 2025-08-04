import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts/data';
import { updateContactInDb, deleteContactFromDb } from '@/lib/contacts/supabase';
import { createClient } from '@supabase/supabase-js';

// Create service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET handler for /api/contacts/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Await params to fix Next.js 15 requirement
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Contact ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`API: Fetching contact with ID ${id}`);
    const contact = await getContactById(id);
    
    if (!contact) {
      console.warn(`API: Contact with ID ${id} not found`);
      return NextResponse.json(
        { success: false, error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    console.log(`API: Successfully fetched contact ${contact.firstName} ${contact.lastName}`);
    return NextResponse.json({ success: true, data: contact });
  } catch (error) {
    console.error('API: Error fetching contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contact' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for /api/contacts/[id] - Update a contact
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Await params to fix Next.js 15 requirement
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Contact ID is required' },
      { status: 400 }
    );
  }

  try {
    const contactData = await req.json();
    console.log(`API: Updating contact with ID ${id}`);
    
    // Add id to the contact data for updateContactInDb
    const updatedContact = await updateContactInDb({ id, ...contactData });
    
    if (!updatedContact) {
      console.error(`API: Failed to update contact with ID ${id}`);
      return NextResponse.json(
        { success: false, error: 'Failed to update contact' },
        { status: 500 }
      );
    }
    
    console.log(`API: Successfully updated contact ${updatedContact.firstName} ${updatedContact.lastName}`);
    return NextResponse.json({ success: true, data: updatedContact });
  } catch (error) {
    console.error('API: Error updating contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for /api/contacts/[id]
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // Await params to fix Next.js 15 requirement
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Contact ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`API: Deleting contact with ID ${id} using service role`);
    console.log(`API: Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
    console.log(`API: Service role key exists: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
    
    // List of tables that might reference the contact
    const dependentTables = [
      'contact_communication_metrics',
      'sentiment_evolution_events',
      'behavioral_milestone_events',
      'decision_context_factors'
    ];
    
    // Clean up dependencies first
    console.log(`API: Cleaning up dependencies for contact ${id}`);
    for (const table of dependentTables) {
      try {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq('contact_id', id);
        
        if (error) {
          if (error.code === '42P01') {
            // Table doesn't exist, skip
            console.log(`API: Table ${table} doesn't exist, skipping`);
          } else {
            console.error(`API: Error deleting from ${table}:`, error.message);
          }
        } else {
          console.log(`API: Deleted from ${table}`);
        }
      } catch (err) {
        console.log(`API: Skipping ${table}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }
    
    // Now delete the contact
    const { error } = await supabaseAdmin
      .from('contacts')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error(`API: Failed to delete contact with ID ${id}:`, error);
      console.error(`API: Error details:`, {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      return NextResponse.json(
        { success: false, error: 'Failed to delete contact', details: error.message },
        { status: 500 }
      );
    }
    
    console.log(`API: Successfully deleted contact with ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
