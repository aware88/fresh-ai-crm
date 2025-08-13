'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { X, Send, Paperclip, ChevronDown, Maximize2, Minimize2, Phone, Monitor, FileText } from 'lucide-react';
import EmailAttachments from './EmailAttachments';
import EmailSignature from './EmailSignature';
import EmailLanguageDetection from './EmailLanguageDetection';
// import RichTextEditor from '../RichTextEditor'; // Temporarily disabled due to React 18 compatibility

interface EmailComposeProps {
  mode: 'new' | 'reply' | 'replyAll' | 'forward';
  originalEmail?: any; // Original email for reply/forward
  onClose: () => void;
  onSend: (email: any) => Promise<void>;
}

export default function EmailCompose({ mode, originalEmail, onClose, onSend }: EmailComposeProps) {
  const { data: session } = useSession();
  const [to, setTo] = useState<string>('');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('');
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [attachments, setAttachments] = useState<any[]>([]);
  const [showCc, setShowCc] = useState<boolean>(false);
  const [showBcc, setShowBcc] = useState<boolean>(false);
  const [sending, setSending] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showSignatureSelector, setShowSignatureSelector] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'plain'>('desktop');
  const [isRefining, setIsRefining] = useState<boolean>(false);
  
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  // Initialize email based on mode
  useEffect(() => {
    if (originalEmail && mode !== 'new') {
      // Set up reply/forward
      if (mode === 'reply') {
        setTo(originalEmail.from.emailAddress.address);
        setSubject(`RE: ${originalEmail.subject}`);
        setBody(`\n\n-------- Original Message --------\nFrom: ${originalEmail.from.emailAddress.address}\nDate: ${new Date(originalEmail.receivedDateTime).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body.content}`);
      } else if (mode === 'replyAll') {
        const allRecipients = [
          originalEmail.from.emailAddress.address,
          ...originalEmail.toRecipients
            .filter((r: any) => r.emailAddress.address !== session?.user?.email)
            .map((r: any) => r.emailAddress.address)
        ];
        setTo(allRecipients.join('; '));
        
        if (originalEmail.ccRecipients?.length > 0) {
          setCc(originalEmail.ccRecipients.map((r: any) => r.emailAddress.address).join('; '));
          setShowCc(true);
        }
        
        setSubject(`RE: ${originalEmail.subject}`);
        setBody(`\n\n-------- Original Message --------\nFrom: ${originalEmail.from.emailAddress.address}\nDate: ${new Date(originalEmail.receivedDateTime).toLocaleString()}\nSubject: ${originalEmail.subject}\n\n${originalEmail.body.content}`);
      } else if (mode === 'forward') {
        setSubject(`FW: ${originalEmail.subject}`);
        setBody(`\n\n-------- Forwarded Message --------\nFrom: ${originalEmail.from.emailAddress.address}\nDate: ${new Date(originalEmail.receivedDateTime).toLocaleString()}\nSubject: ${originalEmail.subject}\nTo: ${originalEmail.toRecipients.map((r: any) => r.emailAddress.address).join('; ')}\n\n${originalEmail.body.content}`);
        
        // Add original attachments if any
        if (originalEmail.attachments?.length > 0) {
          setAttachments(originalEmail.attachments);
        }
      }
    }
  }, [mode, originalEmail, session]);

  const handleSend = async () => {
    if (!to.trim()) {
      setError('Please specify at least one recipient');
      return;
    }

    if (!subject.trim()) {
      setError('Please specify a subject');
      return;
    }

    try {
      setSending(true);
      setError(null);
      
      const emailData = {
        to: to.split(';').map(email => email.trim()).filter(email => email),
        cc: cc ? cc.split(';').map(email => email.trim()).filter(email => email) : [],
        bcc: bcc ? bcc.split(';').map(email => email.trim()).filter(email => email) : [],
        subject,
        body,
        attachments,
        importance: 'normal',
      };
      
      await onSend(emailData);
      onClose();
    } catch (err: any) {
      console.error('Failed to send email:', err);
      setError(err.message || 'Failed to send email. Please try again.');
      setSending(false);
    }
  };

  const handleAttachmentAdd = (files: File[]) => {
    const newAttachments = Array.from(files).map(file => ({
      id: `attachment-${Date.now()}-${file.name}`,
      name: file.name,
      contentType: file.type,
      size: file.size,
      file
    }));
    
    setAttachments([...attachments, ...newAttachments]);
  };

  const handleAttachmentRemove = (attachmentId: string) => {
    setAttachments(attachments.filter(att => att.id !== attachmentId));
  };

  const handleRefine = async (command: string) => {
    if (!body.trim()) return;
    try {
      setIsRefining(true);
      const resp = await fetch('/api/emails/ai-refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailId: '',
          originalEmail: { subject, from: '' },
          currentSubject: subject,
          currentBody: body,
          refinementCommand: command,
          draftContext: { tone: 'professional' }
        })
      });
      if (!resp.ok) {
        const e = await resp.json().catch(() => ({}));
        throw new Error(e.error || resp.statusText);
      }
      const data = await resp.json();
      setSubject(data.subject || subject);
      setBody(data.body || body);
    } catch (e:any) {
      alert(`Refine failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSignatureSelect = (signatureHtml: string) => {
    // Insert signature at cursor position or at the end
    if (bodyRef.current) {
      const cursorPosition = bodyRef.current.selectionStart;
      const textBefore = body.substring(0, cursorPosition);
      const textAfter = body.substring(cursorPosition);
      
      setBody(`${textBefore}\n${signatureHtml}\n${textAfter}`);
    } else {
      setBody(`${body}\n${signatureHtml}`);
    }
    
    setShowSignatureSelector(false);
  };

  return (
    <div className={`email-compose bg-white rounded-lg shadow-lg border p-4 ${isFullscreen ? 'fixed inset-4 z-50 max-w-none mx-0' : 'max-w-4xl mx-auto'}`}>
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-semibold">
          {mode === 'new' && 'New Message'}
          {mode === 'reply' && 'Reply'}
          {mode === 'replyAll' && 'Reply All'}
          {mode === 'forward' && 'Forward'}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsFullscreen(v => !v)}
            className="p-1 hover:bg-gray-100 rounded"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="space-y-3">
        <div className="flex items-center">
          <label className="w-16 text-gray-600">To:</label>
          <input 
            type="text" 
            value={to} 
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
            placeholder="email@example.com; another@example.com"
          />
        </div>
        
        {showCc && (
          <div className="flex items-center">
            <label className="w-16 text-gray-600">Cc:</label>
            <input 
              type="text" 
              value={cc} 
              onChange={(e) => setCc(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
              placeholder="email@example.com; another@example.com"
            />
          </div>
        )}
        
        {showBcc && (
          <div className="flex items-center">
            <label className="w-16 text-gray-600">Bcc:</label>
            <input 
              type="text" 
              value={bcc} 
              onChange={(e) => setBcc(e.target.value)}
              className="flex-1 px-2 py-1 border rounded"
              placeholder="email@example.com; another@example.com"
            />
          </div>
        )}
        
        <div className="flex items-center text-sm">
          <div className="w-16"></div>
          <button 
            onClick={() => setShowCc(!showCc)}
            className="text-blue-600 hover:underline mr-3"
          >
            {showCc ? 'Hide Cc' : 'Show Cc'}
          </button>
          <button 
            onClick={() => setShowBcc(!showBcc)}
            className="text-blue-600 hover:underline"
          >
            {showBcc ? 'Hide Bcc' : 'Show Bcc'}
          </button>
        </div>
        
        <div className="flex items-center">
          <label className="w-16 text-gray-600">Subject:</label>
          <input 
            type="text" 
            value={subject} 
            onChange={(e) => setSubject(e.target.value)}
            className="flex-1 px-2 py-1 border rounded"
          />
        </div>
        
        <div className="pt-2">
          {/* Preview mode toggle */}
          <div className="flex items-center justify-end gap-2 mb-2 text-sm">
            <span className="text-gray-500">Preview:</span>
            <button
              className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='desktop' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              onClick={() => setPreviewMode('desktop')}
              title="Desktop preview"
            >
              <Monitor size={14} /> Desktop
            </button>
            <button
              className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='mobile' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              onClick={() => setPreviewMode('mobile')}
              title="Mobile preview"
            >
              <Phone size={14} /> Mobile
            </button>
            <button
              className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='plain' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              onClick={() => setPreviewMode('plain')}
              title="Plain text preview"
            >
              <FileText size={14} /> Plain
            </button>
          </div>

          {/* Quick AI refine buttons */}
          <div className="flex items-center justify-end gap-2 mb-2 text-xs">
            <span className="text-gray-500">AI:</span>
            <button
              disabled={isRefining}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => handleRefine('Make this more concise')}
            >Shorten</button>
            <button
              disabled={isRefining}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => handleRefine('Expand with more detail where useful')}
            >Expand</button>
            <button
              disabled={isRefining}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => handleRefine('Improve clarity and fix grammar without changing meaning')}
            >Clarity</button>
            <button
              disabled={isRefining}
              className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
              onClick={() => handleRefine('Match a professional tone')}
            >Tone</button>
          </div>

          {previewMode === 'plain' ? (
            <textarea
              readOnly
              className="w-full border rounded p-3 text-sm text-gray-700 bg-gray-50 h-[300px]"
              value={body.replace(/<[^>]*>/g, '').trim()}
            />
          ) : (
            <div className={previewMode === 'mobile' ? 'max-w-sm mx-auto border rounded' : ''}>
              <textarea
                value={body} 
                onChange={(e) => setBody(e.target.value)}
                placeholder="Compose your email..."
                className="w-full h-[300px] p-3 border rounded-md resize-none font-mono text-sm"
                rows={15}
              />
            </div>
          )}
        </div>
        
        {/* Language detection */}
        {body.length > 20 && (
          <div className="text-right">
            <EmailLanguageDetection content={body} />
          </div>
        )}
        
        {/* Attachments */}
        <div className="pt-2">
          <EmailAttachments 
            attachments={attachments}
            messageId="new-email"
            readOnly={false}
            onAttachmentAdd={handleAttachmentAdd}
            onAttachmentRemove={handleAttachmentRemove}
          />
        </div>
        
        <div className="flex justify-between pt-4 border-t mt-4">
          <div className="flex space-x-2">
            <button
              onClick={() => setShowSignatureSelector(!showSignatureSelector)}
              className="flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm"
            >
              Signature <ChevronDown size={16} className="ml-1" />
            </button>
            
            {showSignatureSelector && (
              <div className="absolute mt-10 bg-white border rounded-lg shadow-lg p-4 z-10">
                <EmailSignature onSelect={handleSignatureSelect} />
              </div>
            )}
          </div>
          
          <button
            onClick={handleSend}
            disabled={sending}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded disabled:bg-gray-400"
          >
            {sending ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                Sending...
              </>
            ) : (
              <>
                <Send size={16} className="mr-2" />
                Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
