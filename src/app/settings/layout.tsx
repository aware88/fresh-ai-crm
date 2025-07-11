import { Metadata } from 'next';
import { SidebarNav } from '@/components/sidebar-nav';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage account and application settings.',
};

const sidebarNavItems = [
  {
    title: 'Profile',
    href: '/settings',
    group: 'User'
  },
  {
    title: 'Account',
    href: '/settings/account',
    group: 'User'
  },
  {
    title: 'Email Accounts',
    href: '/settings/email-accounts',
    group: 'Communication'
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    group: 'Preferences'
  },
  {
    title: 'Appearance',
    href: '/settings/appearance',
    group: 'Preferences'
  },
  {
    title: 'Display',
    href: '/settings/display',
    group: 'Preferences'
  },
  {
    title: 'Security',
    href: '/settings/security',
    group: 'Advanced'
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    group: 'Advanced'
  },
  {
    title: 'Metakocka',
    href: '/settings/integrations/metakocka',
    group: 'Advanced'
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 md:p-8 max-w-7xl">
        <div className="flex flex-col space-y-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account settings and preferences
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sticky sidebar */}
            <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pb-8 w-full lg:w-64 shrink-0">
              <SidebarNav items={sidebarNavItems} />
            </aside>
            
            {/* Main content */}
            <main className="flex-1 bg-card rounded-lg border p-6 shadow-sm">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
