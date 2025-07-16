/**
 * API routes for managing Metakocka credentials
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { MetakockaService, MetakockaCredentials, MetakockaError } from '../../../../../lib/integrations/metakocka';

/**
 * GET /api/integrations/metakocka/credentials
 * Get Metakocka credentials for the current user
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
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
    // Get authenticated user using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
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
      apiEndpoint: body.apiEndpoint || 'https://main.metakocka.si/rest/eshop/v1/json/',
    };
    
    // Test connection if requested
    if (body.testConnection) {
      try {
        await MetakockaService.testCredentials(credentials);
      } catch (error) {
        if (error instanceof MetakockaError) {
          return NextResponse.json(
            { 
              error: error.message,
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
        { error: 'Failed to save Metakocka credentials' },
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
 * Delete Metakocka credentials for the current user
 */
export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user using NextAuth
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Delete credentials by deactivating them
    const supabase = await createServerClient();
    const { error } = await supabase
      .from('metakocka_credentials')
      .update({ is_active: false })
      .eq('user_id', session.user.id);
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete Metakocka credentials' },
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
