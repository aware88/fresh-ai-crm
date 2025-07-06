import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/middleware';

// GET /api/admin/organizations/[id]/features - Get organization feature flags
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to view organization features
    const auth = await requirePermission('admin.organizations.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const organizationId = params.id;
    const supabase = createServerClient();

    // Get organization feature flags
    const { data: organization, error } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization feature flags:', error);
      return NextResponse.json({ error: 'Failed to fetch organization feature flags' }, { status: 500 });
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    return NextResponse.json({ feature_flags: organization.feature_flags || {} });
  } catch (error) {
    console.error('Error in organization features API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/organizations/[id]/features - Update organization feature flags
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to update organization features
    const auth = await requirePermission('admin.organizations.edit');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const organizationId = params.id;
    const body = await request.json();
    const { feature_flags } = body;

    // Validate input
    if (!feature_flags || typeof feature_flags !== 'object') {
      return NextResponse.json(
        { error: 'Valid feature_flags object is required' },
        { status: 400 }
      );
    }

    // Define allowed feature flags
    const allowedFeatures = [
      'ai_assistant',
      'document_processing',
      'advanced_analytics',
      'metakocka_integration',
      'email_templates',
      'bulk_operations',
      'custom_fields',
      'api_access'
    ];

    // Filter and validate feature flags
    const validatedFeatureFlags: Record<string, boolean> = {};
    for (const feature of allowedFeatures) {
      validatedFeatureFlags[feature] = Boolean(feature_flags[feature]);
    }

    const supabase = createServerClient();

    // Update the organization feature flags
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({ feature_flags: validatedFeatureFlags })
      .eq('id', organizationId)
      .select('feature_flags')
      .single();

    if (error) {
      console.error('Error updating organization feature flags:', error);
      return NextResponse.json(
        { error: 'Failed to update organization feature flags' },
        { status: 500 }
      );
    }

    return NextResponse.json({ feature_flags: organization.feature_flags });
  } catch (error) {
    console.error('Error in organization features API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
