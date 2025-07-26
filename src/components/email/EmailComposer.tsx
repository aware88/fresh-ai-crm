import React, { useState } from 'react';
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
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Compose New Email</CardTitle>
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
          <RichTextEditor
            value={body}
            onChange={setBody}
            placeholder="Compose your email with rich text formatting..."
            height="400px"
          />
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