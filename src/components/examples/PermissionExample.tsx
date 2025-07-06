import React from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import { PermissionGate } from '../PermissionGate';

/**
 * Example component demonstrating how to use the RBAC system
 */
export const PermissionExample: React.FC = () => {
  const { hasPermission, permissions, loading } = usePermissions();
  
  if (loading) {
    return <div>Loading permissions...</div>;
  }
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">RBAC Example</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Your Permissions</h2>
        {permissions.length === 0 ? (
          <p>You don't have any permissions.</p>
        ) : (
          <ul className="list-disc pl-5">
            {permissions.map(permission => (
              <li key={permission.resource_type} className="mb-1">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {permission.resource_type}
                </span>
                {' - '}
                <span>{permission.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Example 1: Direct permission check */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Direct Permission Check</h3>
          <div className="mb-4">
            <code>hasPermission('organization.users.view')</code>
            <div className="mt-2">
              Result: {hasPermission('organization.users.view') ? (
                <span className="text-green-600 font-semibold">✓ Has Access</span>
              ) : (
                <span className="text-red-600 font-semibold">✗ No Access</span>
              )}
            </div>
          </div>
        </div>
        
        {/* Example 2: Using PermissionGate */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Using PermissionGate</h3>
          <div className="mb-4">
            <code>{'<PermissionGate permission="organization.settings.edit">'}</code>
            <div className="mt-2">
              <PermissionGate 
                permission="organization.settings.edit"
                fallback={<span className="text-red-600 font-semibold">✗ No Access to Edit Settings</span>}
              >
                <span className="text-green-600 font-semibold">✓ Can Edit Settings</span>
              </PermissionGate>
            </div>
          </div>
        </div>
        
        {/* Example 3: Multiple permissions (any) */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Any Permission Check</h3>
          <div className="mb-4">
            <code>{'<PermissionGate anyPermission={["organization.users.invite", "organization.users.remove"]}>'}</code>
            <div className="mt-2">
              <PermissionGate 
                anyPermission={["organization.users.invite", "organization.users.remove"]}
                fallback={<span className="text-red-600 font-semibold">✗ Cannot Manage Users</span>}
              >
                <span className="text-green-600 font-semibold">✓ Can Manage Users</span>
              </PermissionGate>
            </div>
          </div>
        </div>
        
        {/* Example 4: Multiple permissions (all) */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">All Permissions Check</h3>
          <div className="mb-4">
            <code>{'<PermissionGate allPermissions={["organization.settings.view", "organization.branding.edit"]}>'}</code>
            <div className="mt-2">
              <PermissionGate 
                allPermissions={["organization.settings.view", "organization.branding.edit"]}
                fallback={<span className="text-red-600 font-semibold">✗ Missing Required Permissions</span>}
              >
                <span className="text-green-600 font-semibold">✓ Has All Required Permissions</span>
              </PermissionGate>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
