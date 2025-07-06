'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Mail, Calendar, Users } from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
}

export default function MicrosoftGraphNav() {
  const pathname = usePathname();
  
  const navItems: NavItem[] = [
    {
      name: 'Email',
      href: '/email/outlook',
      icon: Mail,
    },
    {
      name: 'Calendar',
      href: '/calendar',
      icon: Calendar,
    },
    {
      name: 'Contacts',
      href: '/contacts/microsoft',
      icon: Users,
    },
  ];

  return (
    <nav className="microsoft-graph-nav bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-blue-600 text-white">
        <h2 className="text-lg font-semibold">Microsoft 365</h2>
      </div>
      <ul className="divide-y">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <li key={item.name}>
              <Link
                href={item.href}
                className={`flex items-center px-4 py-3 hover:bg-gray-50 ${isActive ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-700'}`}
              >
                <item.icon className="h-5 w-5 mr-3" />
                <span>{item.name}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
