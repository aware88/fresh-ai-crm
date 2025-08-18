'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import EnhancedEmailComposer from './EnhancedEmailComposer';
import EnhancedEmailViewer from './EnhancedEmailViewer';
import { 
  Mail, 
  Edit, 
  Eye, 
  Paperclip,
  Languages,
  Palette,
  Type,
  Image,
  Link,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  List,
  Quote
} from 'lucide-react';

export default function EnhancedEmailDemo() {
  const [activeTab, setActiveTab] = useState('composer');
  const [showComposer, setShowComposer] = useState(false);
  const [composerMode, setComposerMode] = useState<'new' | 'reply' | 'forward'>('new');

  // Sample email data for viewer demo
  const sampleEmail = {
    id: 'demo-email-1',
    subject: 'Welcome to Enhanced Email Experience! 🚀',
    body: {
      contentType: 'text/html',
      content: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #1a73e8; margin-bottom: 20px;">Welcome to the Future of Email!</h2>
          
          <p>Dear User,</p>
          
          <p>We're excited to introduce you to our <strong>enhanced email experience</strong> that brings <em>Gmail and Outlook-level functionality</em> directly to your application.</p>
          
          <h3 style="color: #34a853; margin-top: 25px;">✨ Key Features:</h3>
          <ul style="margin: 15px 0; padding-left: 20px;">
            <li><strong>Rich Text Editing</strong> - Bold, italic, colors, fonts, and more</li>
            <li><strong>Smart Attachments</strong> - Drag & drop, preview, and download</li>
            <li><strong>Professional Formatting</strong> - Headers, lists, quotes, and links</li>
            <li><strong>Email Templates</strong> - Pre-designed layouts for common use cases</li>
            <li><strong>Multi-language Support</strong> - Compose in any language</li>
          </ul>
          
          <blockquote style="border-left: 4px solid #4285f4; padding: 12px 16px; margin: 20px 0; background: #f8f9fa; border-radius: 4px;">
            <p style="margin: 0; color: #5f6368; font-style: italic;">
              "This email composer rivals the best email clients available today. The rich text editing is smooth and intuitive!"
            </p>
          </blockquote>
          
          <p>Try out the different features:</p>
          <ol style="margin: 15px 0; padding-left: 20px;">
            <li>Use the <strong>rich text toolbar</strong> to format your content</li>
            <li>Add <strong>attachments</strong> by dragging files or clicking the attach button</li>
            <li>Switch between <strong>rich text and plain text</strong> modes</li>
            <li>Preview your email before sending</li>
            <li>Save drafts for later editing</li>
          </ol>
          
          <p style="margin-top: 30px;">
            <a href="#" style="background: #1a73e8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Get Started Now
            </a>
          </p>
          
          <p style="margin-top: 30px; color: #666; font-size: 14px;">
            Best regards,<br>
            <strong>The Enhanced Email Team</strong><br>
            <em>Building the future of communication</em>
          </p>
        </div>
      `
    },
    receivedDateTime: new Date().toISOString(),
    from: {
      emailAddress: {
        name: 'Enhanced Email Team',
        address: 'team@enhancedemail.com'
      }
    },
    toRecipients: [
      {
        emailAddress: {
          name: 'Demo User',
          address: 'demo@example.com'
        }
      }
    ],
    ccRecipients: [
      {
        emailAddress: {
          name: 'Support Team',
          address: 'support@enhancedemail.com'
        }
      }
    ],
    hasAttachments: true,
    attachments: [
      {
        id: 'att-1',
        name: 'Welcome_Guide.pdf',
        contentType: 'application/pdf',
        size: 1024 * 500, // 500KB
        url: '#'
      },
      {
        id: 'att-2',
        name: 'Feature_Screenshots.zip',
        contentType: 'application/zip',
        size: 1024 * 1024 * 2, // 2MB
        url: '#'
      },
      {
        id: 'att-3',
        name: 'Logo.png',
        contentType: 'image/png',
        size: 1024 * 150, // 150KB
        url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      }
    ],
    isRead: true,
    importance: 'normal' as const
  };

  const handleSendEmail = async (emailData: any) => {
    console.log('Sending email:', emailData);
    // Simulate sending
    await new Promise(resolve => setTimeout(resolve, 2000));
    alert('Email sent successfully! (Demo mode)');
    setShowComposer(false);
  };

  const handleSaveDraft = async (draftData: any) => {
    console.log('Saving draft:', draftData);
    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    alert('Draft saved! (Demo mode)');
  };

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">📧 Enhanced Email Experience</h1>
        <p className="text-gray-600 text-lg">
          Gmail & Outlook-level functionality with rich text editing and smart attachments
        </p>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Type className="h-4 w-4 text-blue-600" />
              <span>Rich Text Editing</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs"><Bold className="h-2 w-2 mr-1" />Bold</Badge>
              <Badge variant="outline" className="text-xs"><Italic className="h-2 w-2 mr-1" />Italic</Badge>
              <Badge variant="outline" className="text-xs"><Underline className="h-2 w-2 mr-1" />Underline</Badge>
              <Badge variant="outline" className="text-xs"><Palette className="h-2 w-2 mr-1" />Colors</Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs"><AlignLeft className="h-2 w-2 mr-1" />Align</Badge>
              <Badge variant="outline" className="text-xs"><List className="h-2 w-2 mr-1" />Lists</Badge>
              <Badge variant="outline" className="text-xs"><Quote className="h-2 w-2 mr-1" />Quotes</Badge>
              <Badge variant="outline" className="text-xs"><Link className="h-2 w-2 mr-1" />Links</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Paperclip className="h-4 w-4 text-green-600" />
              <span>Smart Attachments</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p>• Drag & drop file upload</p>
            <p>• File type detection & icons</p>
            <p>• Size validation & progress</p>
            <p>• Preview & download options</p>
            <p>• Multiple file support</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Languages className="h-4 w-4 text-purple-600" />
              <span>Professional Features</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs space-y-2">
            <p>• Priority levels (High/Normal/Low)</p>
            <p>• CC/BCC support</p>
            <p>• Draft saving & auto-save</p>
            <p>• Email preview mode</p>
            <p>• Print & export options</p>
          </CardContent>
        </Card>
      </div>

      {/* Demo Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="composer" className="flex items-center space-x-2">
            <Edit className="h-4 w-4" />
            <span>Email Composer</span>
          </TabsTrigger>
          <TabsTrigger value="viewer" className="flex items-center space-x-2">
            <Eye className="h-4 w-4" />
            <span>Email Viewer</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="composer" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Composer Demo</h3>
            <div className="flex space-x-2">
              <Button 
                onClick={() => {
                  setComposerMode('new');
                  setShowComposer(true);
                }}
                variant={composerMode === 'new' ? 'default' : 'outline'}
              >
                <Mail className="h-4 w-4 mr-2" />
                New Email
              </Button>
              <Button 
                onClick={() => {
                  setComposerMode('reply');
                  setShowComposer(true);
                }}
                variant={composerMode === 'reply' ? 'default' : 'outline'}
              >
                Reply
              </Button>
              <Button 
                onClick={() => {
                  setComposerMode('forward');
                  setShowComposer(true);
                }}
                variant={composerMode === 'forward' ? 'default' : 'outline'}
              >
                Forward
              </Button>
            </div>
          </div>

          {showComposer ? (
            <EnhancedEmailComposer
              mode={composerMode}
              originalEmail={composerMode !== 'new' ? {
                subject: sampleEmail.subject,
                body: sampleEmail.body.content,
                from: sampleEmail.from.emailAddress.address,
                to: sampleEmail.toRecipients[0].emailAddress.address,
                attachments: composerMode === 'forward' ? sampleEmail.attachments : undefined
              } : undefined}
              onSend={handleSendEmail}
              onSave={handleSaveDraft}
              onClose={() => setShowComposer(false)}
            />
          ) : (
            <Card className="p-8 text-center">
              <Mail className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h4 className="text-lg font-medium mb-2">Ready to Compose</h4>
              <p className="text-gray-600 mb-4">
                Click one of the buttons above to start composing an email with full rich text editing capabilities.
              </p>
              <Button onClick={() => {
                setComposerMode('new');
                setShowComposer(true);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Start Composing
              </Button>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="viewer" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Email Viewer Demo</h3>
            <Badge variant="secondary">
              Sample email with attachments
            </Badge>
          </div>

          <EnhancedEmailViewer
            email={sampleEmail}
            onReply={() => {
              setComposerMode('reply');
              setActiveTab('composer');
              setShowComposer(true);
            }}
            onReplyAll={() => {
              setComposerMode('reply');
              setActiveTab('composer');
              setShowComposer(true);
            }}
            onForward={() => {
              setComposerMode('forward');
              setActiveTab('composer');
              setShowComposer(true);
            }}
            onDelete={() => alert('Delete action (demo mode)')}
            onArchive={() => alert('Archive action (demo mode)')}
            onFlag={() => alert('Flag action (demo mode)')}
            onStar={() => alert('Star action (demo mode)')}
          />
        </TabsContent>
      </Tabs>

      {/* Technical Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">🔧 Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Rich Text Editor Features:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• React Quill integration with custom toolbar</li>
                <li>• Gmail-style formatting options</li>
                <li>• Font selection and sizing</li>
                <li>• Text and background colors</li>
                <li>• Headers, lists, and alignment</li>
                <li>• Links and image embedding</li>
                <li>• Code blocks and quotes</li>
                <li>• Clean HTML output</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Attachment System:</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Drag & drop file upload</li>
                <li>• File type detection and icons</li>
                <li>• Size validation (25MB limit)</li>
                <li>• Upload progress indicators</li>
                <li>• Preview for images</li>
                <li>• Download and save options</li>
                <li>• Multiple file selection</li>
                <li>• Base64 encoding for API</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}