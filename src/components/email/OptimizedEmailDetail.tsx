/**
 * OptimizedEmailDetail Component
 * 
 * Displays full email content loaded on-demand with smart caching
 */

'use client';

import React, { useState, useEffect } from 'react';

import { useEmailContent } from '@/hooks/useOptimizedEmails';

// Define attachment interface
interface EmailAttachment {
  filename: string;
  contentType?: string;
  content?: string;
  contentId?: string;
  size: number;
  url?: string;
}
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

import { Skeleton } from '@/components/ui/skeleton';
import { EmailRenderer } from './EmailRenderer';
import CustomerInfoWidget from './CustomerInfoWidget';
import { 
  Reply, 
  ReplyAll, 
  Forward, 
  Archive, 
  Trash2, 
  Star,
  MoreHorizontal,
  Paperclip,
  Calendar,
  User,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  EyeOff,
  FileText,
  FileSpreadsheet,
  Image,
  RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface OptimizedEmailDetailProps {
  messageId: string;
  onReply?: () => void;
  onReplyAll?: () => void;
  onForward?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}

export default function OptimizedEmailDetail({
  messageId,
  onReply,
  onReplyAll,
  onForward,
  onArchive,
  onDelete,
  onBack
}: OptimizedEmailDetailProps) {
  console.log('🔥 [OptimizedEmailDetail] Component rendered with messageId:', messageId);
  
  const { content, loading, error, reload } = useEmailContent(messageId);
  const [showFullHeaders, setShowFullHeaders] = useState(false);
  
  console.log('🔥 [OptimizedEmailDetail] Content state:', { content: !!content, loading, error });
  const [updatingReadStatus, setUpdatingReadStatus] = useState(false);

  const handleToggleReadStatus = async () => {
    if (!content || updatingReadStatus) return;
    
    setUpdatingReadStatus(true);
    try {
      const response = await fetch(`/api/email/${messageId}/read-status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: !content.is_read })
      });

      if (response.ok) {
        // Dispatch event to update other components first
        window.dispatchEvent(new CustomEvent('emailReadStatusChanged', { 
          detail: { messageId, isRead: !content.is_read } 
        }));
        
        // Reload to get the updated state from the database
        try {
          await reload();
        } catch (error) {
          console.warn('Failed to reload email content after read status change:', error);
          // Don't show error to user for this, the read status change was successful
        }
      }
    } catch (error) {
      console.error('Failed to update read status:', error);
    } finally {
      setUpdatingReadStatus(false);
    }
  };

  // Format email addresses
  const formatEmailAddress = (email: string, name?: string) => {
    if (name && name !== email) {
      return `${name} <${email}>`;
    }
    return email;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      absolute: date.toLocaleString(undefined, {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
  };

  // Process attachments to replace CID references in HTML content
  useEffect(() => {
    if (!content) return;
    
    const handleCidImages = (event: CustomEvent) => {
      const cids = event.detail?.cids;
      if (!cids || !content.attachments) return;
      
      // Find matching attachments by CID
      const cidAttachments = content.attachments.filter((att: EmailAttachment) => 
        cids.includes(att.contentId)
      );
      
      if (cidAttachments.length > 0) {
        console.log('Found CID attachments:', cidAttachments.length);
      }
    };
    
    // Add event listener for CID image replacement
    document.addEventListener('email-cid-images', handleCidImages as EventListener);
    
    return () => {
      document.removeEventListener('email-cid-images', handleCidImages as EventListener);
    };
  }, [content]);
  
  // Render attachment
  const renderAttachment = (attachment: EmailAttachment) => {
    const handleDownload = async () => {
      try {
        // Try to download via API first
        const response = await fetch('/api/emails/attachment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: content.message_id,
            attachmentId: attachment.contentId,
            filename: attachment.filename
          })
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.content) {
            // Create download link
            const link = document.createElement('a');
            link.href = `data:${data.contentType || 'application/octet-stream'};base64,${data.content}`;
            link.download = data.filename || attachment.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
          }
        }
        
        // Fallback methods if API fails
        if (attachment.url) {
          window.open(attachment.url, '_blank');
        } else if (attachment.content) {
          // If attachment has content directly
          const link = document.createElement('a');
          link.href = `data:${attachment.contentType || 'application/octet-stream'};base64,${attachment.content}`;
          link.download = attachment.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          throw new Error('No attachment content available');
        }
      } catch (error) {
        console.error('Failed to download attachment:', error);
        alert('Failed to download attachment. Please try again.');
      }
    };
    
    // Determine icon based on file type
    const getAttachmentIcon = () => {
      const fileType = attachment.contentType || '';
      if (fileType.includes('image')) {
        return <Image className="h-4 w-4 text-blue-500" />;
      } else if (fileType.includes('pdf')) {
        return <FileText className="h-4 w-4 text-red-500" />;
      } else if (fileType.includes('word') || fileType.includes('document')) {
        return <FileText className="h-4 w-4 text-blue-600" />;
      } else if (fileType.includes('excel') || fileType.includes('spreadsheet')) {
        return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
      } else {
        return <Paperclip className="h-4 w-4 text-blue-500" />;
      }
    };
    
    return (
      <div key={attachment.contentId || attachment.filename} 
           className="flex items-center justify-between p-2 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100">
        <div className="flex items-center space-x-2">
          {getAttachmentIcon()}
          <span className="text-sm font-medium">{attachment.filename}</span>
          <span className="text-xs text-gray-500">
            ({(attachment.size / 1024).toFixed(1)} KB)
          </span>
        </div>
        <div className="flex space-x-2">
          {attachment.contentType?.startsWith('image/') && (
            <Button 
              variant="outline" 
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                if (attachment.content) {
                  window.open(`data:${attachment.contentType};base64,${attachment.content}`, '_blank');
                }
              }}
            >
              View
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={handleDownload}
          >
            Download
          </Button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Separator />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 font-medium">Failed to load email content</p>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <div className="space-x-2">
              <Button onClick={reload} variant="outline">
                <Loader2 className="h-4 w-4 mr-2" />
                Retry
              </Button>
              {onBack && (
                <Button onClick={onBack} variant="ghost">
                  Back to List
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <div className="text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No email selected</p>
            <p className="text-sm text-gray-400">Select an email to view its content</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dateInfo = formatDate(content.received_at);

  return (
    <div className="h-full flex flex-col overflow-hidden email-detail-with-attachments">
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-xl font-semibold mb-2 line-clamp-2">
                {content.subject || '(No Subject)'}
              </CardTitle>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium">
                    {formatEmailAddress(content.sender_email, content.sender_name)}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    to {content.recipient_email || 'me'}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span title={dateInfo.relative}>{dateInfo.absolute}</span>
                  </div>
                  

                  
                  {content.ai_analyzed && (
                    <Badge variant="secondary" className="text-xs">
                      AI Analyzed
                    </Badge>
                  )}
                  
                  {content.opportunity_value > 0 && (
                    <Badge variant="default" className="bg-green-100 text-green-800 text-xs">
                      ${content.opportunity_value}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-2 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleToggleReadStatus}
                disabled={updatingReadStatus}
                title={content?.is_read ? 'Mark as unread' : 'Mark as read'}
              >
                {updatingReadStatus ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : content?.is_read ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button variant="outline" size="sm" onClick={onReply}>
                <Reply className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onReplyAll}>
                <ReplyAll className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onForward}>
                <Forward className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onArchive}>
                <Archive className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={onDelete}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Attachments */}
              {content.attachments && content.attachments.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attachments ({content.attachments.length})
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {content.attachments.map(renderAttachment)}
                  </div>
                </div>
              )}

              {/* Email content */}
              <div className="bg-gray-50 border rounded-lg p-4">
                {/* Inline attachments display */}
                {content.html_content && content.attachments && content.attachments.length > 0 && (
                  <div className="mb-4">
                    {content.attachments
                      .filter((att: EmailAttachment) => att.contentId && att.contentType?.startsWith('image/'))
                      .map((att: EmailAttachment) => (
                        <div key={`inline-${att.contentId}`} className="inline-attachment mb-2">
                          <img 
                            src={`data:${att.contentType};base64,${att.content}`}
                            alt={att.filename || 'Embedded image'}
                            style={{ maxWidth: '100%', height: 'auto', margin: '0 auto', display: 'block' }}
                          />
                        </div>
                      ))
                    }
                  </div>
                )}
                
                {/* Main email content */}
                {(content.html_content || content.plain_content || content.raw_content) ? (
                  <div className="prose prose-sm max-w-none break-words">
                    <EmailRenderer 
                      content={content.html_content || content.plain_content || content.raw_content || ''}
                      className="text-sm leading-relaxed"
                    />
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No content available</p>
                    <p className="text-xs mt-2">This email content hasn't been cached yet.</p>
                    <p className="text-xs mt-1">Try loading the content or refreshing the email list.</p>
                    <div className="flex gap-2 mt-3">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={async () => {
                          console.log('🔄 Force reloading email content...');
                          await reload(); // This will trigger the API call with IMAP fallback
                        }}
                        disabled={loading}
                      >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        {loading ? 'Loading...' : 'Load Content'}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => window.location.reload()}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh Page
                      </Button>
                    </div>
                  </div>
                )}
              </div>



              {/* Email headers (expandable) */}
              {content.raw_content && (
                <div className="mt-8 border-t pt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowFullHeaders(!showFullHeaders)}
                    className="mb-4"
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    {showFullHeaders ? 'Hide' : 'Show'} Email Headers
                  </Button>
                  
                  {showFullHeaders && (
                    <pre className="text-xs bg-gray-50 p-4 rounded-lg overflow-x-auto">
                      {content.raw_content.split('\n\n')[0]}
                    </pre>
                  )}
                </div>
              )}
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

// CSS for email content styling
const emailContentStyles = `
.email-content {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
}

.email-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.email-content table {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.email-content td, .email-content th {
  border: 1px solid #e5e7eb;
  padding: 12px;
  text-align: left;
}

.email-content th {
  background-color: #f9fafb;
  font-weight: 600;
}

.email-content blockquote {
  border-left: 4px solid #e5e7eb;
  margin: 16px 0;
  padding-left: 16px;
  color: #6b7280;
  font-style: italic;
  background-color: #f9fafb;
  padding: 12px 16px;
  border-radius: 0 6px 6px 0;
}

.email-content a {
  color: #3b82f6;
  text-decoration: underline;
  transition: color 0.2s;
}

.email-content a:hover {
  color: #1d4ed8;
  text-decoration: none;
}

.email-content p {
  margin: 12px 0;
}

.email-content h1, .email-content h2, .email-content h3, .email-content h4, .email-content h5, .email-content h6 {
  margin: 16px 0 8px 0;
  font-weight: 600;
  color: #111827;
}

.email-content ul, .email-content ol {
  margin: 12px 0;
  padding-left: 24px;
}

.email-content li {
  margin: 4px 0;
}

.email-content pre {
  background-color: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  font-size: 13px;
  margin: 16px 0;
}

.email-content code {
  background-color: #f3f4f6;
  border-radius: 3px;
  padding: 2px 4px;
  font-size: 13px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'optimized-email-detail-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = emailContentStyles;
    document.head.appendChild(style);
  }
}
