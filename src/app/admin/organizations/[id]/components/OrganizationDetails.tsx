import { Organization } from '../page';

interface OrganizationDetailsProps {
  organization: Organization;
}

export default function OrganizationDetails({ organization }: OrganizationDetailsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Organization Details</h3>
        <div className="mt-5 border-t border-gray-200">
          <dl className="divide-y divide-gray-200">
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="text-sm text-gray-900 col-span-2">{organization.name}</dd>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Slug</dt>
              <dd className="text-sm text-gray-900 col-span-2">{organization.slug}</dd>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Created</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {organization.created_at ? new Date(organization.created_at).toLocaleString() : 'N/A'}
              </dd>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {organization.updated_at ? new Date(organization.updated_at).toLocaleString() : 'N/A'}
              </dd>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Users</dt>
              <dd className="text-sm text-gray-900 col-span-2">{organization.user_count || 0}</dd>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Custom Domain</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {organization.branding?.custom_domain || 'Not configured'}
              </dd>
            </div>
            <div className="py-4 grid grid-cols-3 gap-4">
              <dt className="text-sm font-medium text-gray-500">Subscription</dt>
              <dd className="text-sm text-gray-900 col-span-2">
                {organization.subscription ? (
                  <span>
                    {organization.subscription.plan_name} ({organization.subscription.status})
                  </span>
                ) : (
                  'No active subscription'
                )}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
