// Re-export auth middleware functionality
export { withAuth } from './auth-middleware';

// Re-export server middleware functions from middleware directory
export { requirePermission, requireAuth, requireSystemAdmin, requireOrganizationAdmin } from '@/middleware/auth-middleware';
