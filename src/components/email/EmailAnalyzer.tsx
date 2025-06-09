'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Copy, Check, Mail, Brain, Sparkles, Send, Trash2 } from 'lucide-react';

export function EmailAnalyzer() {
  const [emailContent, setEmailContent] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [suggestedEmail, setSuggestedEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const emailTextRef = useRef<HTMLDivElement>(null);

  const handleAnalyzeClick = async () => {
    if (!emailContent.trim()) {
      setError('Please enter an email to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestedEmail(null);
    setCopied(false);

    try {
      const response = await fetch('/api/analyze-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ emailContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze email');
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

  // Handle copy to clipboard
  const handleCopyEmail = () => {
    if (suggestedEmail && emailTextRef.current) {
      navigator.clipboard.writeText(suggestedEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-7xl mx-auto py-6">
      {/* Hero Section */}
      <div className="text-center mb-2">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Email Analysis</h1>
        <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">Unlock the psychology behind your emails and get AI-powered response suggestions</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {/* Email Input Area */}
        <div className="flex flex-col h-full">
          <Card className="w-full flex-1 border-0 shadow-lg bg-gradient-to-b from-white to-gray-50">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg border-b pb-4">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-full mr-3">
                  <Mail className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-blue-800">Email Content</CardTitle>
                  <CardDescription className="text-blue-600">
                    Paste an email to analyze its content
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <Textarea 
                  placeholder="Paste email content here..." 
                  className="min-h-[350px] border-gray-200 focus:border-blue-300 focus:ring-blue-200 resize-none shadow-inner bg-white" 
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                />
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 rounded-md text-red-600 text-sm flex items-center">
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {error}
                  </div>
                )}
                <div className="flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEmailContent('')}
                    disabled={!emailContent.trim()}
                    className="text-gray-500 hover:text-gray-700 border-gray-200 hover:bg-gray-50"
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Clear Content
                  </Button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-6">
              <Button 
                onClick={handleAnalyzeClick}
                disabled={isLoading || !emailContent.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white py-6"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" /> 
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="mr-2 h-5 w-5" />
                    Analyze Email
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>

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
                    AI-powered insights about the email
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
                  <p className="mt-6 text-sm text-indigo-600 font-medium">Analyzing email psychology...</p>
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
                    Paste an email in the input field and click "Analyze Email" to get AI-powered insights.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
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
