'use client';

import { useState, useEffect } from 'react';
import { Bot, Send, Copy, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface EmailAIFallbackProps {
  emailContent?: string;
  emailSubject?: string;
  senderEmail?: string;
  onResponseGenerated?: (response: string) => void;
}

export default function EmailAIFallback({
  emailContent = '',
  emailSubject = '',
  senderEmail = '',
  onResponseGenerated
}: EmailAIFallbackProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateResponse = async () => {
    if (!emailContent || !emailSubject) {
      setError('Email content and subject are required to generate a response');
      return;
    }
    
    try {
      setIsGenerating(true);
      setError(null);
      setGeneratedResponse('');
      
      // In a real implementation, this would call an AI API
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI-generated response
      const mockResponse = `Dear ${senderEmail ? senderEmail.split('@')[0] : 'Valued Customer'},\n\nThank you for your email regarding "${emailSubject}".\n\nI've reviewed your message and I'm happy to help with your inquiry. Our team is committed to providing excellent service and addressing all customer concerns promptly.\n\nBased on your email, I understand that you're interested in our product offerings and have some questions about pricing and availability. I'd like to inform you that we currently have all items in stock, and we're running a special promotion this month with a 10% discount on all orders over $100.\n\nIf you have any specific questions or need further assistance, please don't hesitate to ask. We're here to help!\n\nBest regards,\nCustomer Support Team\nFresh AI CRM`;
      
      setGeneratedResponse(mockResponse);
      setSuccess('AI response generated successfully');
      
      // Notify parent component if callback provided
      if (onResponseGenerated) {
        onResponseGenerated(mockResponse);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to generate AI response:', err);
      setError('Failed to generate AI response');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (generatedResponse) {
      navigator.clipboard.writeText(generatedResponse);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="email-ai-fallback p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Bot className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-medium">AI Response Generator</h3>
        </div>
        
        <button
          onClick={generateResponse}
          disabled={isGenerating || !emailContent || !emailSubject}
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Bot className="h-4 w-4 mr-1" />
              Generate Response
            </>
          )}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-3 rounded-md mb-4">
          <div className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}
      
      {isGenerating ? (
        <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-2" />
          <p className="text-gray-600">Generating AI response...</p>
          <p className="text-xs text-gray-500 mt-1">This may take a few moments</p>
        </div>
      ) : generatedResponse ? (
        <div className="relative">
          <div className="bg-gray-50 p-4 rounded-md min-h-[200px] whitespace-pre-wrap text-sm">
            {generatedResponse}
          </div>
          
          <div className="absolute top-2 right-2 flex space-x-2">
            <button
              onClick={handleCopyToClipboard}
              className="p-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors"
              title="Copy to clipboard"
            >
              {copied ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </button>
            
            <button
              onClick={() => {
                if (onResponseGenerated) {
                  onResponseGenerated(generatedResponse);
                }
              }}
              className="p-1.5 bg-white border rounded-md hover:bg-gray-50 transition-colors"
              title="Use this response"
            >
              <Send className="h-4 w-4 text-blue-500" />
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 p-4 rounded-md min-h-[200px] flex flex-col items-center justify-center">
          <Bot className="h-8 w-8 text-gray-400 mb-2" />
          <p className="text-gray-600">Click "Generate Response" to create an AI-powered email reply</p>
          <p className="text-xs text-gray-500 mt-1">The AI will analyze the email content and generate an appropriate response</p>
        </div>
      )}
      
      <div className="mt-4 text-xs text-gray-500">
        <p>AI responses are generated based on the email content and subject. You can edit the response before sending.</p>
      </div>
    </div>
  );
}
