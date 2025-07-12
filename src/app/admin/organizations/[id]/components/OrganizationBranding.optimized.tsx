import { useState, useEffect } from 'react';
import { Organization } from '../page';
import { BrandingFormData, defaultBrandingFormData } from '@/types/branding';
import Image from 'next/image';

interface OrganizationBrandingProps {
  organization: Organization;
  organizationId: string;
  setError: (error: string | null) => void;
  setOrganization: (org: Organization | null) => void;
}

export default function OrganizationBranding({ 
  organization, 
  organizationId,
  setError,
  setOrganization 
}: OrganizationBrandingProps) {
  // Branding settings
  const [branding, setBranding] = useState<BrandingFormData>(defaultBrandingFormData);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBranding, setIsSavingBranding] = useState(false);
  // State to handle image errors
  const [logoError, setLogoError] = useState(false);
  const [emailHeaderError, setEmailHeaderError] = useState(false);
  const [loginBackgroundError, setLoginBackgroundError] = useState(false);

  // Fetch branding settings when component mounts
  useEffect(() => {
    const fetchBranding = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/admin/organizations/${organizationId}/branding`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch branding');
        }
        
        const data = await response.json();
        if (data.branding) {
          setBranding(data.branding);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching branding');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBranding();
  }, [organizationId, setError]);

  // Save branding settings
  const saveBranding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingBranding(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/branding`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(branding),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update branding');
      }
      
      const data = await response.json();
      
      // Show success message
      setError(null);
      alert('Branding settings saved successfully!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSavingBranding(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900">Branding Settings</h3>
        <p className="mt-1 text-sm text-gray-500">
          Customize the look and feel of the organization's instance.
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
      <form onSubmit={saveBranding} className="space-y-6">
        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-gray-700">
            Logo URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="logo_url"
              value={branding.logo_url}
              onChange={(e) => {
                setBranding({ ...branding, logo_url: e.target.value });
                setLogoError(false); // Reset error state when URL changes
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          {branding.logo_url && !logoError && (
            <div className="mt-2">
              <Image
                src={branding.logo_url}
                alt="Organization Logo"
                width={120}
                height={48}
                className="h-12 w-auto object-contain"
                onError={() => setLogoError(true)}
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="primary_color" className="block text-sm font-medium text-gray-700">
              Primary Color
            </label>
            <div className="mt-1">
              <input
                type="color"
                id="primary_color"
                value={branding.primary_color || '#000000'}
                onChange={(e) => setBranding({ ...branding, primary_color: e.target.value })}
                className="h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="secondary_color" className="block text-sm font-medium text-gray-700">
              Secondary Color
            </label>
            <div className="mt-1">
              <input
                type="color"
                id="secondary_color"
                value={branding.secondary_color || '#ffffff'}
                onChange={(e) => setBranding({ ...branding, secondary_color: e.target.value })}
                className="h-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="font_family" className="block text-sm font-medium text-gray-700">
            Font Family
          </label>
          <div className="mt-1">
            <select
              id="font_family"
              value={branding.font_family || ''}
              onChange={(e) => setBranding({ ...branding, font_family: e.target.value })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Default</option>
              <option value="'Inter', sans-serif">Inter</option>
              <option value="'Roboto', sans-serif">Roboto</option>
              <option value="'Open Sans', sans-serif">Open Sans</option>
              <option value="'Montserrat', sans-serif">Montserrat</option>
              <option value="'Lato', sans-serif">Lato</option>
            </select>
          </div>
        </div>
        
        <div>
          <label htmlFor="email_header_image_url" className="block text-sm font-medium text-gray-700">
            Email Header Image URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="email_header_image_url"
              value={branding.email_header_image_url || ''}
              onChange={(e) => {
                setBranding({ ...branding, email_header_image_url: e.target.value });
                setEmailHeaderError(false); // Reset error state when URL changes
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          {branding.email_header_image_url && !emailHeaderError && (
            <div className="mt-2">
              <Image
                src={branding.email_header_image_url}
                alt="Email Header"
                width={320}
                height={64}
                className="h-16 w-auto object-contain"
                onError={() => setEmailHeaderError(true)}
              />
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="email_footer_text" className="block text-sm font-medium text-gray-700">
            Email Footer Text
          </label>
          <div className="mt-1">
            <textarea
              id="email_footer_text"
              value={branding.email_footer_text || ''}
              onChange={(e) => setBranding({ ...branding, email_footer_text: e.target.value })}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="login_background_url" className="block text-sm font-medium text-gray-700">
            Login Background Image URL
          </label>
          <div className="mt-1">
            <input
              type="text"
              id="login_background_url"
              value={branding.login_background_url || ''}
              onChange={(e) => {
                setBranding({ ...branding, login_background_url: e.target.value });
                setLoginBackgroundError(false); // Reset error state when URL changes
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          {branding.login_background_url && !loginBackgroundError && (
            <div className="mt-2">
              <Image
                src={branding.login_background_url}
                alt="Login Background"
                width={480}
                height={96}
                className="h-24 w-auto object-cover rounded"
                onError={() => setLoginBackgroundError(true)}
              />
            </div>
          )}
        </div>
        
        <div>
          <label htmlFor="custom_css" className="block text-sm font-medium text-gray-700">
            Custom CSS
          </label>
          <div className="mt-1">
            <textarea
              id="custom_css"
              value={branding.custom_css || ''}
              onChange={(e) => setBranding({ ...branding, custom_css: e.target.value })}
              rows={5}
              placeholder="/* Add custom CSS here */"
              className="block w-full font-mono rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">
            Add custom CSS to further customize the appearance of the application.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSavingBranding}
            className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${isSavingBranding ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isSavingBranding ? 'Saving...' : 'Save Branding Settings'}
          </button>
        </div>
      </form>
      )}
    </div>
  );
}
