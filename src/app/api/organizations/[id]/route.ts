import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: organizationId } = await params;
    const supabase = createServiceRoleClient();

    // Fetch organization details
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (orgError) {
      console.error('Error fetching organization:', orgError);
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Verify user has access to this organization
    const { data: membership, error: membershipError } = await supabase
      .from('organization_members')
      .select('id, role')
      .eq('organization_id', organizationId)
      .eq('user_id', session.user.id)
      .single();

    if (membershipError || !membership) {
      console.error('User not member of organization:', membershipError);
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(organization);

  } catch (error) {
    console.error('Error in organizations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}