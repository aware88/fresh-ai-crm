import { Metadata } from 'next';
import EnhancedEmailDemo from '@/components/email/EnhancedEmailDemo';

export const metadata: Metadata = {
  title: 'Enhanced Email Demo - ARIS',
  description: 'Gmail & Outlook-level email functionality with rich text editing and smart attachments',
};

export default function EnhancedEmailDemoPage() {
  return (
    <div className="container mx-auto py-6">
      <EnhancedEmailDemo />
    </div>
  );
}