import { NextResponse } from 'next/server';
import { getServerSession } from '@/lib/auth';

// Google OAuth configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Function to get the correct redirect URI
function getRedirectUri(request: Request) {
  const host = request.headers.get('host');
  const protocol = request.headers.get('x-forwarded-proto') || 'http';
  
  // If we're in development and accessing via 127.0.0.1, use that
  if (host && host.includes('127.0.0.1')) {
    return `${protocol}://${host}/api/auth/google/callback`;
  }
  
  // Otherwise use the configured NEXTAUTH_URL
  return `${process.env.NEXTAUTH_URL}/api/auth/google/callback`;
}

const SCOPES = [
  'openid',
  'email',
  'profile',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify'
].join(' ');

export async function GET(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.id) {
      console.error('Google connect: No valid session found');
      return NextResponse.json(
        { success: false, error: 'Unauthorized', details: 'No valid session found' },
        { status: 401 }
      );
    }
    
    // Log successful authentication
    console.log(`Google connect: Authenticated user ${session.user.id}`);
    
    // Verify Google OAuth configuration
    if (!GOOGLE_CLIENT_ID) {
      console.error('Google connect: Missing GOOGLE_CLIENT_ID environment variable');
      return NextResponse.json(
        { success: false, error: 'Configuration Error', details: 'Missing Google OAuth credentials' },
        { status: 500 }
      );
    }

    // Get the correct redirect URI based on the request
    const REDIRECT_URI = getRedirectUri(request);
    
    // Construct the Google OAuth authorization URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID || '');
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('scope', SCOPES);
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    
    // Add state parameter with user ID for security and to identify the user on callback
    const state = Buffer.from(JSON.stringify({ userId: session.user.id })).toString('base64');
    authUrl.searchParams.append('state', state);
    
    console.log('Google connect: Redirecting to auth URL with redirect URI:', REDIRECT_URI);
    
    // Redirect to Google OAuth authorization URL
    return NextResponse.redirect(authUrl.toString());
  } catch (error) {
    console.error('Error in Google connect:', error);
    return NextResponse.json(
      { success: false, error: 'Internal Server Error', details: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 