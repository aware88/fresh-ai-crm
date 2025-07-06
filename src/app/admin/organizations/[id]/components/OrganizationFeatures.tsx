import { useState } from 'react';
import { Organization } from '../page';

interface OrganizationFeaturesProps {
  organization: Organization;
  organizationId: string;
  setError: (error: string | null) => void;
  setOrganization: (org: Organization | null) => void;
}

export default function OrganizationFeatures({ 
  organization, 
  organizationId,
  setError,
  setOrganization 
}: OrganizationFeaturesProps) {
  // Feature flags that can be toggled
  const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>(
    organization.feature_flags || {
      'ai_assistant': false,
      'document_processing': false,
      'advanced_analytics': false,
      'metakocka_integration': false,
      'email_templates': false,
      'bulk_operations': false,
      'custom_fields': false,
      'api_access': false
    }
  );
  const [isSavingFlags, setIsSavingFlags] = useState(false);

  // Handle feature flag toggle
  const handleFeatureFlagToggle = (flagName: string) => {
    setFeatureFlags(prev => ({
      ...prev,
      [flagName]: !prev[flagName]
    }));
  };

  // Save feature flags
  const saveFeatureFlags = async () => {
    setIsSavingFlags(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/features`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ feature_flags: featureFlags }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update feature flags');
      }

      // Update organization state
      setOrganization({
        ...organization,
        feature_flags: featureFlags
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSavingFlags(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Feature Flags</h3>
        <p className="mt-1 text-sm text-gray-500">
          Enable or disable features for this organization.
        </p>
      </div>

      <div className="space-y-4">
        {/* Feature flag toggles */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {Object.entries({
              'ai_assistant': 'AI Assistant',
              'document_processing': 'Document Processing',
              'advanced_analytics': 'Advanced Analytics',
              'metakocka_integration': 'Metakocka Integration',
              'email_templates': 'Email Templates',
              'bulk_operations': 'Bulk Operations',
              'custom_fields': 'Custom Fields',
              'api_access': 'API Access'
            }).map(([key, label]) => (
              <li key={key}>
                <div className="px-4 py-4 flex items-center justify-between sm:px-6">
                  <div className="flex items-center">
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{label}</p>
                      <p className="text-sm text-gray-500">{`Feature key: ${key}`}</p>
                    </div>
                  </div>
                  <div className="ml-4 flex-shrink-0">
                    <button
                      type="button"
                      className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${featureFlags[key] ? 'bg-blue-600' : 'bg-gray-200'}`}
                      onClick={() => handleFeatureFlagToggle(key)}
                    >
                      <span className="sr-only">Toggle {label}</span>
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${featureFlags[key] ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={saveFeatureFlags}
            disabled={isSavingFlags}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSavingFlags ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSavingFlags ? 'Saving...' : 'Save Feature Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
