'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailCountryFilter from '@/components/email/outlook/EmailCountryFilter';
import EmailStatusMapping from '@/components/email/outlook/EmailStatusMapping';
import EmailPromptRulesEditor from '@/components/email/outlook/EmailPromptRulesEditor';
import { Settings, Globe, Tag, Wand2 } from 'lucide-react';

export default function EmailOrganizationPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState('status');
  
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  if (status === 'unauthenticated') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-red-50 text-red-700 p-4 rounded-lg max-w-md text-center">
          <h2 className="text-lg font-medium mb-2">Authentication Required</h2>
          <p>Please sign in to access email organization settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center mb-6">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold">Email Organization Settings</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-8">
          <TabsTrigger value="status" className="flex items-center">
            <Tag className="h-4 w-4 mr-2" />
            Status Mapping
          </TabsTrigger>
          <TabsTrigger value="country" className="flex items-center">
            <Globe className="h-4 w-4 mr-2" />
            Country Filters
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center">
            <Wand2 className="h-4 w-4 mr-2" />
            Prompt Rules
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="status" className="bg-white p-6 rounded-lg shadow">
          <EmailStatusMapping />
        </TabsContent>
        
        <TabsContent value="country" className="bg-white p-6 rounded-lg shadow">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Country Filters</h2>
            <p className="text-gray-600">
              Configure country-based filters to organize your emails by sender location.
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Active Filters</h3>
            <EmailCountryFilter 
              onFilterChange={(countries) => {
                console.log('Countries selected:', countries);
                // In a real implementation, this would save the filters to the user's settings
              }}
            />
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800 mb-2">How Country Filters Work</h3>
            <p className="text-sm text-blue-700">
              Country filters analyze email headers and content to determine the sender's location.
              When a country is detected, emails will be automatically tagged and can be filtered accordingly.
              This helps organize international correspondence and prioritize emails based on region.
            </p>
          </div>
        </TabsContent>
        
        <TabsContent value="prompts" className="bg-white p-6 rounded-lg shadow">
          <EmailPromptRulesEditor />
        </TabsContent>
      </Tabs>
    </div>
  );
}
