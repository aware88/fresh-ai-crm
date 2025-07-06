import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { withPermissionCheck } from '../../../components/withPermissionCheck';
import { Role, RoleService } from '../../../services/RoleService';
import Link from 'next/link';
import RBACNavigation from '../../../components/admin/RBACNavigation';

const RolesManagementPage: React.FC = () => {
  const supabase = useSupabaseClient();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  
  // Initialize the role service
  const roleService = new RoleService(supabase);
  
  // Fetch the current user's organization
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) return;
        
        const { data: orgMember, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (orgMember) {
          setOrganizationId(orgMember.organization_id);
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('Failed to fetch organization');
      }
    };
    
    fetchOrganization();
  }, [supabase]);
  
  // Fetch roles when organization ID is available
  useEffect(() => {
    const fetchRoles = async () => {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        const fetchedRoles = await roleService.getRoles(organizationId);
        setRoles(fetchedRoles);
      } catch (err) {
        console.error('Error fetching roles:', err);
        setError('Failed to fetch roles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRoles();
  }, [organizationId, roleService]);
  
  const handleDeleteRole = async (roleId: string) => {
    if (!confirm('Are you sure you want to delete this role? This action cannot be undone.')) {
      return;
    }
    
    try {
      await roleService.deleteRole(roleId);
      setRoles(roles.filter(role => role.id !== roleId));
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Failed to delete role. It may be in use by users.');
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Role Management</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Role Management</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <RBACNavigation />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <Link 
          href="/admin/roles/create"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
        >
          Create New Role
        </Link>
      </div>
      
      {roles.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <p className="text-gray-600">No custom roles found for your organization.</p>
          <p className="mt-2">
            <Link 
              href="/admin/roles/create"
              className="text-blue-600 hover:text-blue-800 underline"
            >
              Create your first role
            </Link>
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {roles.map((role) => (
                <tr key={role.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{role.name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">{role.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {new Date(role.created_at).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link 
                      href={`/admin/roles/${role.id}`}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Protect this page with the 'organization.roles.manage' permission
export default withPermissionCheck(RolesManagementPage, {
  permission: 'organization.roles.manage',
  redirectTo: '/unauthorized',
});
