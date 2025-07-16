import React, { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FaInbox, FaEnvelope, FaUser, FaCalendarAlt, FaSpinner } from 'react-icons/fa';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';

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
  onAnalyzeEmail: (emailId: string) => void;
  onSalesAgent: (emailId: string) => void;
  isAnalyzing: boolean;
  isSalesProcessing: boolean;
}

export default function ImapClient({ account, onAnalyzeEmail, onSalesAgent, isAnalyzing, isSalesProcessing }: ImapClientProps) {
  const { data: session } = useSession();
  const supabase = createClientComponentClient();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [readEmails, setReadEmails] = useState<Set<string>>(new Set());
  const [displayCount, setDisplayCount] = useState(5);
  const [isExpanded, setIsExpanded] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    hasNextPage: false,
    nextPageToken: null,
    totalEstimate: 0
  });
  const [loadingMore, setLoadingMore] = useState(false);

  // Load emails - with fallback to sample data
  const loadEmails = async (pageToken?: string) => {
    if (!session?.user) {
      setError('User not authenticated');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Loading emails...');
      
      // Try Gmail API first
      try {
        let url = '/api/email/gmail-simple';
        if (pageToken) {
          url += `?pageToken=${pageToken}`;
        }
        
        const response = await fetch(url);
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

          if (pageToken) {
            // Append to existing emails for pagination
            setEmails(prev => [...prev, ...transformedEmails]);
          } else {
            // Replace emails for initial load
            setEmails(transformedEmails);
          }
          
          // Update pagination info
          if (data.pagination) {
            setPagination(data.pagination);
          }
          
          setLoading(false);
          return;
        }
      } catch (gmailError) {
        console.log('Gmail API not available, trying database fallback...');
      }

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

  // Load more emails (pagination)
  const loadMoreEmails = async () => {
    if (!pagination.hasNextPage || loadingMore) return;
    
    setLoadingMore(true);
    try {
      await loadEmails(pagination.nextPageToken || undefined);
    } finally {
      setLoadingMore(false);
    }
  };

  // Refresh emails
  const refreshEmails = async () => {
    setEmails([]);
    setPagination({
      page: 1,
      limit: 20,
      hasNextPage: false,
      nextPageToken: null,
      totalEstimate: 0
    });
    await loadEmails();
  };

  useEffect(() => {
    loadEmails();
  }, [session]);

  const handleEmailClick = (email: Email) => {
    setSelectedEmail(email);
    
    // Mark as read
    if (!email.read) {
      setReadEmails(prev => new Set([...prev, email.id]));
      setEmails(prev => prev.map(e => 
        e.id === email.id ? { ...e, read: true } : e
      ));
    }
  };

  const handleAnalyze = () => {
    if (selectedEmail) {
      onAnalyzeEmail(selectedEmail.id);
    }
  };

  const handleSalesAgent = () => {
    if (selectedEmail) {
      onSalesAgent(selectedEmail.id);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
    setDisplayCount(isExpanded ? 5 : emails.length);
  };

  const displayedEmails = isExpanded ? emails : emails.slice(0, displayCount);

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
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <FaInbox className="h-4 w-4" />
              Inbox ({emails.length})
            </TabsTrigger>
          </TabsList>
          <Button onClick={refreshEmails} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <TabsContent value="inbox" className="flex-1 flex">
          {/* Email List */}
          <div className="w-1/2 border-r bg-gray-50">
            <ScrollArea className="h-full">
              <div className="p-2">
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
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedEmail?.id === email.id
                            ? 'bg-blue-100 border-blue-200'
                            : email.read
                            ? 'bg-white hover:bg-gray-50'
                            : 'bg-white hover:bg-gray-50 border-l-4 border-blue-500'
                        }`}
                        onClick={() => handleEmailClick(email)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm truncate ${
                                email.read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'
                              }`}>
                                {email.from}
                              </p>
                              {!email.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                            </div>
                            <p className={`text-sm truncate mt-1 ${
                              email.read ? 'font-normal text-gray-700' : 'font-semibold text-gray-900'
                            }`}>
                              {email.subject}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {email.body.substring(0, 100)}...
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(email.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Show more/less button */}
                    {emails.length > 5 && (
                      <div className="text-center py-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={toggleExpanded}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="h-4 w-4 mr-1" />
                              Show Less
                            </>
                          ) : (
                            <>
                              <ChevronDown className="h-4 w-4 mr-1" />
                              Show More ({emails.length - 5} more)
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    
                    {/* Load more button for pagination */}
                    {pagination.hasNextPage && (
                      <div className="text-center py-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={loadMoreEmails}
                          disabled={loadingMore}
                          className="w-full"
                        >
                          {loadingMore ? (
                            <>
                              <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                              Loading...
                            </>
                          ) : (
                            <>
                              Load More Emails
                              {pagination.totalEstimate > 0 && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (~{pagination.totalEstimate - emails.length} more)
                                </span>
                              )}
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

          {/* Email Detail */}
          <div className="w-1/2 bg-white">
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                {/* Email Header */}
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {selectedEmail.subject}
                      </h3>
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
                        <Badge variant="secondary">Unread</Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {isAnalyzing ? (
                        <>
                          <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'AI Analysis'
                      )}
                    </Button>
                    <Button
                      onClick={handleSalesAgent}
                      disabled={isSalesProcessing}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isSalesProcessing ? (
                        <>
                          <FaSpinner className="h-4 w-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Sales Agent'
                      )}
                    </Button>
                  </div>
                </div>

                {/* Email Body */}
                <ScrollArea className="flex-1 p-4">
                  <div className="prose max-w-none">
                    <div className="whitespace-pre-wrap text-sm">
                      {selectedEmail.body}
                    </div>
                  </div>
                </ScrollArea>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <FaEnvelope className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Select an email to view its content</p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
