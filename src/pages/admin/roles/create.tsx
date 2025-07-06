import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { withPermissionCheck } from '../../../components/withPermissionCheck';
import { RoleService } from '../../../services/RoleService';
import Link from 'next/link';
import RBACNavigation from '../../../components/admin/RBACNavigation';

const CreateRolePage: React.FC = () => {
  const router = useRouter();
  const supabase = useSupabaseClient();
  const roleService = new RoleService(supabase);
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
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
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrganization();
  }, [supabase]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!organizationId) {
      setError('No organization found');
      return;
    }
    
    try {
      setCreating(true);
      
      // Create new role
      const newRole = await roleService.createRole({
        name: formData.name,
        description: formData.description,
        organization_id: organizationId,
      });
      
      // Redirect to the role edit page to assign permissions
      router.push(`/admin/roles/${newRole.id}`);
    } catch (err) {
      console.error('Error creating role:', err);
      setError('Failed to create role');
      setCreating(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Create New Role</h1>
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
        <h1 className="text-2xl font-bold">Create New Role</h1>
        <Link 
          href="/admin/roles"
          className="text-blue-600 hover:text-blue-800 underline"
        >
          Back to Roles
        </Link>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      <div className="bg-white shadow overflow-hidden rounded-lg">
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
              placeholder="e.g., Marketing Manager"
              required
            />
          </div>
          
          <div className="mb-6">
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
              placeholder="Describe the purpose and responsibilities of this role"
            />
          </div>
          
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={creating || !organizationId}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Role'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-800 font-medium mb-2">What's Next?</h3>
        <p className="text-blue-700 text-sm">
          After creating the role, you'll be able to assign specific permissions to it. 
          Users with this role will be granted those permissions within your organization.
        </p>
      </div>
    </div>
  );
};

// Protect this page with the 'organization.roles.manage' permission
export default withPermissionCheck(CreateRolePage, {
  permission: 'organization.roles.manage',
  redirectTo: '/unauthorized',
});
