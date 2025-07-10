import React from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import ImapAccountForm from './ImapAccountForm';

export default async function AddImapAccountPage() {
  const session = await getServerSession(authOptions);
  
  if (!session || !session.user?.id) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Add IMAP Email Account</h1>
      
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
        
        <ImapAccountForm userId={session.user.id} />
      </div>
    </div>
  );
}
