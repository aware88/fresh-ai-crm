import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/services/role-service';
import { requirePermission } from '@/middleware/auth-middleware';

/**
 * GET /api/admin/roles
 * Get all roles
 */
export async function GET(request: NextRequest) {
  try {
    // Check if user has permission to view roles
    const auth = await requirePermission('admin.roles.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get organization ID from query params if present
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organization_id');

    let roles;
    if (organizationId) {
      roles = await RoleService.getOrganizationRoles(organizationId);
    } else {
      roles = await RoleService.getAllRoles();
    }

    return NextResponse.json({ roles });
  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch roles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/roles
 * Create a new role
 */
export async function POST(request: NextRequest) {
  try {
    // Check if user has permission to create roles
    const auth = await requirePermission('admin.roles.create');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, type, organization_id, permissions } = body;

    // Create the role
    const role = await RoleService.createRole({
      name,
      description,
      type,
      organization_id
    });

    // Assign permissions if provided
    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      await RoleService.assignPermissionsToRole(role.id, permissions);
    }

    return NextResponse.json({ role }, { status: 201 });
  } catch (error) {
    console.error('Error creating role:', error);
    return NextResponse.json(
      { error: 'Failed to create role' },
      { status: 500 }
    );
  }
}
