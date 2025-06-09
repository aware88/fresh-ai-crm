import React from 'react';
import { ProfileUploader } from '@/components/settings/ProfileUploader';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="grid gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Personality Profiles</h2>
          <p className="text-gray-600 mb-4">
            Upload a CSV file containing personality profiles for email analysis. 
            The CSV should have the following columns: trait, description, communicationApproach, doEmphasis, dontEmphasis.
          </p>
          
          <ProfileUploader />
        </div>
      </div>
    </div>
  );
}
