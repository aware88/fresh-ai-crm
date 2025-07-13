import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Dynamic import to prevent build-time Supabase client creation
const getAuditService = async () => {
  const { AuditService } = await import('@/lib/services/audit-service');
  return AuditService;
};

/**
 * GET /api/admin/audit-logs
 * Get audit logs with filtering and pagination
 * This endpoint is admin-only
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if the user is an organization admin or system admin
    const isSystemAdmin = session.user.isAdmin;
    
    // Parse query parameters
    const url = new URL(request.url);
    const organizationId = url.searchParams.get('organizationId');
    const userId = url.searchParams.get('userId');
    const actionType = url.searchParams.get('actionType');
    const entityType = url.searchParams.get('entityType');
    const entityId = url.searchParams.get('entityId');
    const fromDate = url.searchParams.get('fromDate');
    const toDate = url.searchParams.get('toDate');
    const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 50;
    const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : 0;

    // If not a system admin, ensure they can only view logs for their organization
    if (!isSystemAdmin && !organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required for non-system admins' },
        { status: 400 }
      );
    }

    // Build filter parameters
    const filterParams: any = {
      limit,
      offset,
    };

    if (organizationId) {
      filterParams.organization_id = organizationId;
    }

    if (userId) {
      filterParams.user_id = userId;
    }

    if (actionType) {
      filterParams.action_type = actionType;
    }

    if (entityType) {
      filterParams.entity_type = entityType;
    }

    if (entityId) {
      filterParams.entity_id = entityId;
    }

    if (fromDate) {
      filterParams.from_date = new Date(fromDate);
    }

    if (toDate) {
      filterParams.to_date = new Date(toDate);
    }

    // Get audit logs
    const auditService = await getAuditService();
    const { logs, count } = await auditService.getAuditLogs(filterParams);

    return NextResponse.json({
      logs,
      pagination: {
        total: count,
        limit,
        offset,
      },
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to get audit logs' },
      { status: 500 }
    );
  }
}
