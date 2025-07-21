'use client';

import React, { useEffect } from 'react';
import { useOptimizedAuth } from '@/hooks/useOptimizedAuth';
import { useRouter } from 'next/navigation';
import ImapAccountForm from './ImapAccountForm';

export default function AddImapAccountPage() {
  const { data: session, status } = useOptimizedAuth();
  const router = useRouter();
  
  useEffect(() => {
    // If not authenticated, redirect to sign in
    if (status === 'unauthenticated') {
      router.push('/signin');
    }
  }, [status, router]);

  // Show loading state while session is being fetched
  if (status === 'loading') {
    return (
      <div className="container mx-auto p-6 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
      </div>
    );
  }
  
  // Only render the form if we have a valid session
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add IMAP Email Account</h1>
      {session?.user?.id ? (
        <>
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <p className="mb-4">
              Configure your IMAP email account to connect it to Fresh AI CRM. 
              This will allow the system to access your emails for processing and analysis.
            </p>
            <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 mb-6">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> You may need to enable IMAP access in your email provider's settings and possibly generate an app-specific password.
                Check your email provider's documentation for details.
              </p>
            </div>
          </div>
          
          <ImapAccountForm userId={session.user.id} />
        </>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-yellow-700">Please sign in to add an email account.</p>
        </div>
      )}
    </div>
  );
}
