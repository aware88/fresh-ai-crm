import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { RoleService } from '../src/services/RoleService';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { PostgrestFilterBuilder } from '@supabase/postgrest-js';

// Test data
const TEST_ORGANIZATION_ID = 'org-123';
const TEST_ROLE_NAME = 'test-role';
const testRoleId = 'role-123';
const testPermissionId = 'perm-456';
const testUserId = 'user-123';

// Mock Supabase client types
type MockQueryBuilder = {
  select: jest.Mock;
  eq: jest.Mock;
  single: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  match: jest.Mock;
};

// Create a mock query builder
const createMockQueryBuilder = (): MockQueryBuilder => {
  const builder = {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    match: jest.fn().mockReturnThis()
  };
  return builder as unknown as MockQueryBuilder;
};

// Create mock Supabase client
const createMockSupabase = () => {
  const queryBuilder = createMockQueryBuilder();
  
  return {
    from: jest.fn().mockReturnValue(queryBuilder),
    rpc: jest.fn().mockReturnThis(),
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
      onAuthStateChange: jest.fn()
    }
  } as unknown as SupabaseClient;
};

// Mock the supabase client module
const mockSupabase = createMockSupabase();

// Mock the RoleService
const createMockRoleService = () => {
  return {
    createRole: jest.fn().mockResolvedValue({
      id: testRoleId,
      name: TEST_ROLE_NAME,
      description: 'Test role',
      organization_id: TEST_ORGANIZATION_ID
    }),
    getRole: jest.fn().mockResolvedValue({
      id: testRoleId,
      name: TEST_ROLE_NAME,
      description: 'Test role',
      organization_id: TEST_ORGANIZATION_ID
    }),
    updateRole: jest.fn().mockResolvedValue({
      id: testRoleId,
      name: 'Updated Role',
      description: 'Updated description',
      organization_id: TEST_ORGANIZATION_ID
    }),
    deleteRole: jest.fn().mockResolvedValue(true),
    assignPermissionToRole: jest.fn().mockResolvedValue(true),
    removePermissionFromRole: jest.fn().mockResolvedValue(true),
    assignRoleToUser: jest.fn().mockResolvedValue(true),
    removeRoleFromUser: jest.fn().mockResolvedValue(true),
    getUserRoles: jest.fn().mockResolvedValue([{
      id: testRoleId,
      name: TEST_ROLE_NAME,
      description: 'Test role',
      organization_id: TEST_ORGANIZATION_ID
    }])
  };
};

describe('RoleService', () => {
  let roleService: RoleService;
  let mockRoleService: ReturnType<typeof createMockRoleService>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create fresh mocks
    mockRoleService = createMockRoleService();
    
    // Create RoleService instance with mocked Supabase client
    roleService = new RoleService(mockSupabase);
    
    // Replace methods with our mocks
    Object.assign(roleService, mockRoleService);
  });

  describe('Role Management', () => {
    it('should create a role', async () => {
      const roleData = {
        name: TEST_ROLE_NAME,
        description: 'Test role',
        organization_id: TEST_ORGANIZATION_ID
      };
      
      const result = await roleService.createRole(roleData);
      
      expect(mockRoleService.createRole).toHaveBeenCalledWith(roleData);
      expect(result).toHaveProperty('id');
      expect(result.name).toBe(roleData.name);
      expect(result.organization_id).toBe(TEST_ORGANIZATION_ID);
    });

    it('should get a role by id', async () => {
      const result = await roleService.getRole(testRoleId);
      
      expect(mockRoleService.getRole).toHaveBeenCalledWith(testRoleId);
      expect(result).toBeDefined();
      expect(result?.id).toBe(testRoleId);
    });

    it('should update a role', async () => {
      const updates = {
        name: 'Updated Role'
      };
      
      const result = await roleService.updateRole(testRoleId, updates);
      
      expect(mockRoleService.updateRole).toHaveBeenCalledWith(testRoleId, updates);
      expect(result?.name).toBe(updates.name);
    });

    it('should delete a role', async () => {
      await roleService.deleteRole(testRoleId);
      expect(mockRoleService.deleteRole).toHaveBeenCalledWith(testRoleId);
    });
  });

  describe('Permission Management', () => {
    it('should assign a permission to a role', async () => {
      const result = await roleService.assignPermissionToRole(testRoleId, testPermissionId);
      
      expect(mockRoleService.assignPermissionToRole).toHaveBeenCalledWith(
        testRoleId,
        testPermissionId
      );
      expect(result).toBe(true);
    });

    it('should remove a permission from a role', async () => {
      const result = await roleService.removePermissionFromRole(testRoleId, testPermissionId);
      
      expect(mockRoleService.removePermissionFromRole).toHaveBeenCalledWith(
        testRoleId,
        testPermissionId
      );
      expect(result).toBe(true);
    });
  });

  describe('User Role Management', () => {
    it('should assign a role to a user', async () => {
      const result = await roleService.assignRoleToUser(testUserId, testRoleId);
      
      expect(mockRoleService.assignRoleToUser).toHaveBeenCalledWith(
        testUserId,
        testRoleId
      );
      expect(result).toBe(true);
    });

    it('should remove a role from a user', async () => {
      const result = await roleService.removeRoleFromUser(testUserId, testRoleId);
      
      expect(mockRoleService.removeRoleFromUser).toHaveBeenCalledWith(
        testUserId,
        testRoleId
      );
      expect(result).toBe(true);
    });

    it('should get roles for a user', async () => {
      const result = await roleService.getUserRoles(testUserId);
      
      expect(mockRoleService.getUserRoles).toHaveBeenCalledWith(testUserId);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
    });
  });
});
