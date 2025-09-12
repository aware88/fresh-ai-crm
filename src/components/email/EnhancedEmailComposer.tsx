'use client';

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
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
    sender_name?: string;
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
  // Compute initial values based on mode and originalEmail
  const initialValues = useMemo(() => {
    console.log('🎯 Computing initial values:', { mode, originalEmail });
    
    let to = '';
    let cc = '';
    let subject = '';
    let body = '';
    let attachments: Attachment[] = [];
    
    if (originalEmail && mode !== 'new') {
      // Reply or Reply All - TO field should have the original sender
      if (mode === 'reply' || mode === 'replyAll') {
        to = originalEmail.from || '';
      }
      
      // Reply All - CC field should have original recipients
      if (mode === 'replyAll') {
        const ccList = [];
        if (originalEmail.to) ccList.push(originalEmail.to);
        if (originalEmail.cc) ccList.push(originalEmail.cc);
        cc = ccList.filter(Boolean).join(', ');
      }
      
      // Subject with prefix
      if (originalEmail.subject) {
        const subj = originalEmail.subject.trim();
        if (mode === 'reply' || mode === 'replyAll') {
          subject = subj.startsWith('Re: ') ? subj : `Re: ${subj}`;
        } else if (mode === 'forward') {
          subject = subj.startsWith('Fwd: ') ? subj : `Fwd: ${subj}`;
          attachments = originalEmail.attachments || [];
        }
      }
      
      // Body with quoted original
      if (originalEmail.body || originalEmail.subject) {
        const fromName = originalEmail.sender_name || originalEmail.from || 'Unknown';
        const separator = mode === 'forward' ? 'Forwarded message' : 'Original message';
        
        // Create a properly formatted quoted message
        body = `\n\n---------- ${separator} ----------\n` +
               `From: ${fromName}\n` +
               `To: ${originalEmail.to || 'Unknown'}\n` +
               `Subject: ${originalEmail.subject || 'No Subject'}\n\n` +
               `${originalEmail.body || ''}`;
      }
    }
    
    console.log('📧 Initial values computed:', { to, cc, subject, body: body.substring(0, 100) });
    return { to, cc, subject, body, attachments };
  }, [mode, originalEmail]);
  
  // Form state - initialize with computed values
  const [to, setTo] = useState(initialValues.to);
  const [cc, setCc] = useState(initialValues.cc);
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(initialValues.subject);
  const [body, setBody] = useState(initialValues.body);
  const [attachments, setAttachments] = useState<Attachment[]>(initialValues.attachments);
  
  // Update state when initial values change
  useEffect(() => {
    console.log('📧 Updating form with new initial values');
    setTo(initialValues.to);
    setCc(initialValues.cc);
    setSubject(initialValues.subject);
    setBody(initialValues.body);
    setAttachments(initialValues.attachments);
  }, [initialValues]);

  // UI state
  const [showCc, setShowCc] = useState(!!initialValues.cc);
  const [showBcc, setShowBcc] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showEmailAnalysis, setShowEmailAnalysis] = useState(false);
  const [isAIAssisting, setIsAIAssisting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [showScheduler, setShowScheduler] = useState(false);
  const [scheduleTime, setScheduleTime] = useState<Date | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse email addresses
  const parseEmails = (emailString: string): EmailRecipient[] => {
    if (!emailString.trim()) return [];
    
    return emailString.split(/[,;]/).map(email => {
      const trimmed = email.trim();
      const match = trimmed.match(/^(.+?)\s*<(.+?)>$/);
      if (match) {
        return { name: match[1], email: match[2] };
      }
      return { email: trimmed };
    }).filter(recipient => recipient.email);
  };

  // Handle send
  const handleSend = async () => {
    if (!onSend) return;
    
    setIsSending(true);
    try {
      await onSend({
        to: parseEmails(to),
        cc: parseEmails(cc),
        bcc: parseEmails(bcc),
        subject,
        body,
        attachments,
        isHtml: true
      });
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  // Handle save draft
  const handleSaveDraft = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave({
        to: parseEmails(to),
        cc: parseEmails(cc),
        bcc: parseEmails(bcc),
        subject,
        body,
        attachments,
        isHtml: true,
        isDraft: true
      });
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle file attachments
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;
    
    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      name: file.name,
      contentType: file.type,
      size: file.size,
      file
    }));
    
    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <CardTitle className="text-lg">
          {mode === 'reply' && 'Reply'}
          {mode === 'replyAll' && 'Reply All'}
          {mode === 'forward' && 'Forward'}
          {mode === 'new' && 'New Message'}
        </CardTitle>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              title="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Form Fields */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* To Field */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="to">To</Label>
              <div className="flex gap-1">
                {!showCc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCc(true)}
                    className="h-6 text-xs"
                  >
                    Cc
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowBcc(true)}
                    className="h-6 text-xs"
                  >
                    Bcc
                  </Button>
                )}
              </div>
            </div>
            <Input
              id="to"
              type="email"
              placeholder="Recipients"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Cc Field */}
          {showCc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="cc">Cc</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCc(false);
                    setCc('');
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                id="cc"
                type="email"
                placeholder="Cc recipients"
                value={cc}
                onChange={(e) => setCc(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Bcc Field */}
          {showBcc && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="bcc">Bcc</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowBcc(false);
                    setBcc('');
                  }}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <Input
                id="bcc"
                type="email"
                placeholder="Bcc recipients"
                value={bcc}
                onChange={(e) => setBcc(e.target.value)}
                className="w-full"
              />
            </div>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Rich Text Editor */}
          <div className="space-y-2">
            <Label>Message</Label>
            <RichTextEditor
              value={body}
              onChange={setBody}
              placeholder="Compose your email..."
              height="400px"
            />
          </div>

          {/* Attachments */}
          {attachments.length > 0 && (
            <div className="space-y-2">
              <Label>Attachments</Label>
              <div className="flex flex-wrap gap-2">
                {attachments.map(attachment => (
                  <Badge key={attachment.id} variant="secondary" className="flex items-center gap-1 pr-1">
                    <Paperclip className="h-3 w-3" />
                    <span className="text-xs">{attachment.name}</span>
                    <span className="text-xs text-gray-500">({formatFileSize(attachment.size)})</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                      className="h-4 w-4 p-0 ml-1"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || !to}
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