'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import EmailNotes from '../EmailNotes';
import EmailAttachments from './EmailAttachments';
import EmailLanguageDetection from './EmailLanguageDetection';
import AIDraftWindow from '../AIDraftWindow';

interface EmailDetailProps {
  messageId: string;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
}

interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
}

interface EmailAddress {
  name?: string;
  address: string;
}

interface EmailRecipient {
  emailAddress: EmailAddress;
}

interface EmailBody {
  contentType: string;
  content: string;
}

interface Email {
  id: string;
  subject: string;
  body: EmailBody;
  receivedDateTime: string;
  from: {
    emailAddress: EmailAddress;
  };
  toRecipients: EmailRecipient[];
  ccRecipients?: EmailRecipient[];
  bccRecipients?: EmailRecipient[];
  hasAttachments: boolean;
  attachments?: EmailAttachment[];
  isRead: boolean;
  importance: 'normal' | 'high' | 'low';
}

export default function EmailDetail({ messageId, onReply, onReplyAll, onForward }: EmailDetailProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [showAIDraft, setShowAIDraft] = useState(false);

  // Load AI settings on mount
  useEffect(() => {
    const loadAISettings = () => {
      const savedSettings = localStorage.getItem('aris-ai-email-settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setAiSettings(parsed);
          setShowAIDraft(parsed.aiDraftEnabled || false);
        } catch (error) {
          console.warn('Failed to parse AI settings');
        }
      }
    };
    
    loadAISettings();
  }, []);

  useEffect(() => {
    async function fetchEmail() {
      if (!session?.accessToken || !messageId) {
        setError('Not authenticated or missing message ID');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch(`/api/emails/${messageId}`, {
          credentials: 'include', // Include cookies in the request
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching email: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEmail(data.data);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch email:', err);
        setError(err.message || 'Failed to load email. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEmail();
  }, [session, messageId]);

  // Handle AI draft functions
  const handleSendDraft = async (draftData: {
    subject: string;
    body: string;
    changes: any[];
    userNotes?: string;
  }) => {
    try {
      // This would typically call an API to send the email
      console.log('Sending draft:', draftData);
      // For now, just show the compose window with the draft
      // In a real implementation, this would send the email
      alert('Draft sent successfully!');
    } catch (error) {
      console.error('Error sending draft:', error);
      throw error;
    }
  };

  const handleRegenerateDraft = async () => {
    try {
      // This would trigger a new AI draft generation
      console.log('Regenerating draft...');
    } catch (error) {
      console.error('Error regenerating draft:', error);
      throw error;
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant="destructive">{error}</Alert>;
  if (!email) return <Alert>Email not found</Alert>;

  const layoutClass = aiSettings?.aiDraftPosition === 'sidebar' && showAIDraft 
    ? 'flex gap-6' 
    : 'block';

  return (
    <div className={`email-detail-container ${layoutClass}`}>
      <div className={`email-detail bg-white rounded-lg shadow p-6 ${showAIDraft && aiSettings?.aiDraftPosition === 'sidebar' ? 'flex-1' : ''}`}>
        <div className="email-header border-b pb-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold mb-2">{email.subject}</h2>
            {aiSettings?.aiDraftEnabled && (
              <Button
                onClick={() => setShowAIDraft(!showAIDraft)}
                variant="outline"
                size="sm"
                className="ml-4"
              >
                {showAIDraft ? 'Hide AI Draft' : 'Show AI Draft'}
              </Button>
            )}
          </div>
          <div className="email-meta text-sm space-y-1">
            <div className="flex">
              <span className="w-16 font-medium">From:</span>
              <span>
                {email.from.emailAddress.name ? (
                  <>{email.from.emailAddress.name} &lt;{email.from.emailAddress.address}&gt;</>
                ) : (
                  email.from.emailAddress.address
                )}
              </span>
            </div>
            
            <div className="flex">
              <span className="w-16 font-medium">To:</span>
              <span>
                {email.toRecipients.map((r, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    {r.emailAddress.name ? (
                      <>{r.emailAddress.name} &lt;{r.emailAddress.address}&gt;</>
                    ) : (
                      r.emailAddress.address
                    )}
                  </span>
                ))}
              </span>
            </div>
            
            {email.ccRecipients && email.ccRecipients.length > 0 && (
              <div className="flex">
                <span className="w-16 font-medium">CC:</span>
                <span>
                  {email.ccRecipients.map((r, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      {r.emailAddress.name ? (
                        <>{r.emailAddress.name} &lt;{r.emailAddress.address}&gt;</>
                      ) : (
                        r.emailAddress.address
                      )}
                    </span>
                  ))}
                </span>
              </div>
            )}
            
            <div className="flex">
              <span className="w-16 font-medium">Date:</span>
              <span>{new Date(email.receivedDateTime).toLocaleString()}</span>
            </div>
          </div>
        </div>
        
        <div className="email-content max-w-none mb-6">
          <div 
            className="text-sm text-gray-800 leading-relaxed break-words overflow-hidden"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
              lineHeight: '1.6',
              wordWrap: 'break-word'
            }}
            dangerouslySetInnerHTML={{ __html: email.body.content }} 
          />
        </div>
        
        {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
          <div className="email-attachments border-t pt-4 mb-4">
            <EmailAttachments 
              attachments={email.attachments.map(att => ({
                id: att.id,
                name: att.name,
                contentType: att.contentType,
                size: att.size,
                url: att.contentBytes ? `data:${att.contentType};base64,${att.contentBytes}` : undefined
              }))}
              messageId={email.id}
              readOnly={true}
            />
          </div>
        )}
        
        <div className="email-meta-info flex items-center justify-between py-3 border-t">
          <EmailLanguageDetection content={email.body.content} />
          <div className="email-importance">
            {email.importance !== 'normal' && (
              <span className={`px-2 py-1 text-xs rounded ${email.importance === 'high' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                {email.importance === 'high' ? 'High' : 'Low'} importance
              </span>
            )}
          </div>
        </div>
        
        <div className="email-actions flex space-x-3 pt-4 border-t">
          <Button onClick={onReply} variant="outline">
            Reply
          </Button>
          <Button onClick={onReplyAll} variant="outline">
            Reply All
          </Button>
          <Button onClick={onForward} variant="outline">
            Forward
          </Button>
        </div>
        
        {/* Comments section */}
        <EmailNotes emailId={email.id} emailSubject={email.subject} emailFrom={email.from.emailAddress.address} />
      </div>

      {/* AI Draft Window */}
      {showAIDraft && aiSettings?.aiDraftEnabled && (
        <div className={`ai-draft-section ${
          aiSettings?.aiDraftPosition === 'sidebar' 
            ? 'flex-shrink-0 w-96' 
            : 'mt-6'
        }`}>
          <AIDraftWindow
            emailId={email.id}
            originalEmail={{
              subject: email.subject,
              body: email.body.content,
              from: email.from.emailAddress.address,
              to: email.toRecipients.map(r => r.emailAddress.address).join(', ')
            }}
            onSendDraft={handleSendDraft}
            onRegenerateDraft={handleRegenerateDraft}
            className="h-fit"
            position={aiSettings?.aiDraftPosition || 'sidebar'}
          />
        </div>
      )}
    </div>
  );
}
