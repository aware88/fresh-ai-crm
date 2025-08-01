import { Metadata } from 'next';
import { SidebarNav } from '@/components/sidebar-nav';

export const metadata: Metadata = {
  title: 'Admin',
  description: 'Admin dashboard and management tools.',
};

const sidebarNavItems = [
  {
    title: 'Overview',
    href: '/dashboard/admin',
  },
  {
    title: 'Users',
    href: '/dashboard/admin/users',
  },
  {
    title: 'Organizations',
    href: '/dashboard/admin/organizations',
  },
  {
    title: 'Subscriptions',
    href: '/dashboard/admin/subscriptions',
  },
  {
    title: 'Notifications',
    href: '/dashboard/admin/notifications',
  },
  {
    title: 'Audit Logs',
    href: '/dashboard/admin/audit-logs',
  },
  {
    title: 'System Settings',
    href: '/dashboard/admin/settings',
  },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="space-y-6 p-10 pb-16">
      <div className="space-y-0.5">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-muted-foreground">
          Manage users, organizations, and system settings.
        </p>
      </div>
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="-mx-4 lg:w-1/5">
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className="flex-1 lg:max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
