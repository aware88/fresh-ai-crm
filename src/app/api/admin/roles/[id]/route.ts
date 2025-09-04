import { NextRequest, NextResponse } from 'next/server';
import { RoleService } from '@/services/role-service';
import { requirePermission } from '@/middleware/auth-middleware';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

/**
 * GET /api/admin/roles/[id]
 * Get a role by ID with its permissions
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if user has permission to view roles
    const auth = await requirePermission('admin.roles.view');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const roleId = id;
    const role = await RoleService.getRoleWithPermissions(roleId);

    if (!role) {
      return NextResponse.json(
        { error: 'Role not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error fetching role:', error);
    return NextResponse.json(
      { error: 'Failed to fetch role' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/roles/[id]
 * Update a role
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if user has permission to edit roles
    const auth = await requirePermission('admin.roles.edit');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const roleId = id;
    const body = await request.json();
    const { name, description, permissions } = body;

    // Update the role
    const role = await RoleService.updateRole(roleId, {
      name,
      description
    });

    // Update permissions if provided
    if (permissions && Array.isArray(permissions)) {
      await RoleService.assignPermissionsToRole(roleId, permissions);
    }

    return NextResponse.json({ role });
  } catch (error) {
    console.error('Error updating role:', error);
    return NextResponse.json(
      { error: 'Failed to update role' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/roles/[id]
 * Delete a role
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    // Check if user has permission to delete roles
    const auth = await requirePermission('admin.roles.delete');
    if (!auth.success && auth.redirect) {
      return NextResponse.redirect(new URL(auth.redirect, request.url));
    } else if (!auth.success) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Use async pattern for params in Next.js 15+
    const { id } = await params;
    const roleId = id;
    await RoleService.deleteRole(roleId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting role:', error);
    return NextResponse.json(
      { error: 'Failed to delete role' },
      { status: 500 }
    );
  }
}