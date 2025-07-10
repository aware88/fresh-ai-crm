import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { FaEnvelope, FaInbox, FaStar, FaPaperPlane, FaTrash, FaSpinner } from 'react-icons/fa';

interface ImapClientProps {
  account: any;
  onAnalyzeEmail?: (emailId: string) => void;
  onSalesAgent?: (emailId: string) => void;
}

export default function ImapClient({ account, onAnalyzeEmail, onSalesAgent }: ImapClientProps) {
  const [loading, setLoading] = useState(true);
  const [emails, setEmails] = useState<any[]>([]);
  const [activeFolder, setActiveFolder] = useState('inbox');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEmails() {
      try {
        setLoading(true);
        // In a real implementation, this would fetch emails from the IMAP account
        // For now, we'll just simulate loading and show a placeholder
        setTimeout(() => {
          setLoading(false);
          setEmails([
            {
              id: 'email1',
              from: 'example@example.com',
              subject: 'Sample Email 1',
              date: new Date().toISOString(),
              snippet: 'This is a sample email for the IMAP client...'
            },
            {
              id: 'email2',
              from: 'another@example.com',
              subject: 'Sample Email 2',
              date: new Date(Date.now() - 3600000).toISOString(),
              snippet: 'Another sample email for testing...'
            }
          ]);
        }, 1500);
      } catch (err) {
        console.error('Error fetching emails:', err);
        setError('Failed to fetch emails');
        setLoading(false);
      }
    }

    fetchEmails();
  }, [account.id, activeFolder]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin h-8 w-8 text-blue-500" />
        <span className="ml-2">Loading emails from {account.email}...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        <p>Error: {error}</p>
        <Button 
          variant="outline" 
          className="mt-2"
          onClick={() => window.location.reload()}
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-250px)] min-h-[500px]">
      {/* Folders sidebar */}
      <div className="w-48 border-r p-4 space-y-2">
        <h3 className="font-medium text-sm text-gray-500 mb-3">
          {account.email}
        </h3>
        <Button 
          variant={activeFolder === 'inbox' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveFolder('inbox')}
        >
          <FaInbox className="mr-2" /> Inbox
        </Button>
        <Button 
          variant={activeFolder === 'starred' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveFolder('starred')}
        >
          <FaStar className="mr-2" /> Starred
        </Button>
        <Button 
          variant={activeFolder === 'sent' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveFolder('sent')}
        >
          <FaPaperPlane className="mr-2" /> Sent
        </Button>
        <Button 
          variant={activeFolder === 'trash' ? 'default' : 'ghost'} 
          className="w-full justify-start"
          onClick={() => setActiveFolder('trash')}
        >
          <FaTrash className="mr-2" /> Trash
        </Button>
      </div>

      {/* Email list */}
      <div className="flex-1 overflow-auto">
        {emails.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <FaEnvelope className="h-12 w-12 mb-4" />
            <p>No emails in this folder</p>
          </div>
        ) : (
          <div className="divide-y">
            {emails.map((email) => (
              <div key={email.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                <div className="flex justify-between">
                  <span className="font-medium">{email.from}</span>
                  <span className="text-sm text-gray-500">{formatDate(email.date)}</span>
                </div>
                <div className="font-medium">{email.subject}</div>
                <div className="text-sm text-gray-600 truncate">{email.snippet}</div>
                <div className="mt-2 flex space-x-2">
                  {onAnalyzeEmail && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onAnalyzeEmail(email.id)}
                    >
                      Analyze
                    </Button>
                  )}
                  {onSalesAgent && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onSalesAgent(email.id)}
                    >
                      AI Sales Agent
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
