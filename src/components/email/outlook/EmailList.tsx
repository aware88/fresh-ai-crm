'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Alert } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  DollarSign, 
  AlertTriangle, 
  CreditCard, 
  Bot,
  Clock,
  Zap
} from 'lucide-react';

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
  // Agent assignment fields
  assigned_agent?: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  highlight_color?: string;
  agent_priority?: 'low' | 'medium' | 'high' | 'urgent';
  auto_reply_enabled?: boolean;
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

  // Helper function to get agent icon
  const getAgentIcon = (agentType?: string) => {
    switch (agentType) {
      case 'customer': return <User className="h-3 w-3" />;
      case 'sales': return <DollarSign className="h-3 w-3" />;
      case 'dispute': return <AlertTriangle className="h-3 w-3" />;
      case 'billing': return <CreditCard className="h-3 w-3" />;
      case 'auto_reply': return <Bot className="h-3 w-3" />;
      default: return <Bot className="h-3 w-3" />;
    }
  };

  // Helper function to get agent label
  const getAgentLabel = (agentType?: string) => {
    switch (agentType) {
      case 'customer': return 'Customer Service';
      case 'sales': return 'Sales';
      case 'dispute': return 'Dispute';
      case 'billing': return 'Billing';
      case 'auto_reply': return 'Auto Reply';
      default: return 'General';
    }
  };

  // Helper function to get priority icon
  const getPriorityIcon = (priority?: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="h-3 w-3 text-red-500" />;
      case 'high': return <Clock className="h-3 w-3 text-orange-500" />;
      default: return null;
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant="destructive">{error}</Alert>;

  return (
    <div className="email-list h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4 flex-shrink-0">Inbox</h2>
      {emails.length === 0 ? (
        <p className="text-gray-500">No emails found</p>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <ul className="divide-y divide-gray-200">
            {emails.map((email) => (
            <li 
              key={email.id} 
              className={`py-3 px-4 cursor-pointer hover:bg-gray-50 ${email.isRead ? 'bg-white' : 'bg-blue-50'} relative`}
              onClick={() => handleEmailClick(email.id)}
              data-email-id={email.id}
              style={{
                borderLeft: email.highlight_color ? `4px solid ${email.highlight_color}` : '4px solid transparent'
              }}
            >
              <div className="flex flex-col space-y-2">
                {/* Header row with sender, agent info, and time */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className={`font-medium truncate ${!email.isRead ? 'font-semibold' : ''}`}>
                      {email.from.emailAddress.name || email.from.emailAddress.address}
                    </span>
                    
                    {/* Agent assignment badge */}
                    {email.assigned_agent && (
                      <Badge 
                        variant="outline" 
                        className="text-xs flex items-center space-x-1 shrink-0"
                        style={{ 
                          borderColor: email.highlight_color,
                          color: email.highlight_color 
                        }}
                      >
                        {getAgentIcon(email.assigned_agent)}
                        <span>{getAgentLabel(email.assigned_agent)}</span>
                      </Badge>
                    )}

                    {/* Auto-reply indicator */}
                    {email.auto_reply_enabled && (
                      <Badge variant="secondary" className="text-xs shrink-0">
                        <Bot className="h-2 w-2 mr-1" />
                        Auto
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 shrink-0">
                    {/* Priority indicator */}
                    {getPriorityIcon(email.agent_priority)}
                    
                    <span className="text-sm text-gray-500">
                      {new Date(email.receivedDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Subject line */}
                <div className={`${!email.isRead ? 'font-semibold' : ''} flex items-center space-x-2`}>
                  <span className="flex-1 truncate">{email.subject}</span>
                  <div className="flex items-center space-x-1 shrink-0">
                    {email.hasAttachments && (
                      <span className="text-gray-500">📎</span>
                    )}
                    {email.importance === 'high' && (
                      <span className="text-red-500">❗</span>
                    )}
                  </div>
                </div>

                {/* Preview text */}
                <div className="text-sm text-gray-600 truncate">
                  {email.bodyPreview}
                </div>
              </div>
            </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
