'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';

interface Email {
  id: string;
  subject: string;
  bodyPreview: string;
  receivedDateTime: string;
  from: {
    emailAddress: {
      name: string;
      address: string;
    };
  };
  isRead: boolean;
  hasAttachments: boolean;
  importance: 'normal' | 'high' | 'low';
}

interface EmailListProps {
  onEmailSelect?: (emailId: string) => void;
}

export function EmailList({ onEmailSelect }: EmailListProps = {}) {
  const { data: session } = useSession();
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEmails() {
      if (!session?.accessToken) {
        setError('Not authenticated with Microsoft Graph');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const response = await fetch('/api/emails?top=20', {
          credentials: 'include', // Include cookies in the request
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching emails: ${response.statusText}`);
        }
        
        const data = await response.json();
        setEmails(data.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Failed to fetch emails:', err);
        setError(err.message || 'Failed to load emails. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchEmails();
  }, [session]);

  const handleEmailClick = async (emailId: string) => {
    setSelectedEmailId(emailId);
    
    // Call the parent's onEmailSelect if provided
    if (onEmailSelect) {
      onEmailSelect(emailId);
    }
    
    // Mark email as read in-app (dev-phase: do NOT update provider)
    const email = emails.find(e => e.id === emailId);
    if (email && !email.isRead) {
      try {
        const localOnly = process.env.NEXT_PUBLIC_EMAIL_LOCAL_READ_ONLY === 'true';
        if (!localOnly) {
          await fetch(`/api/emails/${emailId}`, {
            method: 'PATCH',
            credentials: 'include', // Include cookies in the request
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ isRead: true }),
          });
        }
        
        // Update local state
        setEmails(emails.map(e => 
          e.id === emailId ? { ...e, isRead: true } : e
        ));
      } catch (err) {
        console.error('Failed to mark email as read:', err);
      }
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant="destructive">{error}</Alert>;

  return (
    <div className="email-list">
      <h2 className="text-xl font-semibold mb-4">Inbox</h2>
      {emails.length === 0 ? (
        <p className="text-gray-500">No emails found</p>
      ) : (
        <ul className="divide-y divide-gray-200">
          {emails.map((email) => (
            <li 
              key={email.id} 
              className={`py-3 px-4 cursor-pointer hover:bg-gray-50 ${email.isRead ? 'bg-white' : 'bg-blue-50'}`}
              onClick={() => handleEmailClick(email.id)}
              data-email-id={email.id}
            >
              <div className="flex flex-col">
                <div className="flex justify-between">
                  <span className={`font-medium ${!email.isRead ? 'font-semibold' : ''}`}>
                    {email.from.emailAddress.name || email.from.emailAddress.address}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(email.receivedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className={`${!email.isRead ? 'font-semibold' : ''}`}>
                  {email.subject}
                  {email.hasAttachments && (
                    <span className="ml-2 text-gray-500">📎</span>
                  )}
                  {email.importance === 'high' && (
                    <span className="ml-2 text-red-500">❗</span>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {email.bodyPreview}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
