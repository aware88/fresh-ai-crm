'use client';

import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip } from '@/components/ui/tooltip';
import { 
  Loader2, 
  Send, 
  Brain, 
  User, 
  Sparkles, 
  CheckCircle, 
  AlertCircle, 
  HelpCircle,
  Table as TableIcon,
  BarChart3,
  Users,
  ThumbsUp,
  ThumbsDown,
  Copy,
  RefreshCw,
  Settings,
  Cpu,
  Zap,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface AIFutureMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  thinking?: string[];
  data?: any;
  visualData?: {
    type: 'table' | 'cards' | 'chart';
    data: any[];
    headers?: string[];
  };
  confidence?: number;
  success?: boolean;
  needsClarification?: boolean;
  clarificationQuestions?: string[];
  actions?: any[];
  isStreaming?: boolean;
  modelUsed?: {
    id: string;
    name: string;
    reasoning: string[];
    alternatives?: string[];
    canOverride?: boolean;
  };
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  costPer1kTokens: number;
  capabilities: {
    reasoning: number;
    speed: number;
    creativity: number;
    accuracy: number;
  };
}

interface AIFutureChatProps {
  className?: string;
}

export default function AIFutureChat({ className }: AIFutureChatProps) {
  const [messages, setMessages] = useState<AIFutureMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(true);
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [availableModels, setAvailableModels] = useState<ModelOption[]>([]);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [userPreferences, setUserPreferences] = useState<{[key: string]: string}>({});
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Add welcome message and load models on component mount
  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        type: 'assistant',
        content: `🚀 **Welcome to CRM Assistant!**

I'm your intelligent AI business partner. I can help you manage your entire CRM through natural language - no forms, no clicking through pages, just conversation.

**🧠 Smart Model Selection**: I automatically choose the best AI model for each task to optimize quality and cost.

**🎯 NEW: Outbound Email Campaigns**: Create AI-powered email campaigns using natural language!

**Quick examples:**
• "Add TechCorp supplier with email info@tech.com"
• "Show me all products from suppliers with reliability > 8"
• "Create campaign for customers who bought >3 months ago"
• "Segment contacts with lead score above 80"
• "Generate personalized upsell emails for enterprise contacts"

**Try asking me anything about your business data or campaigns!**`,
        timestamp: new Date()
        // No success/confidence for welcome message
      }
    ]);
    
    // Load available models and user preferences
    loadAvailableModels();
    loadUserPreferences();
  }, []);

  const loadAvailableModels = async () => {
    try {
      const response = await fetch('/api/ai/future/models', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const models = await response.json();
        setAvailableModels(models);
      }
    } catch (error) {
      console.error('Failed to load models:', error);
      // Set default models if API fails
      setAvailableModels([
        {
          id: 'gpt-4o-mini',
          name: 'GPT-4o Mini',
          description: 'Best balance of performance and cost',
          costPer1kTokens: 0.00015,
          capabilities: { reasoning: 8, speed: 8, creativity: 8, accuracy: 9 }
        },
        {
          id: 'gpt-4o',
          name: 'GPT-4o',
          description: 'Most capable model for complex reasoning',
          costPer1kTokens: 0.005,
          capabilities: { reasoning: 10, speed: 7, creativity: 9, accuracy: 10 }
        }
      ]);
    }
  };

  const loadUserPreferences = async () => {
    try {
      const response = await fetch('/api/ai/future/preferences', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const preferences = await response.json();
        setUserPreferences(preferences);
        
        // Set default model based on user's most preferred
        if (preferences.defaultModel && preferences.defaultModel !== 'auto') {
          setSelectedModel(preferences.defaultModel);
        }
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  const saveUserPreferences = async (newPreferences: {[key: string]: string}) => {
    try {
      await fetch('/api/ai/future/preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(newPreferences),
      });
      
      setUserPreferences(newPreferences);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmitWithMessage = async (message: string, modelOverride?: string) => {
    if (isLoading) return;

    const userMessage: AIFutureMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create placeholder assistant message for streaming updates
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: AIFutureMessage = {
      id: assistantMessageId,
      type: 'assistant',
      content: 'CRM Assistant is thinking...',
      timestamp: new Date(),
      thinking: [],
      success: true,
      confidence: 0.8,
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/future', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message,
          modelOverride: modelOverride || (selectedModel === 'auto' ? undefined : selectedModel)
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                
                if (data.type === 'thinking') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? { ...msg, content: data.step }
                      : msg
                  ));
                } else if (data.type === 'final') {
                  setMessages(prev => prev.map(msg => 
                    msg.id === assistantMessageId 
                      ? {
                          ...msg,
                          content: data.response.message,
                          data: data.response.data,
                          visualData: data.response.visualData,
                          confidence: data.response.confidence,
                          success: data.response.success,
                          actions: data.response.actions || [],
                          modelUsed: data.response.modelUsed,
                          isStreaming: false
                        }
                      : msg
                  ));
                }
              } catch (e) {
                console.error('Error parsing streaming data:', e);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? {
              ...msg,
              content: `❌ **Error**: ${error instanceof Error ? error.message : 'An unexpected error occurred'}\n\nPlease try again or contact support if the issue persists.`,
              success: false,
              confidence: 0,
              isStreaming: false
            }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const messageInput = input.trim();
    setInput('');
    await handleSubmitWithMessage(messageInput);
  };

  const handleModelOverride = async (modelId: string, messageId: string) => {
    // Find the original user message for this response
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;
    
    const originalUserMessage = messages[userMessageIndex];
    if (originalUserMessage.type !== 'user') return;

    // Set the model override and resend
    const previousModel = selectedModel;
    setSelectedModel(modelId);
    
    // Remove the assistant response and resend
    setMessages(prev => prev.slice(0, messageIndex));
    
    // Resend with new model
    await handleSubmitWithMessage(originalUserMessage.content, modelId);
    
    // Reset model selection
    setSelectedModel(previousModel);
  };

  const handleFeedback = async (messageId: string, rating: number, modelUsed: any) => {
    try {
      await fetch('/api/ai/future/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          messageId,
          rating,
          modelId: modelUsed.id,
          // Extract task type and complexity from model reasoning
          taskType: 'general', // Could be enhanced to extract from context
          complexity: modelUsed.reasoning.find((r: string) => r.includes('complexity:'))?.split(':')[1]?.trim() || 'standard'
        }),
      });
      
      // Visual feedback
      const feedbackText = rating >= 4 ? 'Thanks for the positive feedback!' : 'Thanks for the feedback. I\'ll improve!';
      
      // You could show a toast notification here
      console.log(feedbackText);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const renderVisualData = (visualData: any) => {
    if (!visualData) return null;

    switch (visualData.type) {
      case 'table':
        return (
          <div className="mt-4 border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  {visualData.headers?.map((header: string, index: number) => (
                    <TableHead key={index} className="font-semibold">
                      {header}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {visualData.data?.map((row: any, rowIndex: number) => (
                  <TableRow key={rowIndex}>
                    {Object.values(row).map((cell: any, cellIndex: number) => (
                      <TableCell key={cellIndex}>
                        {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        );

      case 'cards':
        return (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visualData.data?.map((item: any, index: number) => (
              <Card key={index} className="p-4">
                <CardContent className="p-0">
                  {Object.entries(item).map(([key, value]) => (
                    <div key={key} className="flex justify-between items-center py-1">
                      <span className="font-medium text-sm text-gray-600 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}:
                      </span>
                      <span className="text-sm">
                        {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      case 'campaign_preview':
        return (
          <div className="mt-4 space-y-4">
            {visualData.data?.map((campaign: any, index: number) => (
              <Card key={index} className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-blue-900 mb-1">{campaign.name}</h3>
                      <p className="text-sm text-blue-700">{campaign.description}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">
                      {campaign.status || 'Draft'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-900">{campaign.total_targets || campaign.estimated_recipients}</div>
                      <div className="text-xs text-blue-600">Target Contacts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-900">{campaign.personalization_level}</div>
                      <div className="text-xs text-purple-600">Personalization</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-900">Ready</div>
                      <div className="text-xs text-green-600">Status</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-900">AI</div>
                      <div className="text-xs text-orange-600">Powered</div>
                    </div>
                  </div>

                  {campaign.target_preview && campaign.target_preview.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">Sample Targets:</h4>
                      <div className="flex flex-wrap gap-2">
                        {campaign.target_preview.slice(0, 3).map((contact: any, idx: number) => (
                          <Badge key={idx} variant="secondary" className="bg-white text-blue-700">
                            {contact.firstname} {contact.lastname}
                          </Badge>
                        ))}
                        {campaign.total_targets > 3 && (
                          <Badge variant="secondary" className="bg-white text-blue-700">
                            +{campaign.total_targets - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  const renderMessage = (message: AIFutureMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-start gap-3`}>
          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
            isUser 
              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
              : message.success === false 
                ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-600' 
                : 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-600'
          }`}>
            {isUser ? (
              <User className="w-5 h-5" />
            ) : message.success === false ? (
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
          </div>

          <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-4 rounded-2xl ${
              isUser 
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white' 
                : message.success === false
                  ? 'bg-red-50 border border-red-200 text-red-800'
                  : 'bg-white border border-gray-200 text-gray-800 shadow-sm'
            }`}>
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{typeof message.content === 'string' ? message.content : JSON.stringify(message.content)}</ReactMarkdown>
              </div>

              {message.thinking && message.thinking.length > 0 && showThinking && (
                <div className="mt-3 pt-3 border-t border-gray-200 border-opacity-50">
                  <div className="flex items-center gap-2 mb-2">
                    <HelpCircle className="w-4 h-4 opacity-70" />
                    <span className="text-xs font-medium opacity-70">My thinking process:</span>
                  </div>
                  <div className="text-xs opacity-80 space-y-2">
                    {message.thinking.map((thought, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 font-medium">{index + 1}.</span>
                        <span className="flex-1">{thought}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {message.visualData && renderVisualData(message.visualData)}

              {/* Model Information and Confidence */}
              {!isUser && !message.isStreaming && (
                <div className="mt-3 pt-3 border-t border-gray-200 border-opacity-50 space-y-2">
                  {/* Model Used */}
                  {message.modelUsed && (
                    <Collapsible>
                      <CollapsibleTrigger className="flex items-center gap-2 text-xs hover:bg-gray-50 rounded p-1 w-full">
                        <div className="flex items-center gap-2 w-full">
                          <Cpu className="w-3 h-3 text-blue-500" />
                          <span className="font-medium text-blue-700">{message.modelUsed.name}</span>
                          <ChevronDown className="w-3 h-3 ml-auto" />
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="mt-2 ml-5 space-y-1">
                        {message.modelUsed.reasoning.map((reason, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="text-blue-400 font-bold">•</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                        {message.modelUsed.alternatives && message.modelUsed.alternatives.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="text-xs text-gray-500 mb-1">Alternative models available:</div>
                            <div className="flex flex-wrap gap-1">
                              {message.modelUsed.alternatives.map((altId) => {
                                const altModel = availableModels.find(m => m.id === altId);
                                return altModel ? (
                                  <Tooltip key={altId} content={`Click to retry with ${altModel.name}`}>
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs cursor-pointer hover:bg-blue-50"
                                      onClick={() => handleModelOverride(altId, message.id)}
                                    >
                                      {altModel.name}
                                    </Badge>
                                  </Tooltip>
                                ) : null;
                              })}
                            </div>
                          </div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                  
                  {/* Success and Confidence */}
                  {message.confidence !== undefined && (
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        {message.success !== false ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-xs font-medium">
                          {message.success !== false ? 'Success' : 'Error'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        </div>
                        <span className="text-xs">
                          {Math.round(message.confidence * 100)}% confident
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
              <span>{message.timestamp.toLocaleTimeString()}</span>
              {!isUser && message.modelUsed && (
                <div className="flex items-center gap-1">
                  <Tooltip content="This response was helpful">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:text-green-600"
                      onClick={() => handleFeedback(message.id, 5, message.modelUsed!)}
                    >
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                  </Tooltip>
                  <Tooltip content="This response needs improvement">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 hover:text-red-600"
                      onClick={() => handleFeedback(message.id, 2, message.modelUsed!)}
                    >
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={`h-full flex flex-col ${className}`}>
      <CardHeader className="bg-gradient-to-r from-[var(--brand-start)] via-[var(--brand-mid)] to-[var(--brand-end)] text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-white bg-opacity-10 backdrop-blur-sm"></div>
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white bg-opacity-20 rounded-full">
              <div className="relative">
                <Brain className="h-6 w-6 text-white" />
                <Sparkles className="w-4 h-4 absolute -top-1 -right-1 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <div>
              <CardTitle className="text-white text-xl font-bold">CRM Assistant</CardTitle>
              <p className="text-white/70 text-sm">Your Intelligent Business Partner</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white bg-opacity-20 text-white border-white border-opacity-30">
              <Sparkles className="w-3 h-3 mr-1" />
              Premium
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowModelSettings(!showModelSettings)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <Settings className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowThinking(!showThinking)}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {/* Model Settings Panel */}
      {showModelSettings && (
        <div className="border-b bg-gray-50 p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">AI Model Settings</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowModelSettings(false)}
                className="h-6 w-6 p-0"
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Model Selection
                </label>
                <Select value={selectedModel} onValueChange={(value) => {
                  setSelectedModel(value);
                  // Save user preference
                  if (value !== 'auto') {
                    saveUserPreferences({ ...userPreferences, defaultModel: value });
                  }
                }}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose AI model" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">
                      <>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-500" />
                          <div>
                            <div className="font-medium">Auto (Recommended)</div>
                            <div className="text-xs text-gray-500">Automatically selects the best model</div>
                          </div>
                        </div>
                      </>
                    </SelectItem>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <>
                          <div className="flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-gray-500" />
                            <div>
                              <div className="font-medium">{model.name}</div>
                              <div className="text-xs text-gray-500">{model.description}</div>
                            </div>
                          </div>
                        </>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {selectedModel !== 'auto' && (
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">
                    Model Details
                  </label>
                  {(() => {
                    const model = availableModels.find(m => m.id === selectedModel);
                    return model ? (
                      <div className="bg-white rounded-lg p-3 border space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-600">Cost per 1K tokens:</span>
                          <span className="font-medium">${model.costPer1kTokens.toFixed(4)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span>Reasoning:</span>
                            <span>{model.capabilities.reasoning}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Speed:</span>
                            <span>{model.capabilities.speed}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Creativity:</span>
                            <span>{model.capabilities.creativity}/10</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Accuracy:</span>
                            <span>{model.capabilities.accuracy}/10</span>
                          </div>
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
            
            <div className="text-xs text-gray-500 bg-blue-50 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <div className="font-medium text-blue-700 mb-1">Smart Model Selection</div>
                  <div>When set to "Auto", I analyze each request and automatically choose the most cost-effective model that can handle the task complexity. You can always override my selection by clicking on alternative models in my responses.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white max-h-[500px]">
          {messages.map(renderMessage)}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex items-start gap-3 max-w-[85%]">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-r from-blue-100 to-indigo-100 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                </div>
                <div className="bg-white border border-gray-200 shadow-sm rounded-2xl p-4">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">CRM Assistant is thinking...</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t bg-white p-4">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="font-medium">Error:</span>
                <span>{error}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me about your business or campaigns... (e.g., 'Create outbound campaign' or 'Show all products')"
              disabled={isLoading}
              className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
            <Button 
              type="submit" 
              disabled={isLoading || !input.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-6"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </form>
          
          <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <span>💡 Try: "Create campaign for inactive customers" • "Show all products" • "Segment high-score leads"</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedModel !== 'auto' && (
                <div className="flex items-center gap-1 text-blue-600">
                  <Cpu className="w-3 h-3" />
                  <span>{availableModels.find(m => m.id === selectedModel)?.name || 'Custom Model'}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Powered by CRM Assistant</span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}