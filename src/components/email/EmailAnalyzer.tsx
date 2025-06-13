'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Copy, Check, Mail, Brain, Sparkles, Send, Trash2, UserPlus, AlertCircle, Globe, Link } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { updateContactPersonalityFromEmail } from '@/lib/contacts/personality';

export function EmailAnalyzer() {
  const [inputMode, setInputMode] = useState<'email' | 'url'>('email');
  const [emailContent, setEmailContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlList, setUrlList] = useState<string[]>([]);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtractingContact, setIsExtractingContact] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [contactExtracted, setContactExtracted] = useState(false);
  const emailTextRef = useRef<HTMLDivElement>(null);

  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      setError('Please enter a URL');
      return;
    }
    
    // Basic URL validation
    let formattedUrl = urlInput.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = 'https://' + formattedUrl;
    }
    
    setUrlList(prev => [...prev, formattedUrl]);
    setUrlInput('');
    setError(null);
  };
  
  const handleRemoveUrl = (index: number) => {
    setUrlList(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleClearUrls = () => {
    setUrlList([]);
  };
  
  const handleAnalyzeClick = async () => {
    if (inputMode === 'email' && !emailContent.trim()) {
      setError('Please enter an email to analyze');
      return;
    }
    
    if (inputMode === 'url' && urlList.length === 0) {
      setError('Please add at least one URL to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedEmail(null);
    setCopied(false);
    setContactExtracted(false);

    try {
      let response;
      
      if (inputMode === 'email') {
        // Try to extract sender email from the content for contact updating
        const emailRegex = /From:\s*["']?([^"'<>\s]+@[^"'<>\s]+\.[^"'<>\s]+)/i;
        const fromMatch = emailContent.match(emailRegex);
        const senderEmail = fromMatch ? fromMatch[1].trim() : null;
        
        response = await fetch('/api/analyze-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ emailContent }),
        });
        
        // If we found a sender email, update their personality profile in the background
        if (senderEmail) {
          try {
            // Don't await this - let it run in the background
            updateContactPersonalityFromEmail(senderEmail, emailContent)
              .then(updated => {
                if (updated) {
                  toast({
                    title: "Contact Updated",
                    description: `Personality profile for ${senderEmail} has been updated based on this email analysis.`,
                    variant: "default"
                  });
                }
              })
              .catch(err => console.error('Error updating contact personality:', err));
          } catch (err) {
            console.error('Error updating contact personality:', err);
          }
        }
      } else {
        // For URL analysis, we'll analyze the first URL in the list for now
        // In a more advanced implementation, you could analyze multiple URLs together
        response = await fetch('/api/analyze-url', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: urlList[0] }),
        });
      }

      if (!response.ok) {
        throw new Error(`Failed to analyze ${inputMode === 'email' ? 'email' : 'URL'}`);
      }

      const data = await response.json();
      setAnalysis(data.analysis);
      
      // Extract suggested email from the analysis
      const emailMatch = data.analysis.match(/\*\*✉️ Suggested Response:\*\*([\s\S]*?)(?:\*\*|$)/);
      if (emailMatch && emailMatch[1]) {
        // Clean up the extracted email text
        const cleanedEmail = emailMatch[1].trim();
        setSuggestedEmail(cleanedEmail);
      } else {
        setSuggestedEmail(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle extracting contact from email
  const handleExtractContact = async () => {
    if (inputMode !== 'email' || !emailContent.trim()) {
      setError('Contact extraction is only available for email analysis');
      return;
    }
    
    setIsExtractingContact(true);
    setError(null);
    
    try {
      const response = await fetch('/api/contacts/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          emailContent,
          personalityAnalysis: analysis || ''
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract contact');
      }
      
      setContactExtracted(true);
      
      toast({
        title: 'Contact ' + (data.message.includes('updated') ? 'Updated' : 'Saved'),
        description: data.message,
        action: data.contactId ? (
          <ToastAction>
            <a href={`/dashboard/contacts?id=${data.contactId}`}>View Contact</a>
          </ToastAction>
        ) : undefined,
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract contact');
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to extract contact',
      });
    } finally {
      setIsExtractingContact(false);
    }
  };

  // Handle copy to clipboard
  const handleCopyEmail = () => {
    if (suggestedEmail && emailTextRef.current) {
      navigator.clipboard.writeText(suggestedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Input Selection Tabs */}
      <div className="flex border-b border-gray-200 mb-2">
        <button
          onClick={() => setInputMode('email')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${inputMode === 'email' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Mail className="h-4 w-4 mr-2" />
          Email Analysis
        </button>
        <button
          onClick={() => setInputMode('url')}
          className={`flex items-center px-4 py-2 border-b-2 font-medium text-sm ${inputMode === 'url' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
        >
          <Globe className="h-4 w-4 mr-2" />
          URL Analysis
        </button>
      </div>
      
      {/* Input Area - Email or URL based on mode */}
      <Card className="w-full border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-full mr-3 ${inputMode === 'email' ? 'bg-blue-100' : 'bg-indigo-100'}`}>
              {inputMode === 'email' ? (
                <Mail className="h-5 w-5 text-blue-600" />
              ) : (
                <Globe className="h-5 w-5 text-indigo-600" />
              )}
            </div>
            <div>
              <CardTitle>{inputMode === 'email' ? 'Email Analyzer' : 'URL Analyzer'}</CardTitle>
              <CardDescription>
                {inputMode === 'email' 
                  ? 'Paste an email to analyze personality and get tailored response suggestions'
                  : 'Enter URLs to analyze personalities from websites or LinkedIn profiles'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {inputMode === 'email' ? (
              <Textarea
                placeholder="Paste email content here..."
                className="min-h-[200px] border-blue-200 focus:border-blue-400 focus:ring-blue-400"
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Enter URL (e.g., linkedin.com/in/username or company.com)"
                    className="flex-1 min-h-[40px] px-3 py-2 border border-indigo-200 focus:border-indigo-400 focus:ring-indigo-400 rounded-md"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
                  />
                  <Button 
                    onClick={handleAddUrl}
                    size="sm"
                    className="bg-indigo-500 hover:bg-indigo-600"
                  >
                    <Link className="mr-1 h-4 w-4" /> Add URL
                  </Button>
                </div>
                
                {/* URL List */}
                {urlList.length > 0 && (
                  <div className="border border-indigo-100 rounded-md bg-indigo-50 p-2">
                    <div className="flex justify-between items-center mb-2 px-2">
                      <h4 className="text-sm font-medium text-indigo-700">URLs to analyze ({urlList.length})</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearUrls}
                        className="h-7 text-xs text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100"
                      >
                        Clear All
                      </Button>
                    </div>
                    <ul className="space-y-1 max-h-[150px] overflow-y-auto">
                      {urlList.map((url, index) => (
                        <li key={index} className="flex items-center justify-between bg-white p-2 rounded text-sm">
                          <span className="truncate flex-1 text-gray-700">{url}</span>
                          <button
                            onClick={() => handleRemoveUrl(index)}
                            className="text-gray-400 hover:text-red-500 ml-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {error && (
              <div className="flex items-center p-3 text-sm bg-red-50 border border-red-200 text-red-800 rounded-md">
                <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleAnalyzeClick} 
                disabled={isLoading || (inputMode === 'url' && urlList.length === 0)}
                className={`bg-gradient-to-r ${inputMode === 'email' ? 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700' : 'from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700'}`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-4 w-4" />
                    {inputMode === 'email' ? 'Analyze Email' : 'Analyze URL'}
                  </>
                )}
              </Button>
              
              {inputMode === 'email' && (
                <Button
                  variant="outline"
                  onClick={handleExtractContact}
                  disabled={isLoading || isExtractingContact || !analysis}
                  className="border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  {isExtractingContact ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <UserPlus className="mr-2 h-4 w-4" />
                      {contactExtracted ? 'Contact Saved' : 'Save as Contact'}
                    </>
                  )}
                </Button>
              )}
              
              {(inputMode === 'email' && emailContent) && (
                <Button
                  variant="outline"
                  onClick={() => setEmailContent('')}
                  className="border-gray-200 text-gray-600 hover:bg-gray-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear Content
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results Area */}
      <div className="flex flex-col h-full">
        <Card className="w-full flex-1 border-0 shadow-lg bg-gradient-to-b from-white to-gray-50">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-t-lg border-b pb-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-3">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-purple-800">Analysis Results</CardTitle>
                <CardDescription className="text-purple-600">
                  AI-powered insights about the {inputMode === 'email' ? 'email' : 'URL'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-full pt-6 overflow-auto" style={{ maxHeight: '450px' }}>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[350px] py-10">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full border-4 border-t-purple-500 border-b-indigo-500 border-l-blue-500 border-r-blue-300 animate-spin"></div>
                  <Brain className="h-6 w-6 text-indigo-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="mt-6 text-sm text-indigo-600 font-medium">
                  {inputMode === 'email' ? 'Analyzing email psychology...' : 'Analyzing URL content...'}
                </p>
                <p className="text-xs text-gray-500 mt-2">This may take a few moments</p>
              </div>
            ) : analysis ? (
              <div className="whitespace-pre-wrap rounded-lg p-4" dangerouslySetInnerHTML={{ __html: analysis }} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center min-h-[350px] py-10">
                <div className="bg-gray-100 p-4 rounded-full">
                  <Sparkles className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="mt-4 text-lg font-medium text-gray-700">No Analysis Yet</h3>
                <p className="mt-2 text-sm text-gray-500 max-w-xs">
                  {inputMode === 'email' 
                    ? 'Paste an email in the input field and click "Analyze Email" to get AI-powered insights.'
                    : 'Add a URL and click "Analyze URL" to get AI-powered insights about the website or profile.'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggested Email Response Area - Only shown when there's a suggested email */}
      {suggestedEmail && (
        <Card className="w-full border-0 shadow-lg bg-gradient-to-b from-white to-blue-50 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 pb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <div className="p-2 bg-white bg-opacity-20 rounded-full mr-3">
                  <Send className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-white">Suggested Email Response</CardTitle>
                  <CardDescription className="text-blue-100">
                    Ready-to-use personalized response based on the analysis
                  </CardDescription>
                </div>
              </div>
              <Button 
                variant={copied ? "secondary" : "secondary"} 
                size="sm" 
                className={`ml-auto ${copied ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white text-indigo-600 hover:bg-blue-50'}`}
                onClick={handleCopyEmail}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" /> Copy Response
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              ref={emailTextRef}
              className="p-6 bg-white border border-blue-100 rounded-lg whitespace-pre-wrap text-gray-800 shadow-inner"
              style={{ minHeight: '200px' }}
            >
              {suggestedEmail}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
