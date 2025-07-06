import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { withPermissionCheck } from '../../../components/withPermissionCheck';
import { Role, RoleService } from '../../../services/RoleService';
import Link from 'next/link';
import RBACNavigation from '../../../components/admin/RBACNavigation';

interface User {
  id: string;
  email: string;
  display_name?: string;
  avatar_url?: string;
}

interface UserWithRoles extends User {
  roles: Role[];
}

const UserRolesPage: React.FC = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const roleService = new RoleService(supabase);
  
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  
  // Fetch the current user's organization
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }
        
        const { data: orgMember, error } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .single();
        
        if (error) throw error;
        
        if (orgMember) {
          setOrganizationId(orgMember.organization_id);
        } else {
          setError('User is not a member of any organization');
        }
      } catch (err) {
        console.error('Error fetching organization:', err);
        setError('Failed to fetch organization');
      }
    };
    
    fetchOrganization();
  }, [supabase]);
  
  // Fetch users and roles when organization ID is available
  useEffect(() => {
    const fetchData = async () => {
      if (!organizationId) return;
      
      try {
        setLoading(true);
        
        // Fetch organization members
        const { data: members, error: membersError } = await supabase
          .from('organization_members')
          .select(`
            user_id,
            auth_users:user_id (id, email, raw_user_meta_data)
          `)
          .eq('organization_id', organizationId);
        
        if (membersError) throw membersError;
        
        // Fetch roles for the organization
        const orgRoles = await roleService.getRoles(organizationId);
        setRoles(orgRoles);
        
        // Process users and their roles
        const usersWithRoles: UserWithRoles[] = [];
        
        for (const member of members || []) {
          if (!member.auth_users) continue;
          
          const userData = member.auth_users;
          const user: UserWithRoles = {
            id: userData.id,
            email: userData.email,
            display_name: userData.raw_user_meta_data?.display_name || userData.email.split('@')[0],
            avatar_url: userData.raw_user_meta_data?.avatar_url,
            roles: [],
          };
          
          // Fetch roles for this user
          const userRoles = await roleService.getUserRoles(user.id);
          user.roles = userRoles;
          
          usersWithRoles.push(user);
        }
        
        setUsers(usersWithRoles);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch users and roles');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [organizationId, roleService, supabase]);
  
  const handleManageRoles = (user: UserWithRoles) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };
  
  const handleRoleToggle = async (roleId: string) => {
    if (!selectedUser) return;
    
    try {
      const hasRole = selectedUser.roles.some(role => role.id === roleId);
      
      if (hasRole) {
        // Remove role from user
        await roleService.removeRoleFromUser(selectedUser.id, roleId);
        
        // Update local state
        setSelectedUser({
          ...selectedUser,
          roles: selectedUser.roles.filter(role => role.id !== roleId),
        });
        
        // Update users list
        setUsers(users.map(user => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              roles: user.roles.filter(role => role.id !== roleId),
            };
          }
          return user;
        }));
      } else {
        // Add role to user
        await roleService.assignRoleToUser(selectedUser.id, roleId);
        
        // Find the role object
        const role = roles.find(r => r.id === roleId);
        if (!role) return;
        
        // Update local state
        setSelectedUser({
          ...selectedUser,
          roles: [...selectedUser.roles, role],
        });
        
        // Update users list
        setUsers(users.map(user => {
          if (user.id === selectedUser.id) {
            return {
              ...user,
              roles: [...user.roles, role],
            };
          }
          return user;
        }));
      }
    } catch (err) {
      console.error('Error updating user roles:', err);
      alert('Failed to update user roles');
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">User Role Management</h1>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6">
      <RBACNavigation />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">User Role Management</h1>
        <Link 
          href="/admin/roles"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Manage Roles
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Roles
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {user.avatar_url ? (
                        <img 
                          className="h-10 w-10 rounded-full" 
                          src={user.avatar_url} 
                          alt={user.display_name || 'User'} 
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 font-medium">
                            {(user.display_name || user.email).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.display_name || user.email.split('@')[0]}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.length > 0 ? (
                      user.roles.map(role => (
                        <span 
                          key={role.id}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {role.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">No roles assigned</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleManageRoles(user)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    Manage Roles
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Role Assignment Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Manage Roles for {selectedUser.display_name || selectedUser.email}
                </h3>
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Select the roles to assign to this user. The user will be granted all permissions associated with these roles.
                </p>
              </div>
              
              <div className="space-y-3 mt-4">
                {roles.map(role => {
                  const isAssigned = selectedUser.roles.some(r => r.id === role.id);
                  return (
                    <div 
                      key={role.id} 
                      className={`border rounded-lg p-3 cursor-pointer ${isAssigned ? 'bg-blue-50 border-blue-300' : 'bg-gray-50 border-gray-200'}`}
                      onClick={() => handleRoleToggle(role.id)}
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
                          <p className="text-sm font-medium text-gray-900">{role.name}</p>
                          {role.description && (
                            <p className="text-xs text-gray-500">{role.description}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowRoleModal(false)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Protect this page with the 'organization.users.manage' permission
export default withPermissionCheck(UserRolesPage, {
  permission: 'organization.users.manage',
  redirectTo: '/unauthorized',
});
