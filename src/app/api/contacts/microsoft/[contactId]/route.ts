import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

/**
 * GET handler for fetching a single contact from Microsoft Graph API
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { contactId } = params;
    
    // Create Microsoft Graph service and fetch the contact
    const graphService = new MicrosoftGraphService(session.accessToken);
    const contact = await graphService.client
      .api(`/me/contacts/${contactId}`)
      .get();
    
    return NextResponse.json({ data: contact });
  } catch (error: any) {
    console.error('Error in contact API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contact', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PATCH handler for updating contact properties
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { contactId } = params;
    const body = await req.json();
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Update the contact
    const result = await graphService.client
      .api(`/me/contacts/${contactId}`)
      .update(body);
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json(
      { error: 'Failed to update contact', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for removing contacts
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { contactId: string } }
) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const { contactId } = params;
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Delete the contact
    await graphService.client
      .api(`/me/contacts/${contactId}`)
      .delete();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json(
      { error: 'Failed to delete contact', message: error.message },
      { status: 500 }
    );
  }
}
