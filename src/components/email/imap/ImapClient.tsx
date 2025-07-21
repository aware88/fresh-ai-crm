import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaInbox, FaEnvelope, FaUser, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { parseEmailContent, generateEmailPreview } from '@/lib/email/email-content-parser';
import CustomerInfoWidget from '../CustomerInfoWidget';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  folder: string;
  attachments: any[];
}

interface ImapClientProps {
  account: any;
  onSalesAgent: (emailId: string, emailData?: any) => void;
  isSalesProcessing: boolean;
}

export default function ImapClient({ account, onSalesAgent, isSalesProcessing }: ImapClientProps) {
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [readEmails, setReadEmails] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreEmails, setHasMoreEmails] = useState(true);

  // Load emails function
  const loadEmails = async () => {
    if (!session?.user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading emails from API...', { accountType: account?.provider_type, accountId: account?.id });
      
      // Use the correct API based on account type
      if (account?.provider_type === 'google') {
        // Use Gmail API for Google accounts
        try {
          const response = await fetch('/api/email/gmail-simple');
          const data = await response.json();

          if (response.ok && data.success && data.emails) {
            console.log(`Successfully loaded ${data.count || 0} emails from Gmail API`);
            
            // Transform Gmail API emails to UI format
            const transformedEmails: Email[] = data.emails.map((email: any) => ({
              id: email.id,
              from: email.from || 'Unknown Sender',
              subject: email.subject || '(No Subject)',
              body: email.body || '',
              date: email.date || new Date().toISOString(),
              read: readEmails.has(email.id) || email.read,
              folder: email.folder || 'inbox',
              attachments: email.attachments || []
            }));

            setEmails(transformedEmails);
            setLoading(false);
            return;
          }
        } catch (gmailError) {
          console.log('Gmail API failed:', gmailError);
        }
      } else if (account?.provider_type === 'imap' && account?.id) {
        // Use IMAP API for IMAP accounts
        try {
          const url = `/api/email/imap-fetch?accountId=${account.id}&maxEmails=20`;
          const response = await fetch(url);
          const data = await response.json();

          if (response.ok && data.success && data.emails) {
            console.log(`Successfully loaded ${data.count || 0} emails from IMAP for ${data.account}`);
            
            // Transform IMAP API emails to UI format
            const transformedEmails: Email[] = data.emails.map((email: any) => ({
              id: email.id,
              from: email.from || 'Unknown Sender',
              subject: email.subject || '(No Subject)',
              body: email.body || '',
              date: email.date || new Date().toISOString(),
              read: readEmails.has(email.id) || email.read,
              folder: email.folder || 'inbox',
              attachments: email.attachments || []
            }));

            setEmails(transformedEmails);
            setLoading(false);
            return;
          }
        } catch (imapError) {
          console.log('IMAP API failed:', imapError);
        }
      }
      
      console.log('All API methods failed, trying database fallback...');

      // Fallback to database emails
      const { data: dbEmails, error: dbError } = await supabase
        .from('emails')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (dbError) {
        console.error('Database error:', dbError);
        throw new Error('Failed to load emails from database');
      }

      if (dbEmails && dbEmails.length > 0) {
        console.log(`Loaded ${dbEmails.length} emails from database`);
        
        const transformedEmails: Email[] = dbEmails.map((email: any) => ({
          id: email.id,
          from: email.sender || 'Unknown Sender',
          subject: email.subject || '(No Subject)',
          body: email.raw_content || email.content || '',
          date: email.created_at || new Date().toISOString(),
          read: readEmails.has(email.id) || true,
          folder: 'inbox',
          attachments: []
        }));

        setEmails(transformedEmails);
        setLoading(false);
        return;
      }

      // If no emails found, show sample data
      console.log('No emails found, showing sample data');
      const sampleEmails: Email[] = [
        {
          id: 'sample-1',
          from: 'john.doe@example.com',
          subject: 'Welcome to Fresh AI CRM!',
          body: 'Hi there! Welcome to your new CRM system. We\'re excited to help you manage your business relationships more effectively.',
          date: new Date(Date.now() - 86400000).toISOString(),
          read: false,
          folder: 'inbox',
          attachments: []
        },
        {
          id: 'sample-2',
          from: 'support@freshaicrm.com',
          subject: 'Getting Started Guide',
          body: 'Here\'s a quick guide to help you get started with Fresh AI CRM. You can connect your email accounts, manage contacts, and track interactions.',
          date: new Date(Date.now() - 172800000).toISOString(),
          read: true,
          folder: 'inbox',
          attachments: []
        }
      ];

      setEmails(sampleEmails);
      setLoading(false);

    } catch (error) {
      console.error('Error loading emails:', error);
      setError(error instanceof Error ? error.message : 'Failed to load emails');
      setLoading(false);
    }
  };

  // Refresh emails
  const refreshEmails = async () => {
    console.log('Refreshing emails...');
    setEmails([]);
    await loadEmails();
  };

  // Initialize component
  useEffect(() => {
    if (session?.user) {
      loadEmails();
    }
  }, [session?.user?.id, account?.id]); // Load emails when user or account changes

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    
    // Mark as read
    if (!email.read) {
      const updatedReadEmails = new Set([...readEmails, email.id]);
      setReadEmails(updatedReadEmails);
      
      const updatedEmails = emails.map(e => 
        e.id === email.id ? { ...e, read: true } : e
      );
      setEmails(updatedEmails);
    }
  };

  const handleSalesAgent = () => {
    if (selectedEmail) {
      onSalesAgent(selectedEmail.id, selectedEmail);
    }
  };

  const loadMoreEmails = () => {
    if (isLoadingMore || !hasMoreEmails) return;
    
    setIsLoadingMore(true);
    
    // Simulate loading more emails (in production, this would be an API call)
    setTimeout(() => {
      const newDisplayCount = displayCount + 10;
      setDisplayCount(newDisplayCount);
      
      // Check if we've shown all emails
      if (newDisplayCount >= emails.length) {
        setHasMoreEmails(false);
      }
      
      setIsLoadingMore(false);
    }, 500);
  };

  const displayedEmails = emails.slice(0, displayCount);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-600">Loading emails...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Button onClick={refreshEmails} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <FaInbox className="h-4 w-4 text-blue-600" />
          <span className="font-medium text-gray-800">Inbox ({emails.length})</span>
        </div>
        <Button onClick={refreshEmails} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <div className="flex-1 flex gap-3 p-3 min-h-0">
        <div className="email-list-container w-64 flex-shrink-0 bg-gray-50 rounded-lg border overflow-hidden">
          <ScrollArea className="h-full">
            <div className="py-2 px-2 pb-3">
              {emails.length === 0 ? (
                <div className="text-center py-8">
                  <FaInbox className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No emails found</p>
                  <p className="text-sm text-gray-400">Your emails will appear here</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {displayedEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`email-list-item p-1.5 mb-2 rounded-md cursor-pointer transition-all duration-200 border shadow-sm ${
                        selectedEmail?.id === email.id
                          ? 'bg-blue-50 border-blue-200 shadow-md'
                          : email.read
                          ? 'bg-white border-gray-100 hover:bg-gray-50 hover:shadow-md'
                          : 'bg-white border-blue-200 hover:bg-blue-50 hover:shadow-md border-l-4 border-l-blue-500'
                      }`}
                      onClick={() => handleEmailClick(email)}
                    >
                                              <div className="w-full">
                          <div className="flex items-start justify-between mb-1">
                            <p className={`text-xs font-medium truncate flex-1 pr-1 ${
                              email.read ? 'text-gray-600' : 'text-gray-800'
                            }`}
                             title={email.from}
                             style={{ maxWidth: 'calc(100% - 70px)' }}>
                              {email.from}
                            </p>
                            <div className="flex items-center space-x-1 flex-shrink-0 min-w-[70px] justify-end">
                              {!email.read && (
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
                              )}
                              <span className="text-xs text-gray-400 whitespace-nowrap">
                                {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}{' '}
                                {new Date(email.date).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </div>
                          <p className={`email-subject text-sm mb-1 leading-tight ${
                            email.read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'
                          }`}
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 2,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden',
                               textOverflow: 'ellipsis'
                             }}
                             title={email.subject}>
                            {email.subject}
                          </p>
                          <p className="email-preview text-xs text-gray-500 leading-tight" 
                             style={{
                               display: '-webkit-box',
                               WebkitLineClamp: 1,
                               WebkitBoxOrient: 'vertical',
                               overflow: 'hidden',
                               textOverflow: 'ellipsis'
                             }}>
                            {generateEmailPreview(parseEmailContent(email.body), 70)}
                          </p>
                        </div>
                    </div>
                  ))}
                  
                  {/* Load more button */}
                  {hasMoreEmails && displayCount < emails.length && (
                    <div className="text-center py-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadMoreEmails}
                        disabled={isLoadingMore}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {isLoadingMore ? (
                          <>
                            <FaSpinner className="h-3 w-3 animate-spin mr-2" />
                            Loading...
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-1" />
                            Load More ({emails.length - displayCount} remaining)
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
        <div className="flex-1 bg-white min-w-0">
          <Card className="h-full border border-gray-200 shadow-sm bg-white rounded-lg overflow-hidden">
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                {/* Email Header */}
                <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg font-semibold text-gray-900 mb-2">
                        {selectedEmail.subject}
                      </CardTitle>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FaUser className="h-4 w-4" />
                          <span>{selectedEmail.from}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaCalendarAlt className="h-4 w-4" />
                          <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {!selectedEmail.read && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">Unread</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2 pt-2">
                    <Button
                      onClick={handleSalesAgent}
                      disabled={isSalesProcessing}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-sm flex-1"
                      size="sm"
                    >
                      {isSalesProcessing ? (
                        <>
                          <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing & Drafting...
                        </>
                      ) : (
                        <>
                          <FaEnvelope className="h-4 w-4 mr-2" />
                          AI Analysis & Draft
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>

                {/* Customer Info Widget */}
                <div className="px-4 pt-3">
                  <CustomerInfoWidget customerEmail={selectedEmail.from} />
                </div>

                {/* Email Body */}
                <CardContent className="flex-1 p-0 min-w-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 min-w-0">
                      <div className="email-content max-w-none min-w-0">
                        <div 
                          className="text-sm text-gray-800 leading-relaxed break-words overflow-hidden min-w-0"
                          style={{
                            fontFamily: 'system-ui, -apple-system, sans-serif',
                            lineHeight: '1.6',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word',
                            maxWidth: '100%'
                          }}
                          dangerouslySetInnerHTML={{
                            __html: parseEmailContent(selectedEmail.body).displayContent
                          }}
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </div>
            ) : (
              <CardContent className="h-full flex items-center justify-center">
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                    <FaEnvelope className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Selected</h3>
                  <p className="text-gray-500 text-sm max-w-sm">
                    Choose an email from the list to view its content and use AI-powered analysis tools.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
} 