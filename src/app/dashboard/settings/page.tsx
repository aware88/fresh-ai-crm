import React from 'react';
import { ProfileUploader } from '@/components/settings/ProfileUploader';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        {/* User Identity Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Identity</h2>
          <p className="text-gray-600 mb-4">
            Set your identity details to help the AI distinguish between your emails and customer emails in conversation threads.
            This helps the AI focus on analyzing only the customer's communication style.
          </p>
          
          <UserIdentitySettings />
        </div>

        {/* Personality Profiles */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Personality Profiles</h2>
          <p className="text-gray-600 mb-4">
            Upload a CSV file containing personality profiles for email analysis. 
            The AI will use these profiles to analyze customer emails and provide personalized response suggestions.
          </p>
          
          <ProfileUploader />
        </div>
      </div>
    </div>
  );
}
