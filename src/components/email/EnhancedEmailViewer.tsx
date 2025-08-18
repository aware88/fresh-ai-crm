'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import EmailRenderer from './EmailRenderer';
import EmailAttachments from './outlook/EmailAttachments';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Flag,
  Download,
  Printer, // Changed from Print to Printer
  Share,
  Clock,
  User,
  Mail
} from 'lucide-react';

interface EmailAttachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  contentBytes?: string;
  url?: string;
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
  flag?: {
    flagStatus: string;
  };
}

interface EnhancedEmailViewerProps {
  email: Email;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onDelete?: () => void;
  onArchive?: () => void;
  onFlag?: () => void;
  onStar?: () => void;
  className?: string;
  compactMode?: boolean;
}

export default function EnhancedEmailViewer({
  email,
  onReply,
  onReplyAll,
  onForward,
  onDelete,
  onArchive,
  onFlag,
  onStar,
  className,
  compactMode = false
}: EnhancedEmailViewerProps) {
  const [showFullHeaders, setShowFullHeaders] = useState(false);
  const [showRawContent, setShowRawContent] = useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString(undefined, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffInHours < 24 * 7) {
      return date.toLocaleDateString(undefined, { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else {
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const formatEmailAddress = (emailAddress: EmailAddress) => {
    if (emailAddress.name) {
      return `${emailAddress.name} <${emailAddress.address}>`;
    }
    return emailAddress.address;
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Print Email - ${email.subject}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { border-bottom: 1px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
              .meta { color: #666; font-size: 14px; }
              .content { line-height: 1.6; }
            </style>
          </head>
          <body>
            <div class="header">
              <h2>${email.subject}</h2>
              <div class="meta">
                <p><strong>From:</strong> ${formatEmailAddress(email.from.emailAddress)}</p>
                <p><strong>To:</strong> ${email.toRecipients.map(r => formatEmailAddress(r.emailAddress)).join(', ')}</p>
                ${email.ccRecipients?.length ? `<p><strong>Cc:</strong> ${email.ccRecipients.map(r => formatEmailAddress(r.emailAddress)).join(', ')}</p>` : ''}
                <p><strong>Date:</strong> ${formatDate(email.receivedDateTime)}</p>
              </div>
            </div>
            <div class="content">
              ${email.body.content}
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDownloadEml = () => {
    // Create EML content
    const emlContent = `From: ${formatEmailAddress(email.from.emailAddress)}
To: ${email.toRecipients.map(r => formatEmailAddress(r.emailAddress)).join(', ')}
${email.ccRecipients?.length ? `Cc: ${email.ccRecipients.map(r => formatEmailAddress(r.emailAddress)).join(', ')}\n` : ''}Subject: ${email.subject}
Date: ${email.receivedDateTime}
Content-Type: ${email.body.contentType}

${email.body.content}`;

    const blob = new Blob([emlContent], { type: 'message/rfc822' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${email.subject.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.eml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card className={`${className} ${compactMode ? 'h-full flex flex-col' : ''}`}>
      <CardHeader className={`${compactMode ? 'pb-2' : 'pb-4'}`}>
        {/* Email Header */}
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className={`${compactMode ? 'text-lg' : 'text-xl'} mb-2 pr-4`}>
                {email.subject}
                {email.importance === 'high' && (
                  <Badge variant="destructive" className="ml-2 text-xs">
                    High Priority
                  </Badge>
                )}
                {email.importance === 'low' && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Low Priority
                  </Badge>
                )}
              </CardTitle>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center space-x-1">
              <Button variant="ghost" size="sm" onClick={onStar} title="Star">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onFlag} title="Flag">
                <Flag className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint} title="Print">
                <Printer className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={handleDownloadEml} title="Download">
                <Download className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" title="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email Metadata */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="font-medium">
                  {formatEmailAddress(email.from.emailAddress)}
                </span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatDate(email.receivedDateTime)}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>
                <span className="text-gray-600">to</span>{' '}
                {email.toRecipients.map((r, i) => (
                  <span key={i}>
                    {i > 0 && ', '}
                    <span className="font-medium">
                      {formatEmailAddress(r.emailAddress)}
                    </span>
                  </span>
                ))}
              </span>
            </div>
            
            {email.ccRecipients && email.ccRecipients.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="w-4" />
                <span>
                  <span className="text-gray-600">cc</span>{' '}
                  {email.ccRecipients.map((r, i) => (
                    <span key={i}>
                      {i > 0 && ', '}
                      <span className="font-medium">
                        {formatEmailAddress(r.emailAddress)}
                      </span>
                    </span>
                  ))}
                </span>
              </div>
            )}

            {/* Show/Hide Full Headers */}
            <button
              onClick={() => setShowFullHeaders(!showFullHeaders)}
              className="text-blue-600 hover:underline text-xs"
            >
              {showFullHeaders ? 'Hide details' : 'Show details'}
            </button>

            {showFullHeaders && (
              <div className="bg-gray-50 p-3 rounded text-xs space-y-1 font-mono">
                <div><strong>Message-ID:</strong> {email.id}</div>
                <div><strong>Date:</strong> {email.receivedDateTime}</div>
                <div><strong>Content-Type:</strong> {email.body.contentType}</div>
                {email.hasAttachments && (
                  <div><strong>Attachments:</strong> {email.attachments?.length || 0} files</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Actions */}
        {!compactMode && (
          <div className="flex items-center space-x-2 pt-3 border-t">
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
            <div className="flex-1" />
            <Button onClick={onArchive} variant="ghost" size="sm">
              <Archive className="h-3 w-3 mr-1" />
              Archive
            </Button>
            <Button onClick={onDelete} variant="ghost" size="sm" className="text-red-600">
              <Trash2 className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className={`${compactMode ? 'flex-1 overflow-y-auto' : ''} space-y-4`}>
        {/* Attachments */}
        {email.hasAttachments && email.attachments && email.attachments.length > 0 && (
          <div>
            <EmailAttachments
              attachments={email.attachments.map(att => ({
                id: att.id,
                name: att.name,
                contentType: att.contentType,
                size: att.size,
                url: att.contentBytes ? `data:${att.contentType};base64,${att.contentBytes}` : att.url
              }))}
              messageId={email.id}
              readOnly={true}
            />
            <Separator className="mt-4" />
          </div>
        )}

        {/* Email Content */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Message</h4>
            <button
              onClick={() => setShowRawContent(!showRawContent)}
              className="text-blue-600 hover:underline text-xs"
            >
              {showRawContent ? 'Formatted view' : 'Raw content'}
            </button>
          </div>

          {showRawContent ? (
            <pre className="bg-gray-50 p-4 rounded text-xs overflow-x-auto whitespace-pre-wrap font-mono">
              {email.body.content}
            </pre>
          ) : (
            <div className="prose max-w-none">
              <EmailRenderer 
                content={email.body.content}
                className="text-sm leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Compact Mode Actions */}
        {compactMode && (
          <div className="flex items-center space-x-2 pt-3 border-t">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}