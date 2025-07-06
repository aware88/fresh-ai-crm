import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { usePermissions } from '../../hooks/usePermissions';

interface NavItem {
  name: string;
  href: string;
  permission: string;
}

const RBACNavigation: React.FC = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  const navItems: NavItem[] = [
    { name: 'Roles', href: '/admin/roles', permission: 'organization.roles.manage' },
    { name: 'User Roles', href: '/admin/users/roles', permission: 'organization.users.manage' },
  ];
  
  // Filter items based on permissions
  const authorizedItems = navItems.filter(item => hasPermission(item.permission));
  
  if (authorizedItems.length === 0) {
    return null;
  }
  
  return (
    <div className="bg-white shadow-sm mb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h2 className="text-lg font-medium text-gray-900">Access Management</h2>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {authorizedItems.map((item) => {
                const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${isActive
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    }`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      <div className="sm:hidden">
        <div className="pt-2 pb-3 space-y-1">
          {authorizedItems.map((item) => {
            const isActive = router.pathname === item.href || router.pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block pl-3 pr-4 py-2 border-l-4 text-base font-medium ${isActive
                  ? 'bg-blue-50 border-blue-500 text-blue-700'
                  : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                }`}
              >
                {item.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RBACNavigation;
