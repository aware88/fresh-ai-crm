/**
 * OptimizedEmailDetail Component
 * 
 * Displays full email content loaded on-demand with smart caching
 */

'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useEmailContent } from '@/hooks/useOptimizedEmails';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
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
  EyeOff
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
  const { content, loading, error, reload } = useEmailContent(messageId);
  const [showFullHeaders, setShowFullHeaders] = useState(false);
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
        // Trigger a refresh of the email content and list
        reload();
        window.dispatchEvent(new CustomEvent('emailReadStatusChanged', { 
          detail: { messageId, isRead: !content.is_read } 
        }));
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
      absolute: date.toLocaleString()
    };
  };

  // Render attachment
  const renderAttachment = (attachment: any) => (
    <div key={attachment.filename} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
      <Paperclip className="h-4 w-4 text-gray-400" />
      <span className="text-sm font-medium">{attachment.filename}</span>
      <span className="text-xs text-gray-500">
        ({(attachment.size / 1024).toFixed(1)} KB)
      </span>
    </div>
  );

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
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="h-full flex flex-col"
    >
      <Card className="flex-1">
        <CardHeader className="border-b">
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
                    to {content.recipient_email}
                  </span>
                </div>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span title={dateInfo.absolute}>{dateInfo.relative}</span>
                  </div>
                  
                  {content.content_cached && (
                    <Badge variant="outline" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Cached
                    </Badge>
                  )}
                  
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

        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full">
            <div className="p-6">
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
              <div className="prose prose-sm max-w-none">
                {content.html_content ? (
                  <div 
                    className="email-content"
                    dangerouslySetInnerHTML={{ 
                      __html: content.html_content 
                    }}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                  />
                ) : content.plain_content ? (
                  <pre className="whitespace-pre-wrap font-sans text-sm">
                    {content.plain_content}
                  </pre>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No content available</p>
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
          </ScrollArea>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// CSS for email content styling
const emailContentStyles = `
.email-content {
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
}

.email-content img {
  max-width: 100%;
  height: auto;
}

.email-content table {
  border-collapse: collapse;
  width: 100%;
}

.email-content td, .email-content th {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}

.email-content blockquote {
  border-left: 4px solid #ddd;
  margin: 16px 0;
  padding-left: 16px;
  color: #666;
}

.email-content a {
  color: #3b82f6;
  text-decoration: underline;
}

.email-content a:hover {
  text-decoration: none;
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
