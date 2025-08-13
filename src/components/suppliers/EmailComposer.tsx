import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from '@/components/email/RichTextEditor';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Wand2, Monitor, Phone, FileText, Maximize2, Minimize2 } from 'lucide-react';
import { Supplier } from '@/types/supplier';

interface EmailComposerProps {
  supplier: Supplier;
  onSendEmail?: (emailData: {
    to: string;
    subject: string;
    body: string;
  }) => Promise<void>;
}

export default function EmailComposer({ supplier, onSendEmail }: EmailComposerProps) {
  const [to, setTo] = useState(supplier.email || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [purpose, setPurpose] = useState('');
  const [additionalContext, setAdditionalContext] = useState('');
  const [tone, setTone] = useState('professional');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'plain'>('desktop');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isRefining, setIsRefining] = useState(false);

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
          draftContext: { tone: tone || 'professional' }
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

  const handleGenerateEmail = async () => {
    if (!purpose) {
      alert('Please specify the purpose of your email');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch('/api/suppliers/compose-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          supplierId: supplier.id,
          purpose,
          additionalContext,
          tone,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate email');
      }

      const data = await response.json();
      setSubject(data.emailDraft.subject);
      setBody(data.emailDraft.body);
      setShowAIOptions(false); // Hide AI options after generating
    } catch (error) {
      console.error('Error generating email:', error);
      alert('Failed to generate email. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (!to || !subject || !body) {
      alert('Please fill in all fields');
      return;
    }

    setIsSending(true);

    try {
      if (onSendEmail) {
        await onSendEmail({ to, subject, body });
        // Clear form after sending
        setSubject('');
        setBody('');
        alert('Email sent successfully!');
      } else {
        // If no send handler is provided, just log the email
        console.log('Email would be sent:', { to, subject, body });
        alert('Email prepared (no send handler provided)');
      }
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
          <CardTitle>Compose Email</CardTitle>
          <button
            onClick={() => setIsFullscreen(v => !v)}
            className="p-1 hover:bg-gray-100 rounded"
            title={isFullscreen ? 'Exit full screen' : 'Full screen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
        <CardDescription>
          Send an email to {supplier.name}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="email">To</Label>
            <Input
              type="email"
              id="email"
              placeholder="Email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              type="text"
              id="subject"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="body">Message</Label>
            <div className="flex items-center justify-end gap-2 mb-2 text-sm">
              <span className="text-gray-500">Preview:</span>
              <button
                className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='desktop' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                onClick={() => setPreviewMode('desktop')}
              >
                <Monitor className="h-3 w-3" /> Desktop
              </button>
              <button
                className={`px-2 py-1 rounded flex items-center gap-1 ${previewMode==='mobile' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
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
                className="w-full border rounded p-3 text-sm text-gray-700 bg-gray-50 h-[200px]"
                value={body.replace(/<[^>]*>/g, '').trim()}
              />
            ) : (
              <div className={previewMode === 'mobile' ? 'max-w-sm mx-auto border rounded' : ''}>
                <RichTextEditor
                  value={body}
                  onChange={setBody}
                  placeholder="Type your message here..."
                  height="200px"
                />
              </div>
            )}
          </div>

          {!showAIOptions ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowAIOptions(true)}
            >
              <Wand2 className="mr-2 h-4 w-4" />
              Use AI to draft email
            </Button>
          ) : (
            <Card className="border-dashed">
              <CardHeader className="py-3">
                <CardTitle className="text-sm">AI Email Assistant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 py-0">
                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="purpose">Email Purpose</Label>
                  <Select value={purpose} onValueChange={setPurpose}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select purpose" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inquiry">Product Inquiry</SelectItem>
                      <SelectItem value="order">Place an Order</SelectItem>
                      <SelectItem value="follow-up">Follow-up</SelectItem>
                      <SelectItem value="pricing">Request Pricing</SelectItem>
                      <SelectItem value="support">Support Request</SelectItem>
                      <SelectItem value="feedback">Provide Feedback</SelectItem>
                      <SelectItem value="introduction">Introduction</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="tone">Email Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="friendly">Friendly</SelectItem>
                      <SelectItem value="formal">Formal</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid w-full items-center gap-1.5">
                  <Label htmlFor="additionalContext">Additional Context</Label>
                  <Textarea
                    id="additionalContext"
                    placeholder="Add any specific details or instructions..."
                    value={additionalContext}
                    onChange={(e) => setAdditionalContext(e.target.value)}
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="secondary"
                    className="w-1/2"
                    onClick={() => setShowAIOptions(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="w-1/2"
                    onClick={handleGenerateEmail}
                    disabled={isGenerating || !purpose}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Draft
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button onClick={handleSendEmail} disabled={isSending || !to || !subject || !body}>
          {isSending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Email
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
