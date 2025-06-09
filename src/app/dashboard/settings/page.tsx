import React from 'react';
import { ProfileUploader } from '@/components/settings/ProfileUploader';
import { MockDataUploader } from '@/components/settings/MockDataUploader';
import { ExcelUploader } from '@/components/settings/ExcelUploader';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
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
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Personality Profile Data</h2>
        <p className="text-gray-600 mb-6">
          Upload personality profile data in various formats. The AI will use all available data sources when analyzing emails.
          Choose the format that works best for your needs.
        </p>
        
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">

        {/* Personality Profiles */}
        <div className="bg-white rounded-lg shadow p-6 h-full">
          <h2 className="text-xl font-semibold mb-4">Personality Profiles</h2>
          <p className="text-gray-600 mb-4">
            Upload a CSV file containing personality profiles for email analysis. 
            The AI will use these profiles to analyze customer emails and provide personalized response suggestions.
          </p>
          
          <ProfileUploader />
        </div>

        {/* Mock Personality Data */}
        <div className="bg-white rounded-lg shadow p-6 h-full">
          <h2 className="text-xl font-semibold mb-4">Mock Personality Data</h2>
          <p className="text-gray-600 mb-4">
            Upload additional mock personality data for testing and development. 
            The AI will use both the primary personality profiles and this mock data when analyzing emails.
          </p>
          
          <MockDataUploader />
        </div>
        
        {/* Excel Data */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Excel Data (Multiple Sheets)</h2>
            <p className="text-gray-600 mb-4">
              Upload Excel files with multiple sheets and custom column headers. 
              Perfect for organizations with existing personality profile data in their own format.
            </p>
            
            <ExcelUploader />
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
