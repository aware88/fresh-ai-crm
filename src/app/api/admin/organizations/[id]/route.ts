import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { requirePermission } from '@/lib/auth/middleware';

// GET /api/admin/organizations/[id] - Get a specific organization
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to view organizations
    const auth = await requirePermission('admin.organizations.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    const supabase = createServerClient();

    // Get organization with user count
    const { data: organization, error } = await supabase
      .from('organizations')
      .select(`
        *,
        users:user_organizations(count)
      `)
      .eq('id', organizationId)
      .single();

    if (error) {
      console.error('Error fetching organization:', error);
      return NextResponse.json({ error: 'Failed to fetch organization' }, { status: 500 });
    }

    if (!organization) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Process the data to get user count
    const orgWithUserCount = {
      ...organization,
      user_count: organization.users?.[0]?.count || 0,
      users: undefined // Remove the users array
    };

    // Enrich with quick 30d metrics
    const thirtyDaysAgoISO = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const [{ data: usageRows }, { data: queueRows }] = await Promise.all([
      supabase
        .from('ai_usage_tracking')
        .select('cost_usd')
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgoISO),
      supabase
        .from('email_queue')
        .select('status')
        .eq('organization_id', organizationId)
        .gte('created_at', thirtyDaysAgoISO)
    ]);
    const messages = (usageRows || []).length;
    const costUsd = (usageRows || []).reduce((sum: number, r: any) => sum + parseFloat(r.cost_usd || '0'), 0);
    const autoApproved = (queueRows || []).filter((r: any) => (r.status || '').toLowerCase() === 'approved').length;

    return NextResponse.json({ 
      organization: {
        ...orgWithUserCount,
        metrics: {
          monthly_ai_messages: messages,
          monthly_ai_cost_usd: Math.round(costUsd * 100) / 100,
          monthly_auto_approved: autoApproved
        }
      }
    });
  } catch (error) {
    console.error('Error in organization API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/organizations/[id] - Update a specific organization
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to update organizations
    const auth = await requirePermission('admin.organizations.edit');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    const body = await request.json();
    const { name, slug } = body;

    // Validate input
    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Name and slug are required' },
        { status: 400 }
      );
    }

    // Validate slug format (only lowercase letters, numbers, and hyphens)
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: 'Slug can only contain lowercase letters, numbers, and hyphens' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Check if slug is already in use by another organization
    const { data: existingOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('slug', slug)
      .neq('id', organizationId)
      .single();

    if (existingOrg) {
      return NextResponse.json(
        { error: 'Organization slug is already in use' },
        { status: 400 }
      );
    }

    // Update the organization
    const { data: organization, error } = await supabase
      .from('organizations')
      .update({ name, slug })
      .eq('id', organizationId)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Failed to update organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ organization });
  } catch (error) {
    console.error('Error in organization API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/organizations/[id] - Delete a specific organization
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if user has permission to delete organizations
    const auth = await requirePermission('admin.organizations.delete');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const organizationId = id;
    const supabase = createServerClient();

    // Check if organization exists
    const { data: existingOrg, error: checkError } = await supabase
      .from('organizations')
      .select('id')
      .eq('id', organizationId)
      .single();

    if (checkError || !existingOrg) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Delete the organization
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', organizationId);

    if (error) {
      console.error('Error deleting organization:', error);
      return NextResponse.json(
        { error: 'Failed to delete organization' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in organization API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
