import React from 'react';
import { withPermissionCheck } from '../../components/withPermissionCheck';
import { usePermissionContext } from '../../contexts/PermissionContext';

const ProtectedPageContent: React.FC = () => {
  const { permissions } = usePermissionContext();
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Protected Page</h1>
      <p className="mb-4">
        This page is only accessible to users with the <code>organization.settings.view</code> permission.
      </p>
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <h2 className="text-green-800 font-semibold mb-2">Access Granted</h2>
        <p className="text-green-700">
          You have successfully accessed this protected page because you have the required permission.
        </p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-3">Your Permissions</h2>
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
      </div>
    </div>
  );
};

// Protect this page with the 'organization.settings.view' permission
const ProtectedPage = withPermissionCheck(ProtectedPageContent, {
  permission: 'organization.settings.view',
  redirectTo: '/unauthorized',
});

export default ProtectedPage;
