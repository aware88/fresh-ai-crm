import React from 'react';
import Link from 'next/link';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navItems = [
    { name: 'Dashboard', href: '/admin' },
    { name: 'Organizations', href: '/admin/organizations' },
    { name: 'Users', href: '/admin/users' },
    { name: 'Subscriptions', href: '/admin/subscriptions' },
    { name: 'Analytics', href: '/admin/analytics' },
    { name: 'Settings', href: '/admin/settings' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
        </div>
        <nav className="mt-6">
          <ul>
            {navItems.map((item) => (
              <li key={item.name} className="mb-2">
                <Link
                  href={item.href}
                  className="block px-4 py-2 hover:bg-gray-800 rounded-md"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 bg-gray-100">
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
};

export default AdminLayout;
