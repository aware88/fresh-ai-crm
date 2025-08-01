import { Metadata } from 'next';
import NotificationPreferences from '@/components/settings/NotificationPreferences';
import { DashboardShell } from '@/components/shell';
import { DashboardHeader } from '@/components/header';

export const metadata: Metadata = {
  title: 'Notification Preferences',
  description: 'Manage your notification preferences',
};

export default function NotificationsSettingsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Notification Preferences"
        text="Manage how you receive notifications from the system."
      />
      <div className="grid gap-8">
        <NotificationPreferences />
      </div>
    </DashboardShell>
  );
}
