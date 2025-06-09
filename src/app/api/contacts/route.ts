import { NextResponse } from 'next/server';
import { 
  loadContacts, 
  createContact, 
  updateContact, 
  deleteContact, 
  getContactById 
} from '@/lib/contacts/data';
import { ContactCreateInput, ContactUpdateInput } from '@/lib/contacts/types';

// GET all contacts
export async function GET() {
  try {
    const contacts = loadContacts();
    return NextResponse.json({ contacts });
  } catch (error) {
    console.error('Error getting contacts:', error);
    return NextResponse.json(
      { error: 'Failed to get contacts' },
      { status: 500 }
    );
  }
}

// POST create a new contact
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const contactData: ContactCreateInput = body.contact;
    
    if (!contactData || !contactData.email || !contactData.firstName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const newContact = createContact(contactData);
    
    if (!newContact) {
      return NextResponse.json(
        { error: 'Contact with this email already exists' },
        { status: 409 }
      );
    }
    
    return NextResponse.json({ contact: newContact });
  } catch (error) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
}

// PUT update an existing contact
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const contactData: ContactUpdateInput = body.contact;
    
    if (!contactData || !contactData.id) {
      return NextResponse.json(
        { error: 'Missing contact ID' },
        { status: 400 }
      );
    }
    
    const updatedContact = updateContact(contactData);
    
    if (!updatedContact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ contact: updatedContact });
  } catch (error) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    );
  }
}

// DELETE a contact
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing contact ID' },
        { status: 400 }
      );
    }
    
    const success = deleteContact(id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact' },
      { status: 500 }
    );
  }
}
