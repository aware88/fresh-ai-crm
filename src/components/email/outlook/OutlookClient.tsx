'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import EmailList from './EmailList';
import EmailDetail from './EmailDetail';
import { Alert, Button } from '@/components/ui';

export default function OutlookClient() {
  const { data: session, status } = useSession();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'compose'>('list');
  
  // Handle authentication state
  if (status === 'loading') {
    return <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>;
  }
  
  if (status === 'unauthenticated' || !session) {
    return (
      <div className="p-8 text-center">
        <Alert type="warning">
          <p>You need to sign in with Microsoft to access your emails.</p>
        </Alert>
        <Button className="mt-4" onClick={() => window.location.href = '/api/auth/signin/microsoft'}>
          Sign in with Microsoft
        </Button>
      </div>
    );
  }

  // Handle email selection
  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
    setView('detail');
  };

  // Handle back to list
  const handleBackToList = () => {
    setView('list');
    setSelectedEmailId(null);
  };

  // Handle compose new email
  const handleComposeNew = () => {
    setView('compose');
    setSelectedEmailId(null);
  };

  // Handle reply, reply all, forward
  const handleReply = () => {
    // Implement reply functionality
    console.log('Reply to email:', selectedEmailId);
  };

  const handleReplyAll = () => {
    // Implement reply all functionality
    console.log('Reply all to email:', selectedEmailId);
  };

  const handleForward = () => {
    // Implement forward functionality
    console.log('Forward email:', selectedEmailId);
  };

  return (
    <div className="outlook-client">
      <div className="flex justify-between items-center mb-4 p-4 bg-white shadow">
        <h1 className="text-2xl font-bold">Outlook</h1>
        <div className="space-x-2">
          <Button onClick={handleComposeNew} variant="primary">
            New Email
          </Button>
          {view === 'detail' && (
            <Button onClick={handleBackToList} variant="outline">
              Back to Inbox
            </Button>
          )}
        </div>
      </div>

      <div className="p-4">
        {view === 'list' && (
          <EmailList onEmailSelect={handleEmailSelect} />
        )}

        {view === 'detail' && selectedEmailId && (
          <EmailDetail 
            messageId={selectedEmailId} 
            onReply={handleReply}
            onReplyAll={handleReplyAll}
            onForward={handleForward}
          />
        )}

        {view === 'compose' && (
          <div className="bg-white p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Compose New Email</h2>
            <p className="text-gray-500">Email composition form will be implemented here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
