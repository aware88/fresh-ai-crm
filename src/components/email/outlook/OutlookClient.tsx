'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { EmailList } from './EmailList';
import EmailDetail from './EmailDetail';
import EmailCompose from './EmailCompose';
import AIDraftWindow from '../AIDraftWindow';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { FaEnvelope, FaRobot, FaSync, FaTrash, FaArchive } from 'react-icons/fa';
import { EmailViewProvider, useEmailView } from '@/contexts/EmailViewContext';
import { motion, AnimatePresence } from 'framer-motion';

interface OutlookClientProps {
  folder?: string;
  onAnalyzeEmail?: (emailId: string) => void;
  onSalesAgent?: (emailId: string) => void;
}

function OutlookClientContent({ folder = 'inbox', onAnalyzeEmail, onSalesAgent }: OutlookClientProps) {
  const { data: session, status } = useSession();
  const {
    viewMode,
    replyMode,
    selectedEmailId,
    emailData,
    showDraftWindow,
    isGeneratingDraft,
    setSelectedEmailId,
    setEmailData,
    setViewMode,
    startReply,
    closeDraftWindow,
    backToList
  } = useEmailView();
  
  // Render early states without breaking hooks rules
  const isLoadingAuth = status === 'loading';
  const isUnauthenticated = status === 'unauthenticated' || !session;

  // Handle email selection
  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
    setViewMode('detail');
  };

  // Handle reply, reply all, forward
  const handleReply = () => {
    if (emailData && selectedEmailId) {
      startReply(selectedEmailId, emailData, 'reply');
    }
  };

  const handleReplyAll = () => {
    if (emailData && selectedEmailId) {
      startReply(selectedEmailId, emailData, 'replyAll');
    }
  };

  const handleForward = () => {
    if (emailData && selectedEmailId) {
      startReply(selectedEmailId, emailData, 'forward');
    }
  };

  // Handle compose new email
  const handleComposeNew = () => {
    setViewMode('split-compose');
    setSelectedEmailId(null);
    setEmailData(null);
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
        backToList();
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
    if (selectedEmailId && (viewMode === 'detail' || viewMode === 'split-reply')) {
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
  }, [selectedEmailId, viewMode]);

  return (
    <div className="outlook-client h-full flex flex-col">
      <div className="flex justify-between items-center mb-4 p-4 bg-white shadow flex-shrink-0">
        <h1 className="text-xl font-bold flex items-center">
          <FaEnvelope className="mr-2" /> 
          {viewMode === 'list' ? 'Inbox' : 
           viewMode === 'detail' ? 'Email' : 
           viewMode === 'split-reply' ? 'Email & Reply' : 
           'Compose'}
        </h1>
        <div className="space-x-2">
          {viewMode === 'list' && (
            <Button onClick={handleComposeNew} variant="default" className="bg-blue-600 hover:bg-blue-700">
              New Email
            </Button>
          )}
          
          {(viewMode === 'detail' || viewMode === 'split-reply') && (
            <div className="flex space-x-2">
              {viewMode === 'detail' && (
                <>
                  <Button onClick={handleReply} variant="outline" size="sm">
                    Reply
                  </Button>
                  <Button onClick={handleReplyAll} variant="outline" size="sm">
                    Reply All
                  </Button>
                  <Button onClick={handleForward} variant="outline" size="sm">
                    Forward
                  </Button>
                </>
              )}
              {viewMode === 'split-reply' && (
                <Button onClick={closeDraftWindow} variant="outline" size="sm">
                  Close Reply
                </Button>
              )}
              <Button onClick={handleDelete} variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                <FaTrash className="mr-1" /> Delete
              </Button>
              <Button onClick={backToList} variant="outline" size="sm">
                Back to Inbox
              </Button>
            </div>
          )}
          
          {viewMode === 'split-compose' && (
            <Button onClick={backToList} variant="outline" size="sm">
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
      </div>

      <div className="flex-1 min-h-0">
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="email-list-container h-full"
            >
              <EmailList onEmailSelect={handleEmailSelect} />
            </motion.div>
          )}

          {viewMode === 'detail' && selectedEmailId && (
            <motion.div
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="relative"
            >
              <EmailDetail 
                messageId={selectedEmailId} 
                onReply={handleReply}
                onReplyAll={handleReplyAll}
                onForward={handleForward}
                onAnalyze={handleAnalyze}
                onSalesAgent={handleSalesAgent}
              />
            </motion.div>
          )}

          {viewMode === 'split-reply' && selectedEmailId && (
            <motion.div
              key="split-reply"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex flex-col h-full"
            >
              {/* Email Body - Top Half */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="flex-1 min-h-0 mb-2"
              >
                <EmailDetail 
                  messageId={selectedEmailId} 
                  onReply={handleReply}
                  onReplyAll={handleReplyAll}
                  onForward={handleForward}
                  compactMode={true}
                />
              </motion.div>
              
              {/* Draft Window - Bottom Half */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="flex-1 min-h-0"
              >
                {emailData && (
                  <AIDraftWindow
                    emailId={selectedEmailId}
                    originalEmail={{
                      subject: emailData.subject,
                      body: emailData.body?.content || emailData.body,
                      from: emailData.from?.emailAddress?.address || emailData.from,
                      to: emailData.toRecipients?.map((r: any) => r.emailAddress?.address || r).join(', ') || ''
                    }}
                    onSendDraft={async (draftData) => {
                      // Handle sending the draft
                      console.log('Sending draft:', draftData);
                      closeDraftWindow();
                    }}
                    onRegenerateDraft={async () => {
                      // Handle regenerating draft
                      console.log('Regenerating draft...');
                    }}
                    className="h-full"
                    position="bottom"
                  />
                )}
              </motion.div>
            </motion.div>
          )}

          {viewMode === 'split-compose' && (
            <motion.div
              key="split-compose"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-white p-6 rounded shadow h-full"
            >
              <EmailCompose 
                mode="new" 
                originalEmail={null} 
                onClose={backToList} 
                onSend={async () => {
                  // Handle send email
                  backToList();
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function OutlookClient({ folder, onAnalyzeEmail, onSalesAgent }: OutlookClientProps) {
  return (
    <EmailViewProvider>
      <OutlookClientContent folder={folder} onAnalyzeEmail={onAnalyzeEmail} onSalesAgent={onSalesAgent} />
    </EmailViewProvider>
  );
}
