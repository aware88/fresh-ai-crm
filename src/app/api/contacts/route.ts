import { NextResponse } from 'next/server';
import { loadContacts, createContact, updateContact, deleteContact, isUsingSupabase } from '../../../lib/contacts/data';
import { Contact, ContactCreateInput, ContactUpdateInput } from '../../../lib/contacts/types';

/**
 * GET /api/contacts
 */
export async function GET() {
  try {
    const contacts = await loadContacts();
    return NextResponse.json({ contacts, usingSupabase: isUsingSupabase() });
  } catch (error) {
    console.error('Error loading contacts:', error);
    return NextResponse.json({ error: 'Failed to load contacts', contacts: [] }, { status: 500 });
  }
}

/**
 * POST /api/contacts
 */
export async function POST(request: Request) {
  try {
    const data = await request.json();
    const newContact = await createContact(data as ContactCreateInput);
    
    if (!newContact) {
      return NextResponse.json({ error: 'Contact already exists or invalid data' }, { status: 400 });
    }
    
    return NextResponse.json({ contact: newContact, usingSupabase: isUsingSupabase() });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}

/**
 * PUT /api/contacts
 */
export async function PUT(request: Request) {
  try {
    const data = await request.json();
    const updatedContact = await updateContact(data as ContactUpdateInput);
    
    if (!updatedContact) {
      return NextResponse.json({ error: 'Contact not found or invalid data' }, { status: 404 });
    }
    
    return NextResponse.json({ contact: updatedContact, usingSupabase: isUsingSupabase() });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

/**
 * DELETE /api/contacts
 * 
 * Note: This endpoint is kept for backward compatibility.
 * New code should use DELETE /api/contacts/[id] instead.
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Missing contact ID' }, { status: 400 });
    }
    
    console.warn('Deprecated API endpoint used: DELETE /api/contacts?id=. Use DELETE /api/contacts/[id] instead.');
    
    const success = await deleteContact(id);
    
    if (!success) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, usingSupabase: isUsingSupabase() });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
