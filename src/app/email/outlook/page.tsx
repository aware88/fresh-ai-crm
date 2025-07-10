import { Metadata } from 'next';
import OutlookClient from '@/components/email/outlook/OutlookClient';

export const metadata: Metadata = {
  title: 'Outlook - ARIS',
  description: 'Outlook email integration for ARIS',
};

export default function OutlookPage() {
  return (
    <div className="container mx-auto py-6">
      <OutlookClient />
    </div>
  );
}
