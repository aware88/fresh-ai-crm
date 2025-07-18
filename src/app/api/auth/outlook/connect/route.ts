import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// Microsoft OAuth configuration
const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;

// Function to get the correct redirect URI
function getRedirectUri(request: Request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  // Always use the request host for dynamic URL detection
  return `${protocol}://${host}/api/auth/outlook/callback`;
}
const SCOPES = [
  'offline_access',
  'User.Read',
  'Mail.Read',
  'Mail.ReadWrite',
  'Mail.Send',
  'Calendars.Read',
  'Contacts.Read'
].join(' ');

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      console.error('Outlook connect: No valid session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', details: 'No valid session found' },
        { status: 401 }
      );
    }
    
    // Log successful authentication
    console.log(`Outlook connect: Authenticated user ${session.user.id}`);
    
    // Verify Microsoft OAuth configuration
    if (!MICROSOFT_CLIENT_ID) {
      console.error('Outlook connect: Missing MICROSOFT_CLIENT_ID environment variable');
      return NextResponse.json(
        { success: false, error: 'Configuration Error', details: 'Missing Microsoft OAuth credentials' },
        { status: 500 }
      );
    }

    // Get the redirect URI dynamically
    const redirectUri = getRedirectUri(request);

    // Construct the Microsoft OAuth authorization URL
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize');
    authUrl.searchParams.append('client_id', MICROSOFT_CLIENT_ID || '');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('response_mode', 'query');
    
    // Add state parameter with user ID for security and to identify the user on callback
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');
    authUrl.searchParams.append('state', state);

    // Redirect to Microsoft OAuth authorization page
    return NextResponse.redirect(authUrl.toString());
  } catch (error: any) {
    console.error('Error initiating Outlook connection:', error);
    return NextResponse.json(
      { success: false, error: 'Connection Error', details: error.message || 'Unknown error' },
      { status: 500 }
    );
  }
}
