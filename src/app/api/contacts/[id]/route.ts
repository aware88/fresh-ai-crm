import { NextRequest, NextResponse } from 'next/server';
import { getContactById } from '@/lib/contacts/data';
import { updateContactInDb, deleteContactFromDb } from '@/lib/contacts/supabase';

/**
 * GET handler for /api/contacts/[id]
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
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
  const { id } = params;
  
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
  const { id } = params;
  
  if (!id) {
    return NextResponse.json(
      { success: false, error: 'Contact ID is required' },
      { status: 400 }
    );
  }

  try {
    console.log(`API: Deleting contact with ID ${id}`);
    const success = await deleteContactFromDb(id);
    
    if (!success) {
      console.error(`API: Failed to delete contact with ID ${id}`);
      return NextResponse.json(
        { success: false, error: 'Failed to delete contact' },
        { status: 500 }
      );
    }
    
    console.log(`API: Successfully deleted contact with ID ${id}`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Error deleting contact:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
