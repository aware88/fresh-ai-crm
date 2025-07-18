import { Metadata } from 'next';
import { SidebarNav } from '@/components/sidebar-nav';
import Link from 'next/link';

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
    title: 'User Identity',
    href: '/settings/user-identity',
    group: 'User'
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
    group: 'Billing'
  },
  {
    title: 'Company Branding',
    href: '/settings/branding',
    group: 'Company'
  },
  {
    title: 'Data Management',
    href: '/settings/data-management',
    group: 'Company'
  },
  {
    title: 'File Management',
    href: '/settings/file-management',
    group: 'Company'
  },
  {
    title: 'Email Accounts',
    href: '/settings/email-accounts',
    group: 'Communication'
  },
  {
    title: 'AI Email Settings',
    href: '/settings/email-ai',
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
            <div className="flex items-center justify-between">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <Link 
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Back to Dashboard
              </Link>
            </div>
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
