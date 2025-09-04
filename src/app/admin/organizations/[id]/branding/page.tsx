'use client';

import { useParams } from 'next/navigation';
import { OrganizationBrandingForm } from '../components/OrganizationBrandingForm';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminLayout } from '@/components/layouts/AdminLayout';

export default function OrganizationBrandingPage() {
  const params = useParams();
  const organizationId = params?.id as string;
  
  if (!organizationId) {
    return (
      <AdminLayout>
        <AdminPageHeader
          title="Organization Branding"
          description="Customize the appearance of your organization's CRM instance"
        />
        <div className="container mx-auto py-6">
          <p>Organization ID not found.</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <AdminPageHeader
        title="Organization Branding"
        description="Customize the appearance of your organization's CRM instance"
      />
      <div className="container mx-auto py-6">
        <OrganizationBrandingForm organizationId={organizationId} />
      </div>
    </AdminLayout>
  );
}
