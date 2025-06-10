import React from 'react';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';
import { UnifiedDataUploader } from '@/components/settings/UnifiedDataUploader';
import { LogoUploader } from '@/components/settings/LogoUploader';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Company Branding</h2>
        <div className="grid gap-6 md:grid-cols-1">
          <LogoUploader />
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Information</h2>
        <div className="grid gap-6 md:grid-cols-1">
        {/* User Identity Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Identity</h2>
          <p className="text-gray-600 mb-4">
            Set your identity details to help the AI distinguish between your emails and customer emails in conversation threads.
            This helps the AI focus on analyzing only the customer's communication style.
          </p>
          
          <UserIdentitySettings />
        </div>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Data Management</h2>
        <p className="text-gray-600 mb-6">
          Upload and manage your data in various formats. The AI will use all available data sources when analyzing emails.
          Choose the format that works best for your needs.
        </p>
        
        <UnifiedDataUploader />
      </div>
    </div>
  );
}
