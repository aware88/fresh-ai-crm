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
import EmailRenderer from '../EmailRenderer';
import { Phase2Insights } from '@/components/email/AnalysisResultsModal';
import CustomerInfoWidget from '../CustomerInfoWidget';
import CustomerSidebar from '../CustomerSidebar';
import EnhancedEmailViewer from '../EnhancedEmailViewer';
import { Reply, ReplyAll, Forward, Brain, Zap } from 'lucide-react';

interface EmailDetailProps {
  messageId: string;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onAnalyze?: () => void;
  onSalesAgent?: () => void;
  compactMode?: boolean;
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

export default function EmailDetail({ messageId, onReply, onReplyAll, onForward, onAnalyze, onSalesAgent, compactMode = false }: EmailDetailProps) {
  const { data: session } = useSession();
  const [email, setEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [showAIDraft, setShowAIDraft] = useState(false);
  const [phase2, setPhase2] = useState<any>(null);
  const [showCustomerSidebar, setShowCustomerSidebar] = useState(false);
  const [useEnhancedViewer, setUseEnhancedViewer] = useState(false);

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

  useEffect(() => {
    async function loadPhase2() {
      try {
        const res = await fetch(`/api/emails/phase2/${messageId}`);
        if (res.ok) {
          const data = await res.json();
          setPhase2(data.phase2 || null);
        }
      } catch (e) {
        // no-op
      }
    }
    if (messageId) loadPhase2();
  }, [messageId]);

  // Handle AI draft functions
  const handleSendDraft = async (draftData: {
    subject: string;
    body: string;
    changes: any[];
    userNotes?: string;
    attachments?: { name: string; contentType: string; contentBytes: string }[];
  }) => {
    try {
      const toRecipients = email?.toRecipients?.map(r => r.emailAddress.address) || [];
      const payload: any = {
        subject: draftData.subject || email?.subject || '',
        contentType: 'HTML',
        content: draftData.body,
        toRecipients,
      };
      if (draftData.attachments && draftData.attachments.length > 0) {
        payload.attachments = draftData.attachments;
      }

      const resp = await fetch('/api/emails/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || resp.statusText);
      }
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

  // Use enhanced viewer if enabled
  if (useEnhancedViewer && email) {
    return (
      <div className={`flex flex-col ${compactMode ? 'gap-2 h-full' : 'gap-4'}`}>
        <div className="flex items-center justify-between mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setUseEnhancedViewer(false)}
          >
            ← Back to Classic View
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomerSidebar(true)}
          >
            Customer Info
          </Button>
        </div>
        
        <EnhancedEmailViewer
          email={email}
          onReply={onReply}
          onReplyAll={onReplyAll}
          onForward={onForward}
          compactMode={compactMode}
        />
        
        <CustomerSidebar
          customerEmail={email.from.emailAddress.address}
          isOpen={showCustomerSidebar}
          onClose={() => setShowCustomerSidebar(false)}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${compactMode ? 'gap-2 h-full' : 'gap-4'}`}>
      <div className={`email-detail bg-white rounded-lg shadow ${compactMode ? 'p-4 h-full overflow-hidden flex flex-col' : 'p-6'} ${showAIDraft && aiSettings?.aiDraftPosition === 'sidebar' ? 'flex-1' : ''}`}>
        <div className={`email-header border-b ${compactMode ? 'pb-2 mb-2' : 'pb-4 mb-4'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`font-semibold ${compactMode ? 'text-lg mb-1' : 'text-2xl mb-2'}`}>{email.subject}</h2>
            <div className="flex items-center space-x-2">
              {/* Reply Actions */}
              <Button onClick={onReply} variant="outline" size="sm">
                <Reply className="h-3 w-3 mr-1" />
                Reply
              </Button>
              <Button onClick={onReplyAll} variant="outline" size="sm">
                <ReplyAll className="h-3 w-3 mr-1" />
                Reply All
              </Button>
              <Button onClick={onForward} variant="outline" size="sm">
                <Forward className="h-3 w-3 mr-1" />
                Forward
              </Button>
              
              {/* AI Actions */}
              {onAnalyze && (
                <Button 
                  onClick={onAnalyze}
                  variant="outline" 
                  size="sm"
                  className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                >
                  <Brain className="h-3 w-3 mr-1" />
                  AI Analysis
                </Button>
              )}
              {onSalesAgent && (
                <Button 
                  onClick={onSalesAgent}
                  variant="outline" 
                  size="sm"
                  className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  AI Analysis & Draft
                </Button>
              )}
              
              {aiSettings?.aiDraftEnabled && !compactMode && (
                <Button
                  onClick={() => setShowAIDraft(!showAIDraft)}
                  variant="outline"
                  size="sm"
                >
                  {showAIDraft ? 'Hide AI Draft' : 'Show AI Draft'}
                </Button>
              )}
              <Button
                onClick={() => setUseEnhancedViewer(true)}
                variant="outline"
                size="sm"
                className="text-blue-600"
              >
                Enhanced View
              </Button>
            </div>
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
          
          {/* Customer Info Widget */}
          <div className="mt-3 flex items-center justify-between">
            <CustomerInfoWidget 
              customerEmail={email.from.emailAddress.address}
              className="max-w-md flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCustomerSidebar(true)}
              className="ml-3 text-xs"
            >
              More Info
            </Button>
          </div>
        </div>
        
        <div className={`email-content max-w-none ${compactMode ? 'mb-2 flex-1 overflow-y-auto' : 'mb-6'}`}>
          <EmailRenderer 
            content={email.body.content}
            className="text-sm text-gray-800"
          />
        </div>
        
        {email.hasAttachments && email.attachments && email.attachments.length > 0 && !compactMode && (
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
        
        {!compactMode && (
          <>
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
          </>
        )}
      </div>

      {!compactMode && (
        <>
          {/* Phase 2 Insights */}
          <Phase2Insights phase2={phase2} />

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
        </>
      )}

      {/* Customer Sidebar */}
      <CustomerSidebar
        customerEmail={email.from.emailAddress.address}
        isOpen={showCustomerSidebar}
        onClose={() => setShowCustomerSidebar(false)}
      />
    </div>
  );
}
