import { Metadata } from 'next';
import SettingsLayoutClient from './SettingsLayoutClient';

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
    title: 'Subscription',
    href: '/settings/subscription',
    group: 'Billing'
  },
  {
    title: 'Team',
    href: '/settings/team',
    group: 'Organization',
    icon: 'Users'
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
    title: 'Email Learning',
    href: '/settings/learning',
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
    title: 'Account',
    href: '/settings/account',
    group: 'Security'
  },
  {
    title: 'Security',
    href: '/settings/security',
    group: 'Security'
  },
  {
    title: 'Integrations',
    href: '/settings/integrations',
    group: 'Advanced'
  },
  {
    title: 'Metakocka',
    href: '/settings/integrations/metakocka',
    group: 'Advanced',
    icon: 'Database'
  },
];

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <SettingsLayoutClient sidebarNavItems={sidebarNavItems}>
      {children}
    </SettingsLayoutClient>
  );
}
