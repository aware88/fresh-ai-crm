import { Metadata } from 'next';
import CustomerInfoDemo from '@/components/email/CustomerInfoDemo';

export const metadata: Metadata = {
  title: 'Customer Info Widget Demo - ARIS',
  description: 'Demo of Metakocka customer information integration in email interface',
};

export default function CustomerInfoDemoPage() {
  return (
    <div className="container mx-auto py-6">
      <CustomerInfoDemo />
    </div>
  );
}