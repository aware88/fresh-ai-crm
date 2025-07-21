/**
 * API route for testing Metakocka connection
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../../lib/supabase/server';
import { cookies } from 'next/headers';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { MetakockaService } from '../../../../../lib/integrations/metakocka/service';
import { MetakockaCredentials, MetakockaError } from '../../../../../lib/integrations/metakocka/types';

/**
 * POST /api/integrations/metakocka/test-connection
 * Test Metakocka connection with provided credentials
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
      apiEndpoint: body.apiEndpoint,
    };
    
    try {
      // Test the connection
      const success = await MetakockaService.testCredentials(credentials);
      return NextResponse.json({ success });
    } catch (error) {
      if (error instanceof MetakockaError) {
        return NextResponse.json(
          { 
            success: false, 
            error: error.message,
            type: error.type,
            code: error.code
          },
          { status: 400 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error('Error testing Metakocka connection:', error);
    return NextResponse.json(
      { error: 'Failed to test Metakocka connection' },
      { status: 500 }
    );
  }
}
