'use client';

import { useState, useEffect } from 'react';
import { Database, Search, FileText, AlertCircle, CheckCircle, Lightbulb } from 'lucide-react';

interface RAGResult {
  id: string;
  source: string;
  content: string;
  relevance: number; // 0-1 score
  type: 'document' | 'knowledge_base' | 'previous_email' | 'faq';
  metadata: {
    title?: string;
    date?: string;
    author?: string;
    tags?: string[];
    [key: string]: any;
  };
}

interface EmailRAGProcessorProps {
  emailContent?: string;
  onResultsReady?: (results: RAGResult[]) => void;
  autoProcess?: boolean;
}

export default function EmailRAGProcessor({
  emailContent = '',
  onResultsReady,
  autoProcess = false
}: EmailRAGProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<RAGResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  // Process email content when it changes if autoProcess is true
  useEffect(() => {
    if (autoProcess && emailContent && emailContent.length > 20) {
      processEmail(emailContent);
    }
  }, [emailContent, autoProcess]);

  const processEmail = async (content: string) => {
    if (!content || content.length < 10) {
      setError('Email content is too short to process');
      return;
    }
    
    try {
      setIsProcessing(true);
      setError(null);
      
      // In a real implementation, this would call a RAG API
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      // Mock RAG results
      const mockResults: RAGResult[] = [
        {
          id: '1',
          source: 'knowledge_base',
          content: 'Our return policy allows customers to return items within 30 days of purchase for a full refund. Items must be in original condition with tags attached. To initiate a return, customers should contact customer support with their order number and reason for return.',
          relevance: 0.92,
          type: 'knowledge_base',
          metadata: {
            title: 'Return Policy',
            date: '2023-05-15',
            author: 'Customer Support Team',
            tags: ['returns', 'policy', 'refunds']
          }
        },
        {
          id: '2',
          source: 'previous_email',
          content: 'Thank you for contacting us about your recent order #12345. We apologize for the delay in shipping. Your order has been processed and will be shipped within the next 24 hours. You will receive a tracking number once it ships.',
          relevance: 0.85,
          type: 'previous_email',
          metadata: {
            title: 'RE: Order #12345 Status',
            date: '2023-06-02',
            author: 'Jane Smith',
            tags: ['order', 'shipping', 'delay']
          }
        },
        {
          id: '3',
          source: 'faq',
          content: 'Q: How do I track my order?\nA: You can track your order by logging into your account and viewing your order history. Alternatively, you can use the tracking number provided in your shipping confirmation email.',
          relevance: 0.78,
          type: 'faq',
          metadata: {
            title: 'Order Tracking FAQ',
            tags: ['tracking', 'orders', 'shipping']
          }
        },
        {
          id: '4',
          source: 'document',
          content: 'Our shipping partners include FedEx, UPS, and USPS. Standard shipping typically takes 3-5 business days. Express shipping is available for an additional fee and typically delivers within 1-2 business days. International shipping times vary by destination.',
          relevance: 0.72,
          type: 'document',
          metadata: {
            title: 'Shipping Information',
            date: '2023-04-10',
            tags: ['shipping', 'delivery', 'international']
          }
        },
      ];
      
      setResults(mockResults);
      setSuccess('Successfully retrieved relevant information');
      
      // Notify parent component if callback provided
      if (onResultsReady) {
        onResultsReady(mockResults);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to process email with RAG:', err);
      setError('Failed to retrieve relevant information');
      setResults([]);
    } finally {
      setIsProcessing(false);
    }
  };

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'knowledge_base':
        return <Database className="h-4 w-4 text-purple-500" />;
      case 'previous_email':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'faq':
        return <Lightbulb className="h-4 w-4 text-amber-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getSourceLabel = (type: string) => {
    switch (type) {
      case 'document':
        return 'Document';
      case 'knowledge_base':
        return 'Knowledge Base';
      case 'previous_email':
        return 'Previous Email';
      case 'faq':
        return 'FAQ';
      default:
        return 'Source';
    }
  };

  return (
    <div className="email-rag-processor p-4 border rounded-lg bg-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Database className="h-5 w-5 mr-2 text-blue-500" />
          <h3 className="text-lg font-medium">Relevant Information</h3>
        </div>
        
        {!autoProcess && (
          <button
            onClick={() => processEmail(emailContent)}
            disabled={isProcessing || !emailContent}
            className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:bg-gray-300 flex items-center"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-1"></div>
                Processing...
              </>
            ) : (
              <>
                <Search className="h-4 w-4 mr-1" />
                Find Relevant Info
              </>
            )}
          </button>
        )}
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
      
      {isProcessing && results.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          <span>Retrieving relevant information...</span>
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-3">
          {results.map(result => (
            <div key={result.id} className="border rounded-md overflow-hidden">
              <div 
                className="flex justify-between items-center p-3 bg-gray-50 border-b cursor-pointer"
                onClick={() => toggleExpand(result.id)}
              >
                <div className="flex items-center">
                  {getSourceIcon(result.type)}
                  <span className="font-medium ml-2">
                    {result.metadata.title || getSourceLabel(result.type)}
                  </span>
                  <span 
                    className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs"
                    title="Relevance score"
                  >
                    {Math.round(result.relevance * 100)}%
                  </span>
                </div>
                <button className="text-gray-500">
                  {expanded[result.id] ? '−' : '+'}
                </button>
              </div>
              
              {expanded[result.id] && (
                <div className="p-3">
                  <div className="text-sm mb-3">{result.content}</div>
                  
                  <div className="flex flex-wrap gap-1 mt-2">
                    {result.metadata.tags?.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2 flex justify-between">
                    <span>{getSourceLabel(result.type)}</span>
                    {result.metadata.date && (
                      <span>{new Date(result.metadata.date).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : !isProcessing && emailContent ? (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <Search className="h-8 w-8 mx-auto text-gray-400" />
          <p className="mt-2 text-gray-600">
            {autoProcess ? 'No relevant information found' : 'Click "Find Relevant Info" to search for related content'}
          </p>
        </div>
      ) : (
        <div className="text-center py-6 bg-gray-50 rounded-md">
          <p className="text-gray-600">Select an email to find relevant information</p>
        </div>
      )}
    </div>
  );
}
