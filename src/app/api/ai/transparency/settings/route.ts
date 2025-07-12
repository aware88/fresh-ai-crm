/**
 * API endpoints for agent settings
 * 
 * GET: Get agent settings
 * PUT: Update agent settings
 */

import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { TransparencyService } from '@/lib/ai/transparency/transparency-service';

export async function GET(request: Request) {
  // Get cookies using async pattern for Next.js 15+
  const cookieStore = await cookies();
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get query parameters
    const agentId = searchParams.get('agentId');
    const userId = searchParams.get('userId');
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies: cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organizationId = session.user.user_metadata.organization_id;
    
    // Initialize transparency service
    const transparencyService = new TransparencyService(
      supabase,
      organizationId
    );
    
    // Get settings
    const settings = await transparencyService.getSettings(
      agentId || undefined,
      userId || undefined
    );
    
    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Error in settings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { settingKey, settingValue, agentId, userId } = body;
    
    if (!settingKey || settingValue === undefined) {
      return NextResponse.json({ 
        error: 'Setting key and value are required' 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies: cookieStore });
    
    // Get user session
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const organizationId = session.user.user_metadata.organization_id;
    
    // Initialize transparency service
    const transparencyService = new TransparencyService(
      supabase,
      organizationId
    );
    
    // Update setting
    const setting = await transparencyService.updateSetting({
      settingKey,
      settingValue,
      agentId,
      userId
    });
    
    if (!setting) {
      return NextResponse.json({ 
        error: 'Failed to update setting' 
      }, { status: 500 });
    }
    
    return NextResponse.json({ setting });
  } catch (error) {
    console.error('Error in update settings API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
