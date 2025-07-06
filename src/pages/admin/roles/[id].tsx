import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { withPermissionCheck } from '../../../components/withPermissionCheck';
import { Role, Permission, RoleService } from '../../../services/RoleService';
import Link from 'next/link';
import RBACNavigation from '../../../components/admin/RBACNavigation';

const RoleEditPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const supabase = useSupabaseClient();
  const roleService = new RoleService(supabase);
  
  const [role, setRole] = useState<Role | null>(null);
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  // Fetch role and permissions data
  useEffect(() => {
    const fetchData = async () => {
      if (!id || typeof id !== 'string') return;
      
      try {
        setLoading(true);
        
        // Fetch role details
        const roleData = await roleService.getRole(id);
        if (!roleData) {
          setError('Role not found');
          return;
        }
        
        setRole(roleData);
        setFormData({
          name: roleData.name,
          description: roleData.description || '',
        });
        
        // Fetch all permissions
        const allPerms = await roleService.getAllPermissions();
        setAllPermissions(allPerms);
        
        // Fetch permissions assigned to this role
        const rolePerms = await roleService.getRolePermissions(id);
        setRolePermissions(rolePerms);
      } catch (err) {
        console.error('Error fetching role data:', err);
        setError('Failed to load role data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, roleService]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || typeof id !== 'string' || !role) return;
    
    try {
      setSaving(true);
      
      // Update role details
      await roleService.updateRole(id, {
        name: formData.name,
        description: formData.description,
      });
      
      alert('Role updated successfully');
    } catch (err) {
      console.error('Error updating role:', err);
      setError('Failed to update role');
    } finally {
      setSaving(false);
    }
  };
  
  const handlePermissionToggle = async (permission: Permission) => {
    if (!id || typeof id !== 'string') return;
    
    try {
      const hasPermission = rolePermissions.some(p => p.id === permission.id);
      
      if (hasPermission) {
        // Remove permission from role
        await roleService.removePermissionFromRole(id, permission.id);
        setRolePermissions(rolePermissions.filter(p => p.id !== permission.id));
      } else {
        // Add permission to role
        await roleService.assignPermissionToRole(id, permission.id);
        setRolePermissions([...rolePermissions, permission]);
      }
    } catch (err) {
      console.error('Error updating permissions:', err);
      alert('Failed to update permissions');
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Role</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error || !role) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Edit Role</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Role not found'}
        </div>
        <div className="mt-4">
          <Link 
            href="/admin/roles"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Roles
          </Link>
        </div>
      </div>
    );
  }
  
  // Group permissions by resource type for better organization
  const groupedPermissions: Record<string, Permission[]> = {};
  allPermissions.forEach(permission => {
    const resourceType = permission.resource_type.split('.')[0];
    if (!groupedPermissions[resourceType]) {
      groupedPermissions[resourceType] = [];
    }
    groupedPermissions[resourceType].push(permission);
  });
  
  return (
    <div className="p-6">
      <RBACNavigation />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Edit Role: {role.name}</h1>
        <Link 
          href="/admin/roles"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Roles
        </Link>
      </div>
      
      <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Role Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Permissions</h2>
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Select the permissions to assign to this role. Users with this role will be granted these permissions.
          </p>
          
          {Object.entries(groupedPermissions).map(([resourceType, permissions]) => (
            <div key={resourceType} className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3 capitalize">
                {resourceType} Permissions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map(permission => {
                  const isAssigned = rolePermissions.some(p => p.id === permission.id);
                  return (
                    <div 
                      key={permission.id} 
                      className={`border rounded-lg p-3 cursor-pointer ${isAssigned ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}
                      onClick={() => handlePermissionToggle(permission)}
                    >
                      <div className="flex items-start">
                        <div className="flex-shrink-0 mt-0.5">
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={() => {}} // Handled by the div onClick
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">{permission.name}</p>
                          <p className="text-xs text-gray-500">{permission.description}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Protect this page with the 'organization.roles.manage' permission
export default withPermissionCheck(RoleEditPage, {
  permission: 'organization.roles.manage',
  redirectTo: '/unauthorized',
});
