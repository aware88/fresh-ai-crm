'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { EmailList } from './EmailList';
import EmailDetail from './EmailDetail';
import EmailCompose from './EmailCompose';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FaEnvelope, FaRobot, FaSync, FaTrash, FaArchive } from 'react-icons/fa';

interface OutlookClientProps {
  onAnalyzeEmail?: (emailId: string) => void;
  onSalesAgent?: (emailId: string) => void;
}

export default function OutlookClient({ onAnalyzeEmail, onSalesAgent }: OutlookClientProps) {
  const { data: session, status } = useSession();
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [view, setView] = useState<'list' | 'detail' | 'compose'>('list');
  const [emailData, setEmailData] = useState<any>(null); // Store the selected email data
  
  // Render early states without breaking hooks rules
  const isLoadingAuth = status === 'loading';
  const isUnauthenticated = status === 'unauthenticated' || !session;

  // Handle email selection
  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
    setView('detail');
  };

  // Handle back to list
  const handleBackToList = () => {
    setView('list');
    setSelectedEmailId(null);
    setEmailData(null);
  };

  // Handle compose new email
  const handleComposeNew = () => {
    setView('compose');
    setSelectedEmailId(null);
    setEmailData(null);
  };

  // Handle reply, reply all, forward
  const handleReply = () => {
    if (emailData) {
      setView('compose');
      // Pass the original email data for reply
    }
  };

  const handleReplyAll = () => {
    if (emailData) {
      setView('compose');
      // Pass the original email data for reply all
    }
  };

  const handleForward = () => {
    if (emailData) {
      setView('compose');
      // Pass the original email data for forward
    }
  };

  // Handle email deletion
  const handleDelete = async () => {
    if (!selectedEmailId) return;
    
    try {
      // Call API to delete email
      const response = await fetch(`/api/emails/${selectedEmailId}`, {
        method: 'DELETE',
        credentials: 'include', // Include cookies in the request
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        handleBackToList();
      }
    } catch (error) {
      console.error('Error deleting email:', error);
    }
  };

  // Handle AI analysis
  const handleAnalyze = () => {
    if (selectedEmailId && onAnalyzeEmail) {
      onAnalyzeEmail(selectedEmailId);
    }
  };

  // Handle AI sales agent
  const handleSalesAgent = () => {
    if (selectedEmailId && onSalesAgent) {
      onSalesAgent(selectedEmailId);
    }
  };

  // Update email data when an email is selected
  useEffect(() => {
    if (selectedEmailId && view === 'detail') {
      // Fetch email data
      const fetchEmailData = async () => {
        try {
          const response = await fetch(`/api/emails/${selectedEmailId}`, {
            credentials: 'include', // Include cookies in the request
            headers: {
              'Content-Type': 'application/json'
            }
          });
          if (response.ok) {
            const data = await response.json();
            setEmailData(data.data);
          }
        } catch (error) {
          console.error('Error fetching email data:', error);
        }
      };
      
      fetchEmailData();
    }
  }, [selectedEmailId, view]);

  return (
    <div className="outlook-client">
      <div className="flex justify-between items-center mb-4 p-4 bg-white shadow">
        <h1 className="text-xl font-bold flex items-center">
          <FaEnvelope className="mr-2" /> {view === 'list' ? 'Inbox' : view === 'detail' ? 'Email' : 'Compose'}
        </h1>
        <div className="space-x-2">
          {view === 'list' && (
            <Button onClick={handleComposeNew} variant="default" className="bg-blue-600 hover:bg-blue-700">
              New Email
            </Button>
          )}
          
          {view === 'detail' && (
            <div className="flex space-x-2">
              <Button onClick={handleReply} variant="outline" size="sm">
                Reply
              </Button>
              <Button onClick={handleReplyAll} variant="outline" size="sm">
                Reply All
              </Button>
              <Button onClick={handleForward} variant="outline" size="sm">
                Forward
              </Button>
              <Button onClick={handleDelete} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                <FaTrash className="mr-1" /> Delete
              </Button>
              <Button onClick={handleBackToList} variant="outline" size="sm">
                Back to Inbox
              </Button>
            </div>
          )}
          
          {view === 'compose' && (
            <Button onClick={handleBackToList} variant="outline" size="sm">
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="p-0">
        {isLoadingAuth && (
          <div className="flex justify-center p-8"><div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div></div>
        )}

        {isUnauthenticated && !isLoadingAuth && (
          <div className="p-8 text-center">
            <Alert variant="destructive">
              <p>You need to sign in to access your emails.</p>
            </Alert>
            <Button className="mt-4" onClick={() => window.location.href = '/api/auth/outlook/connect'}>
              Connect Outlook Account
            </Button>
          </div>
        )}

        {view === 'list' && (
          <div className="email-list-container">
            <EmailList onEmailSelect={handleEmailSelect} />
          </div>
        )}

        {view === 'detail' && selectedEmailId && (
          <div className="relative">
            <EmailDetail 
              messageId={selectedEmailId} 
              onReply={handleReply}
              onReplyAll={handleReplyAll}
              onForward={handleForward}
            />
            
            {/* AI Action Buttons */}
            <div className="fixed bottom-6 right-6 flex flex-col space-y-2">
              <Button 
                className="rounded-full w-12 h-12 flex items-center justify-center bg-blue-600 hover:bg-blue-700 shadow-lg"
                title="Re-analyze Email"
                onClick={handleAnalyze}
              >
                <FaSync className="h-5 w-5" />
              </Button>
              <Button 
                className="rounded-full w-12 h-12 flex items-center justify-center bg-green-600 hover:bg-green-700 shadow-lg"
                title="AI Sales Agent"
                onClick={handleSalesAgent}
              >
                <FaRobot className="h-5 w-5" />
              </Button>
            </div>
          </div>
        )}

        {view === 'compose' && (
          <div className="bg-white p-6 rounded shadow">
            <EmailCompose 
              mode="new" 
              originalEmail={emailData} 
              onClose={handleBackToList} 
              onSend={async () => {
                // Handle send email
                handleBackToList();
              }} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
