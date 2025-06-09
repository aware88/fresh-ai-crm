'use client';

import React, { useState, useRef, useEffect } from 'react';
import { SupplierQueryResult } from '@/types/supplier';
import { querySupplierAI } from '@/lib/suppliers/api';
import { formatDate, formatReliabilityScore } from '@/lib/suppliers/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageSquare, Copy, ThumbsUp, ThumbsDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  results?: SupplierQueryResult[];
  aiResponse?: string;
}

export default function SupplierAIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Add welcome message on component mount
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: 'Hello! I\'m your AI sourcing assistant. You can ask me questions about your suppliers, products, or request recommendations. For example:\n\n- Which suppliers offer organic ingredients?\n- Find suppliers with the best reliability score\n- Compare prices for similar products\n- Draft an email to request a quote from a supplier\n- Show me all documents from a specific supplier',
        timestamp: new Date(),
      }
    ]);
  }, []);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim() || isLoading) return;
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setError(null);
    setIsLoading(true);
    
    try {
      const response = await querySupplierAI(input);
      
      const assistantMessage: Message = {
        id: response.queryId,
        type: 'assistant',
        content: response.aiResponse,
        timestamp: new Date(),
        results: response.results,
        aiResponse: response.aiResponse,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Error querying AI:', err);
      setError('Failed to get a response. Please try again.');
      
      // Add error message
      setMessages(prev => [
        ...prev,
        {
          id: 'error-' + Date.now(),
          type: 'assistant',
          content: 'Sorry, I encountered an error while processing your request. Please try again.',
          timestamp: new Date(),
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg mb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.type === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              {message.type === 'assistant' && (
                <div className="flex items-center mb-2">
                  <MessageSquare className="h-5 w-5 mr-2 text-blue-600" />
                  <span className="font-medium text-blue-600">AI Assistant</span>
                </div>
              )}
              
              <div className={`prose ${message.type === 'user' ? 'text-white' : 'text-gray-800'} max-w-none`}>
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
              
              {/* Supplier Results */}
              {message.results && message.results.length > 0 && (
                <div className="mt-4 space-y-3">
                  <h4 className="font-medium text-gray-700">Top Matching Suppliers:</h4>
                  
                  {message.results.map((result, index) => {
                    const reliability = formatReliabilityScore(result.supplier.reliabilityScore || 0);
                    
                    return (
                      <Card key={result.supplier.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-medium text-lg">{result.supplier.name}</h5>
                              <p className="text-sm text-gray-500">{result.supplier.email}</p>
                            </div>
                            <Badge 
                              className={`bg-${reliability.color}-100 text-${reliability.color}-800 border-${reliability.color}-200`}
                            >
                              {reliability.label}
                            </Badge>
                          </div>
                          
                          {result.matchReason && (
                            <div className="mt-2 text-sm">
                              <p className="text-gray-700">{result.matchReason}</p>
                            </div>
                          )}
                          
                          {result.productMatches && result.productMatches.length > 0 && (
                            <div className="mt-2">
                              <p className="text-sm font-medium text-gray-700">Matching Products:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {result.productMatches.map((product: string) => (
                                  <Badge key={product} variant="outline">
                                    {product}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
              
              {/* Message Actions */}
              {message.type === 'assistant' && message.content && (
                <div className="flex justify-end mt-2 space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(message.content)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              <div className="text-xs text-gray-400 mt-2">
                {formatDate(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600 mr-2" />
              <span className="text-gray-600">AI is thinking...</span>
            </div>
          </div>
        )}
        
        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <span className="mr-2">⚠️</span> {error}
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about suppliers, products, or request recommendations..."
          disabled={isLoading}
          className="flex-1"
        />
        <Button 
          type="submit" 
          disabled={!input.trim() || isLoading}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </form>
    </div>
  );
}
