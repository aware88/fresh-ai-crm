import React from 'react';
import { UserIdentitySettings } from '@/components/settings/UserIdentitySettings';
import { UnifiedDataUploader } from '@/components/settings/UnifiedDataUploader';
import { LogoUploader } from '@/components/settings/LogoUploader';
import { FilesSection } from '@/components/settings/FilesSection';
import { FilesList } from '@/components/files/FilesList';
import { FileText, Mail } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 aris-text-gradient">Settings</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Company Branding</h2>
        <div className="grid gap-6 md:grid-cols-1">
          <LogoUploader />
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">User Information</h2>
        <div className="grid gap-6 md:grid-cols-1">
          <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md mr-3">
                <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              </div>
              <h2 className="text-xl font-semibold">User Identity</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Set your identity details to help the AI distinguish between your emails and customer emails in conversation threads.
              This helps the AI focus on analyzing only the customer's communication style.
            </p>
            <UserIdentitySettings />
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Data Management</h2>
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md mr-3">
              <svg className="h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            </div>
            <h2 className="text-xl font-semibold">Upload Data</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Upload and manage your data in various formats. The AI will use all available data sources when analyzing emails.
            Choose the format that works best for your needs.
          </p>
          <UnifiedDataUploader />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">Email Settings</h2>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md mr-3">
              <Mail className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Email Accounts</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Connect your email accounts to access emails, contacts, and calendar events.
            You can connect both Microsoft Outlook accounts and standard email accounts using IMAP/SMTP.
          </p>
          <Link 
            href="/settings/email-accounts"
            className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
          >
            Manage Email Accounts
          </Link>
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">File Management</h2>
        
        <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100/50 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center shadow-md mr-3">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <h2 className="text-xl font-semibold">Files</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Upload, organize, and manage your files for easy access and sharing
          </p>
          <div className="flex justify-between items-center mb-6">
            <FilesSection />
          </div>
          <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
            <FilesList showUploader={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
