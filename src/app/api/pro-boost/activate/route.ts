import { NextRequest, NextResponse } from 'next/server';
import { getUID } from '@/lib/auth/utils';
import { featureFlagService } from '@/lib/services/feature-flag-service';
import { proBoostService } from '@/lib/services/pro-boost-service';

export async function POST(request: NextRequest) {
  try {
    const uid = await getUID();
    if (!uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const organizationId = await featureFlagService.getUserOrganization(uid);
    if (!organizationId) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

    const { durationDays = 7 } = await request.json().catch(() => ({ durationDays: 7 }));
    const status = await proBoostService.activate(organizationId, durationDays);
    if (!status) return NextResponse.json({ error: 'Activation failed' }, { status: 500 });

    return NextResponse.json({ success: true, status });
  } catch (error) {
    console.error('Pro Boost activation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



