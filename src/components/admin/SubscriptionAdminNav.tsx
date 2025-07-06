'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function SubscriptionAdminNav() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Subscription Plans', path: '/admin/subscriptions' },
    { name: 'Organization Subscriptions', path: '/admin/subscriptions/organizations' },
    { name: 'Analytics', path: '/admin/analytics/subscriptions' },
  ];

  return (
    <div className="bg-white shadow-sm mb-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex overflow-x-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`px-4 py-3 text-sm font-medium whitespace-nowrap ${isActive
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
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
}
