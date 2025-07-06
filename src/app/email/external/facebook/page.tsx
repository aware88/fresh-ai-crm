'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import FacebookInbox from '@/components/email/external/FacebookInbox';
import { Facebook, Settings, AlertCircle } from 'lucide-react';

export default function FacebookInboxPage() {
  const { data: session, status } = useSession();
  const [showSettings, setShowSettings] = useState(false);
  
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
          <p>Please sign in to access Facebook inbox.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Facebook className="h-6 w-6 mr-2 text-blue-600" />
          <h1 className="text-2xl font-bold">Facebook Inbox</h1>
        </div>
        
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </button>
      </div>
      
      {showSettings ? (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">Facebook Integration Settings</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Connected Page
              </label>
              <div className="flex items-center p-3 border rounded-md bg-gray-50">
                <Facebook className="h-5 w-5 mr-2 text-blue-600" />
                <span>Your Business Page</span>
                <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Auto-Response
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="auto-response"
                  className="h-4 w-4 text-blue-600 rounded"
                  defaultChecked
                />
                <label htmlFor="auto-response" className="ml-2 text-sm text-gray-700">
                  Enable automatic responses for new messages
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                When enabled, new messages will receive an automatic response informing customers that you'll get back to them soon.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notification Settings
              </label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    className="h-4 w-4 text-blue-600 rounded"
                    defaultChecked
                  />
                  <label htmlFor="email-notifications" className="ml-2 text-sm text-gray-700">
                    Email notifications for new messages
                  </label>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="browser-notifications"
                    className="h-4 w-4 text-blue-600 rounded"
                    defaultChecked
                  />
                  <label htmlFor="browser-notifications" className="ml-2 text-sm text-gray-700">
                    Browser notifications for new messages
                  </label>
                </div>
              </div>
            </div>
            
            <div className="pt-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Save Settings
              </button>
            </div>
          </div>
        </div>
      ) : null}
      
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-800">Facebook Inbox Integration</h3>
            <p className="text-sm text-blue-700 mt-1">
              This inbox allows you to manage Facebook Messenger conversations directly from your CRM.
              Messages are synced in real-time, and your responses will be sent to customers via Facebook Messenger.
            </p>
          </div>
        </div>
      </div>
      
      <FacebookInbox />
    </div>
  );
}
