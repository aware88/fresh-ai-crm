'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import RichTextEditor from './RichTextEditor';
import EmailAttachments from './outlook/EmailAttachments';

import EmailAIMonitor from './EmailAIMonitor';
import { 
  Send, 
  Loader2, 
  Maximize2, 
  Minimize2, 
  Paperclip,
  X,
  Save,
  Clock,
  Users,
  Eye,
  EyeOff,
  Palette,
  Type,
  AlignLeft,
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Smile,
  Brain
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  contentType: string;
  size: number;
  file?: File;
  url?: string;
}

interface EmailRecipient {
  email: string;
  name?: string;
}

interface EnhancedEmailComposerProps {
  mode?: 'new' | 'reply' | 'replyAll' | 'forward';
  originalEmail?: {
    subject: string;
    body: string;
    from: string;
    to: string;
    cc?: string;
    attachments?: Attachment[];
  };
  onSend?: (emailData: {
    to: EmailRecipient[];
    cc: EmailRecipient[];
    bcc: EmailRecipient[];
    subject: string;
    body: string;
    attachments: Attachment[];
    isHtml: boolean;
  }) => Promise<void>;
  onSave?: (emailData: any) => Promise<void>;
  onClose?: () => void;
  className?: string;
}

export default function EnhancedEmailComposer({
  mode = 'new',
  originalEmail,
  onSend,
  onSave,
  onClose,
  className
}: EnhancedEmailComposerProps) {
  // Form state
  const [to, setTo] = useState(
    (mode === 'reply' || mode === 'replyAll') ? originalEmail?.from || '' : ''
  );
  const [cc, setCc] = useState(
    mode === 'replyAll' ? originalEmail?.to || '' : ''
  );
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(
    (mode === 'reply' || mode === 'replyAll') ? `Re: ${originalEmail?.subject || ''}` :
    mode === 'forward' ? `Fwd: ${originalEmail?.subject || ''}` : ''
  );
  const [body, setBody] = useState(
    mode === 'forward' ? `\n\n---------- Forwarded message ----------\nFrom: ${originalEmail?.from}\nSubject: ${originalEmail?.subject}\n\n${originalEmail?.body || ''}` :
    (mode === 'reply' || mode === 'replyAll') ? `\n\n---------- Original message ----------\nFrom: ${originalEmail?.from}\nSubject: ${originalEmail?.subject}\n\n${originalEmail?.body || ''}` : ''
  );
  const [attachments, setAttachments] = useState<Attachment[]>(
    mode === 'forward' ? originalEmail?.attachments || [] : []
  );

  // UI state
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRichText, setIsRichText] = useState(true);
  const [enableFollowUp, setEnableFollowUp] = useState(true);
  const [followUpDays, setFollowUpDays] = useState(3);
  const [showPreview, setShowPreview] = useState(false);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high'>('normal');

  const [aiTaskId, setAiTaskId] = useState<string | null>(null);
  const [showAIMonitor, setShowAIMonitor] = useState(false);

  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse email addresses
  const parseEmailAddresses = (emailString: string): EmailRecipient[] => {
    if (!emailString.trim()) return [];
    
    return emailString.split(',').map(email => {
      const trimmed = email.trim();
      const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
      
      if (match) {
        return { name: match[1].trim(), email: match[2].trim() };
      } else {
        return { email: trimmed };
      }
    }).filter(recipient => recipient.email);
  };

  // Handle file attachment
  const handleAttachmentAdd = useCallback((files: File[]) => {
    const newAttachments: Attachment[] = files.map(file => ({
      id: `${Date.now()}-${file.name}`,
      name: file.name,
      contentType: file.type,
      size: file.size,
      file
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const handleAttachmentRemove = useCallback((attachmentId: string) => {
    setAttachments(prev => prev.filter(att => att.id !== attachmentId));
  }, []);

  // Handle file input click
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleAttachmentAdd(Array.from(e.target.files));
      e.target.value = ''; // Reset input
    }
  };

  // Handle send
  const handleSend = async () => {
    if (!to.trim() || !subject.trim() || !body.trim()) {
      alert('Please fill in all required fields (To, Subject, and Message)');
      return;
    }

    setIsSending(true);
    try {
      const emailData = {
        to: parseEmailAddresses(to),
        cc: parseEmailAddresses(cc),
        bcc: parseEmailAddresses(bcc),
        subject,
        body,
        attachments,
        isHtml: isRichText,
        priority
      };

      if (onSend) {
        await onSend(emailData);
      } else {
        // Default send implementation
        const response = await fetch('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: emailData.to.map(r => r.email),
            cc: emailData.cc.map(r => r.email),
            bcc: emailData.bcc.map(r => r.email),
            subject: emailData.subject,
            content: emailData.body,
            contentType: emailData.isHtml ? 'HTML' : 'TEXT',
            attachments: await Promise.all(emailData.attachments.map(async att => ({
              name: att.name,
              contentType: att.contentType,
              contentBytes: att.file ? await fileToBase64(att.file) : undefined
            })))
          })
        });

        if (!response.ok) {
          throw new Error('Failed to send email');
        }

        // Create follow-up if enabled
        if (enableFollowUp) {
          try {
            await fetch('/api/email/followups', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emailId: `sent-${Date.now()}`, // Temporary ID - should be replaced with actual email ID from send response
                originalSubject: subject,
                originalRecipients: emailData.to.map(r => r.email),
                originalSentAt: new Date().toISOString(),
                followUpDays: followUpDays,
                priority: 'medium',
                followUpType: 'manual',
                contextSummary: `Follow-up created for sent email: ${subject}`,
                followUpReason: 'No response received'
              })
            });
          } catch (followUpError) {
            console.error('Failed to create follow-up:', followUpError);
            // Don't fail the email send if follow-up creation fails
          }
        }
      }

      // Clear form after successful send
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setAttachments([]);
      
      if (onClose) onClose();
      
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  // Handle AI draft
  const handleAIDraft = async () => {
    if (!to.trim() || !subject.trim()) {
      alert('Please fill in recipient and subject before generating AI draft');
      return;
    }

    setShowAIMonitor(true);
    setAiTaskId('draft-' + Date.now());

    try {
      // Create a virtual email context for drafting
      const virtualEmailId = `compose-${Date.now()}`;
      
      // Try background processing for instant results
      const response = await fetch('/api/emails/ai-cache', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailId: virtualEmailId,
          forceReprocess: true,
          skipDraft: false,
          emailContent: {
            from: '',
            to: to,
            subject: subject,
            body: body || `Context: Composing new email to ${to} about ${subject}`,
            date: new Date().toISOString()
          }
        }),
      });

      const data = await response.json();

      if (data.success && data.draft) {
        // Use the AI generated draft
        setSubject(data.draft.subject || subject);
        setBody(data.draft.body || body);
        
        // Show success feedback
        console.log('AI draft generated successfully');
      } else {
        console.error('AI draft generation failed:', data.error);
        alert('Failed to generate AI draft. Please try again.');
      }
    } catch (error) {
      console.error('Error generating AI draft:', error);
      alert('Failed to generate AI draft. Please try again.');
    } finally {
      setAiTaskId(null);
      setShowAIMonitor(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    setIsSaving(true);
    try {
      const draftData = {
        to: parseEmailAddresses(to),
        cc: parseEmailAddresses(cc),
        bcc: parseEmailAddresses(bcc),
        subject,
        body,
        attachments,
        isHtml: isRichText,
        priority
      };

      if (onSave) {
        await onSave(draftData);
      } else {
        // Default save implementation
        localStorage.setItem('email-draft', JSON.stringify(draftData));
      }
      
    } catch (error) {
      console.error('Error saving draft:', error);
      alert('Failed to save draft.');
    } finally {
      setIsSaving(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:type;base64, prefix
      };
      reader.onerror = error => reject(error);
    });
  };

  // Calculate total attachment size
  const totalAttachmentSize = attachments.reduce((total, att) => total + att.size, 0);
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`w-full h-full flex flex-col ${isFullscreen ? 'fixed inset-4 z-50 bg-white rounded-lg shadow-lg' : ''} ${className || ''}`}>
      <div className="pb-4 px-4 pt-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle className="text-lg">
              {mode === 'new' ? 'Compose Email' :
               mode === 'reply' ? 'Reply' :
               mode === 'replyAll' ? 'Reply All' :
               mode === 'forward' ? 'Forward' : 'Compose Email'}
            </CardTitle>
            {priority !== 'normal' && (
              <Badge variant={priority === 'high' ? 'destructive' : 'secondary'}>
                {priority} priority
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Create and send professional emails with rich formatting and attachments
        </p>
      </div>

      <div className="space-y-4 flex-1 min-h-0 px-4 pb-4 overflow-y-auto">
        {/* AI Monitor Panel */}
        {showAIMonitor && (
          <EmailAIMonitor
            isActive={!!aiTaskId}
            currentTask="Drafting email response"
            onPause={() => console.log('AI paused')}
            onResume={() => console.log('AI resumed')}
            onStop={() => {
              setAiTaskId(null);
              setShowAIMonitor(false);
            }}
            onIntervene={(step) => console.log('Intervene in step:', step)}
            compact={!isFullscreen}
            className="mb-4"
          />
        )}

        {/* Recipients */}
        <div className="space-y-3">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="to">To *</Label>
            <Input
              id="to"
              type="email"
              placeholder="recipient@example.com, another@example.com"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="flex gap-2 text-sm">
            <button 
              onClick={() => setShowCc(!showCc)}
              className="text-blue-600 hover:underline flex items-center space-x-1"
            >
              <Users className="h-3 w-3" />
              <span>{showCc ? 'Hide Cc' : 'Add Cc'}</span>
            </button>
            <button 
              onClick={() => setShowBcc(!showBcc)}
              className="text-blue-600 hover:underline"
            >
              {showBcc ? 'Hide Bcc' : 'Add Bcc'}
            </button>
            <select 
              value={priority} 
              onChange={(e) => setPriority(e.target.value as any)}
              className="text-xs border rounded px-2 py-1"
            >
              <option value="low">Low Priority</option>
              <option value="normal">Normal Priority</option>
              <option value="high">High Priority</option>
            </select>
          </div>

          {showCc && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="cc">Cc</Label>
              <Input
                id="cc"
                type="email"
                placeholder="cc@example.com"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          {showBcc && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="bcc">Bcc</Label>
              <Input
                id="bcc"
                type="email"
                placeholder="bcc@example.com"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="text-sm"
              />
            </div>
          )}
        </div>

        <Separator />

        {/* Subject */}
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            id="subject"
            type="text"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="text-sm"
          />
        </div>

        <Separator />

        {/* Message Body */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Message *</Label>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRichText(!isRichText)}
                className="text-xs"
              >
                {isRichText ? <Type className="h-3 w-3 mr-1" /> : <AlignLeft className="h-3 w-3 mr-1" />}
                {isRichText ? 'Rich Text' : 'Plain Text'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs"
              >
                {showPreview ? <EyeOff className="h-3 w-3 mr-1" /> : <Eye className="h-3 w-3 mr-1" />}
                {showPreview ? 'Hide Preview' : 'Preview'}
              </Button>
            </div>
          </div>

          {showPreview ? (
            <div className="border rounded-lg p-4 bg-gray-50 min-h-[300px]">
              <div className="text-sm text-gray-600 mb-2">Preview:</div>
              <div 
                className="prose max-w-none"
                dangerouslySetInnerHTML={{ __html: body }}
              />
            </div>
          ) : isRichText ? (
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Compose your email..."
              height="400px"
            />
          ) : (
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Compose your email..."
              className="w-full h-[400px] p-3 border rounded-lg resize-none font-mono text-sm"
            />
          )}
        </div>

        <Separator />

        {/* Attachments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="flex items-center space-x-2">
              <Paperclip className="h-4 w-4" />
              <span>Attachments</span>
              {attachments.length > 0 && (
                <Badge variant="secondary" className="text-xs">
                  {attachments.length} files ({formatFileSize(totalAttachmentSize)})
                </Badge>
              )}
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={handleFileInputClick}
              className="text-xs"
            >
              <Paperclip className="h-3 w-3 mr-1" />
              Add Files
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileInputChange}
          />

          <EmailAttachments
            attachments={attachments}
            messageId="compose"
            readOnly={false}
            onAttachmentAdd={handleAttachmentAdd}
            onAttachmentRemove={handleAttachmentRemove}
          />
        </div>

        <Separator />

        {/* Follow-up Settings */}
        <div className="space-y-3">
          <Label className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Follow-up Settings</span>
          </Label>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="enableFollowUp"
                checked={enableFollowUp}
                onChange={(e) => setEnableFollowUp(e.target.checked)}
                className="rounded border-gray-300"
              />
              <label htmlFor="enableFollowUp" className="text-sm text-gray-700">
                Create follow-up reminder
              </label>
            </div>
            
            {enableFollowUp && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">in</span>
                <select
                  value={followUpDays}
                  onChange={(e) => setFollowUpDays(Number(e.target.value))}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value={1}>1 day</option>
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>1 week</option>
                </select>
                <span className="text-sm text-gray-600">if no response</span>
              </div>
            )}
          </div>
          
          {enableFollowUp && (
            <p className="text-xs text-gray-500">
              You'll be reminded to follow up if no response is received within {followUpDays} day{followUpDays !== 1 ? 's' : ''}.
            </p>
          )}
        </div>

        <Separator />

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>* Required fields</span>
            {totalAttachmentSize > 25 * 1024 * 1024 && (
              <Badge variant="destructive" className="text-xs">
                Attachments exceed 25MB limit
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
              size="sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-3 w-3 mr-1" />
                  Save Draft
                </>
              )}
            </Button>
            
            {/* AI Draft Button */}
            <Button
              variant="outline"
              onClick={handleAIDraft}
              disabled={!to.trim() || !subject.trim() || !!aiTaskId}
              className="min-w-[120px]"
            >
              <Brain className="h-4 w-4 mr-2" />
              {aiTaskId ? 'AI Working...' : 'AI Draft'}
            </Button>

            <Button
              onClick={handleSend}
              disabled={isSending || !to.trim() || !subject.trim() || !body.trim() || totalAttachmentSize > 25 * 1024 * 1024}
              className="min-w-[100px]"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}