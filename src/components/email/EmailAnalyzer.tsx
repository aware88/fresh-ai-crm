'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';

export function EmailAnalyzer() {
  const [emailContent, setEmailContent] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyzeClick = async () => {
    if (!emailContent.trim()) {
      setError('Please enter an email to analyze');
      return;
    }

    setIsLoading(true);
    setError(null);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-7xl mx-auto">
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
  );
}
