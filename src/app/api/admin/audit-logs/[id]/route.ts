import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditService } from '@/lib/services/audit-service';

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET /api/admin/audit-logs/[id]
 * Get a specific audit log by ID
 * This endpoint is admin-only
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Check authentication and admin status
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the audit log
    const auditLog = await AuditService.getAuditLogById(params.id);

    if (!auditLog) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 });
    }

    // Check if the user has permission to view this audit log
    const isSystemAdmin = session.user.isAdmin;
    const isOrgAdmin = auditLog.organization_id && session.user.organizations?.some(
      org => org.id === auditLog.organization_id && org.role === 'admin'
    );

    if (!isSystemAdmin && !isOrgAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(auditLog);
  } catch (error) {
    console.error('Error getting audit log:', error);
    return NextResponse.json(
      { error: 'Failed to get audit log' },
      { status: 500 }
    );
  }
}
