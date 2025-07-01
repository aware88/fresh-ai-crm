/**
 * API routes for managing Metakocka credentials
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { getSession } from '../../../../../lib/auth/session';
import { MetakockaService, MetakockaCredentials, MetakockaError } from '../../../../../lib/integrations/metakocka';

/**
 * GET /api/integrations/metakocka/credentials
 * Get Metakocka credentials for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get credentials
    const credentials = await MetakockaService.getUserCredentials(session.user.id);
    
    if (!credentials) {
      return NextResponse.json({ exists: false }, { status: 200 });
    }
    
    // Don't return the secret key in the response
    return NextResponse.json({
      exists: true,
      companyId: credentials.companyId,
      apiEndpoint: credentials.apiEndpoint,
    });
  } catch (error) {
    console.error('Error fetching Metakocka credentials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Metakocka credentials' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/integrations/metakocka/credentials
 * Create or update Metakocka credentials
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.companyId || !body.secretKey) {
      return NextResponse.json(
        { error: 'Company ID and Secret Key are required' },
        { status: 400 }
      );
    }
    
    const credentials: MetakockaCredentials = {
      companyId: body.companyId,
      secretKey: body.secretKey,
      apiEndpoint: body.apiEndpoint,
    };
    
    // Test credentials before saving
    if (body.testConnection) {
      try {
        await MetakockaService.testCredentials(credentials);
      } catch (error) {
        if (error instanceof MetakockaError) {
          return NextResponse.json(
            { 
              error: 'Invalid credentials', 
              details: error.message,
              type: error.type,
              code: error.code
            },
            { status: 400 }
          );
        }
        throw error;
      }
    }
    
    // Save credentials
    const success = await MetakockaService.saveCredentials(session.user.id, credentials);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to save credentials' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving Metakocka credentials:', error);
    return NextResponse.json(
      { error: 'Failed to save Metakocka credentials' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/integrations/metakocka/credentials
 * Delete Metakocka credentials
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = createServerClient();
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete credentials
    const success = await MetakockaService.deleteCredentials(session.user.id);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete credentials' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting Metakocka credentials:', error);
    return NextResponse.json(
      { error: 'Failed to delete Metakocka credentials' },
      { status: 500 }
    );
  }
}
