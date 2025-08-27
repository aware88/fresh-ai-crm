import React, { useState } from 'react';
import { Monitor, Phone, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import RichTextEditor from './RichTextEditor';

export default function EmailComposer() {
  const [to, setTo] = useState('');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'plain'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);
  const [isRichText, setIsRichText] = useState(true);

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
    } catch (e: any) {
      alert(`Refine failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsRefining(false);
    }
  };

  const handleSendEmail = async () => {
    if (!to || !subject || !body) {
      alert('Please fill in all required fields (To, Subject, and Body)');
      return;
    }

    setIsSending(true);

    try {
      // Here you would implement the actual email sending logic
      // For now, we'll just simulate sending
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Clear form after sending
      setTo('');
      setCc('');
      setBcc('');
      setSubject('');
      setBody('');
      setShowCc(false);
      setShowBcc(false);
      
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className={`w-full ${isFullscreen ? 'fixed inset-4 z-50 max-w-none mx-0' : ''}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Compose New Email</CardTitle>
          <button
            onClick={() => setIsFullscreen(v => !v)}
            className="p-1 hover:bg-gray-100 rounded"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <CardDescription>
          Create and send a new email with rich text formatting
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="to">To *</Label>
          <Input
            type="email"
            id="to"
            placeholder="recipient@example.com"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="flex gap-2 text-sm">
          <button 
            onClick={() => setShowCc(!showCc)}
            className="text-blue-600 hover:underline"
          >
            {showCc ? 'Hide Cc' : 'Add Cc'}
          </button>
          <button 
            onClick={() => setShowBcc(!showBcc)}
            className="text-blue-600 hover:underline"
          >
            {showBcc ? 'Hide Bcc' : 'Add Bcc'}
          </button>
        </div>

        {showCc && (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="cc">Cc</Label>
            <Input
              type="email"
              id="cc"
              placeholder="cc@example.com"
              value={cc}
              onChange={(e) => setCc(e.target.value)}
            />
          </div>
        )}

        {showBcc && (
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="bcc">Bcc</Label>
            <Input
              type="email"
              id="bcc"
              placeholder="bcc@example.com"
              value={bcc}
              onChange={(e) => setBcc(e.target.value)}
            />
          </div>
        )}

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="subject">Subject *</Label>
          <Input
            type="text"
            id="subject"
            placeholder="Enter email subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          />
        </div>

        <div className="grid w-full items-center gap-1.5">
          <Label htmlFor="body">Message *</Label>
          <div className="flex items-center justify-end gap-2 mb-2 text-sm">
            <span className="text-gray-500">Preview:</span>
            <button
              className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='desktop' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              onClick={() => setPreviewMode('desktop')}
            >
              <Monitor className="h-3 w-3" /> Desktop
            </button>
            <button
              className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='mobile' ? 'bg-gray-2 00' : 'hover:bg-gray-100'}`}
              onClick={() => setPreviewMode('mobile')}
            >
              <Phone className="h-3 w-3" /> Mobile
            </button>
            <button
              className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='plain' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
              onClick={() => setPreviewMode('plain')}
            >
              <FileText className="h-3 w-3" /> Plain
            </button>
          </div>
          {/* Quick AI refine */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-xs">
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
                onClick={() => handleRefine('Improve clarity and fix grammar without changes')}
              >Clarity</button>
              <button
                disabled={isRefining}
                className="px-2 py-1 rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
                onClick={() => handleRefine('Match a professional tone')}
              >Tone</button>
            </div>
            <button
              onClick={() => setIsRichText(!isRichText)}
              className="px-2 py-1 rounded bg-blue-100 hover:bg-blue-200 text-xs text-blue-700"
            >
              {isRichText ? 'Rich Text' : 'Plain Text'}
            </button>
          </div>
          {previewMode === 'plain' ? (
            <textarea
              readOnly
              className="w-full border rounded p-3 text-sm text-gray-700 bg-gray-50 h-[400px]"
              value={body.replace(/<[^>]*>/g, '').trim()}
            />
          ) : (
            <div className={previewMode === 'mobile' ? 'max-w-sm mx-auto border rounded' : ''}>
              {isRichText ? (
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
                  className="w-full h-[400px] p-3 border rounded-md resize-none font-mono text-sm"
                  rows={20}
                />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-500">
            * Required fields
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setTo('');
                setCc('');
                setBcc('');
                setSubject('');
                setBody('');
                setShowCc(false);
                setShowBcc(false);
              }}
            >
              Clear
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={isSending || !to || !subject || !body}
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Email
                </>
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 