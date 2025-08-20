import { Metadata } from 'next';
import SettingsLayoutClient from './SettingsLayoutClient';

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage account and application settings.',
};

const sidebarNavItems = [
  // Account & Profile
  {
    title: 'Profile',
    href: '/settings',
    group: 'Account'
  },
  {
    title: 'Account & Security',
    href: '/settings/account',
    group: 'Account'
  },
  {
    title: 'Notifications',
    href: '/settings/notifications',
    group: 'Account'
  },
  
  // Organization
  {
    title: 'Team',
    href: '/settings/team',
    group: 'Organization',
    icon: 'Users'
  },
  {
    title: 'Company Branding',
    href: '/settings/branding',
    group: 'Organization'
  },
  {
    title: 'Subscription',
    href: '/settings/subscription',
    group: 'Organization'
  },
  
  // Email & Communication
  {
    title: 'Email Accounts',
    href: '/settings/email-accounts',
    group: 'Email & AI'
  },
  {
    title: 'AI Email Settings',
    href: '/settings/email-ai',
    group: 'Email & AI'
  },
  {
    title: 'Email Learning',
    href: '/settings/learning',
    group: 'Email & AI'
  },
  {
    title: 'Follow-up Settings',
    href: '/settings/followup',
    group: 'Email & AI'
  },
  {
    title: 'Upsell Settings',
    href: '/settings/upsell',
    group: 'Email & AI'
  },
  
  // Data & Files
  {
    title: 'Data Management',
    href: '/settings/data-management',
    group: 'Data & Files'
  },
  {
    title: 'File Management',
    href: '/settings/file-management',
    group: 'Data & Files'
  },
  
  // Interface
  {
    title: 'Appearance',
    href: '/settings/appearance',
    group: 'Interface'
  },
  {
    title: 'Display',
    href: '/settings/display',
    group: 'Interface'
  },
  
  // Integrations
  {
    title: 'Integrations',
    href: '/settings/integrations',
    group: 'Integrations'
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
