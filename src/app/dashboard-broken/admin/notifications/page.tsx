import { Metadata } from 'next';
import { DashboardShell } from '@/components/shell';
import { DashboardHeader } from '@/components/header';
import NotificationJobRunner from '@/components/admin/NotificationJobRunner';

export const metadata: Metadata = {
  title: 'Notification Management',
  description: 'Manage system notifications and run notification jobs',
};

export default function AdminNotificationsPage() {
  return (
    <DashboardShell>
      <DashboardHeader
        heading="Notification Management"
        text="Manage system notifications and run notification jobs"
      />
      <div className="grid gap-8">
        <NotificationJobRunner />
      </div>
    </DashboardShell>
  );
}
