'use client';

import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, Copy, Check } from 'lucide-react';

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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {/* Email Input Area */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Email Analysis</CardTitle>
            <CardDescription>
              Paste an email to analyze its content and receive AI-powered insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              placeholder="Paste email content here..." 
              className="min-h-[300px]" 
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
            />
            {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
          </CardContent>
          <CardFooter>
            <Button 
              onClick={handleAnalyzeClick}
              disabled={isLoading || !emailContent.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                  Analyzing...
                </>
              ) : (
                'Analyze Email'
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Analysis Results Area */}
        <Card className="w-full">
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
            <CardDescription>
              AI-powered insights about the email content
            </CardDescription>
          </CardHeader>
          <CardContent className="prose prose-sm max-w-full">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center min-h-[300px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">Processing your email...</p>
              </div>
            ) : analysis ? (
              <div className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: analysis }} />
            ) : (
              <div className="flex flex-col items-center justify-center text-center text-muted-foreground min-h-[300px]">
                <p>No analysis yet. Paste an email and click "Analyze Email" to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Suggested Email Response Area - Only shown when there's a suggested email */}
      {suggestedEmail && (
        <Card className="w-full border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-blue-800">Suggested Email Response</CardTitle>
                <CardDescription className="text-blue-600">
                  Ready-to-use email response based on the analysis
                </CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className={`ml-auto ${copied ? 'bg-green-100 text-green-800 border-green-300' : 'bg-white'}`}
                onClick={handleCopyEmail}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" /> Copy Email
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div 
              ref={emailTextRef}
              className="p-4 bg-white border border-blue-100 rounded-md whitespace-pre-wrap text-gray-800"
            >
              {suggestedEmail}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
