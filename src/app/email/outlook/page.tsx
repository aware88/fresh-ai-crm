import { Metadata } from 'next';
import OutlookClient from '@/components/email/outlook/OutlookClient';

export const metadata: Metadata = {
  title: 'Outlook - Fresh AI CRM',
  description: 'Outlook email integration for Fresh AI CRM',
};

export default function OutlookPage() {
  return (
    <div className="container mx-auto py-6">
      <OutlookClient />
    </div>
  );
}
