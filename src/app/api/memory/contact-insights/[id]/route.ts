/**
 * Contact Memory Insights API Route
 * 
 * GET /api/memory/contact-insights/:id - Get memory insights for a contact
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET handler - Get memory insights for a contact
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const contactId = params.id;
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get user and organization from auth
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const organizationId = user.app_metadata?.org_id;
    
    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }
    
    // Get limit from query params or use default
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    
    // Get contact memory insights
    const { data, error } = await supabase
      .rpc('get_contact_memory_insights', {
        p_contact_id: contactId,
        p_organization_id: organizationId,
        p_limit: limit
      });
    
    if (error) {
      console.error('Error fetching contact memory insights:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contact memory insights' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in contact memory insights GET:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
