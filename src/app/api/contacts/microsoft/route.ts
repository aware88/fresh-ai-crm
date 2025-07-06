import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';
import { MicrosoftGraphService } from '@/lib/services/microsoft-graph-service';

/**
 * GET handler for fetching contacts from Microsoft Graph API
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    // Parse query parameters
    const searchParams = req.nextUrl.searchParams;
    const top = parseInt(searchParams.get('top') || '10');
    const skip = parseInt(searchParams.get('skip') || '0');
    const filter = searchParams.get('filter') || '';
    
    // Create Microsoft Graph service and fetch contacts
    const graphService = new MicrosoftGraphService(session.accessToken);
    const contacts = await graphService.getContacts({ top, skip, filter });
    
    return NextResponse.json({ data: contacts });
  } catch (error: any) {
    console.error('Error in contacts API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * POST handler for creating contacts
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: 'Unauthorized or missing Microsoft Graph access token' }, { status: 401 });
    }
    
    const body = await req.json();
    
    // Validate required fields
    if (!body.displayName) {
      return NextResponse.json(
        { error: 'Missing required field: displayName' },
        { status: 400 }
      );
    }
    
    // Create Microsoft Graph service
    const graphService = new MicrosoftGraphService(session.accessToken);
    
    // Format the contact for Microsoft Graph API
    const contact = {
      displayName: body.displayName,
      givenName: body.givenName,
      surname: body.surname,
      emailAddresses: body.emailAddresses ? body.emailAddresses.map((email: string, index: number) => ({
        address: email,
        name: body.displayName,
        type: 'other',
        id: index.toString(),
      })) : [],
      businessPhones: body.businessPhones || [],
      mobilePhone: body.mobilePhone,
      jobTitle: body.jobTitle,
      companyName: body.companyName,
    };
    
    // Create the contact
    const result = await graphService.client
      .api('/me/contacts')
      .post(contact);
    
    return NextResponse.json({ data: result });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json(
      { error: 'Failed to create contact', message: error.message },
      { status: 500 }
    );
  }
}
