'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Loader2, 
  Send, 
  Bot, 
  User, 
  Mail, 
  Settings, 
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Trash2,
  RefreshCw,
  Eye,
  HelpCircle,
  Info
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  preferences?: EmailPreferenceSuggestion[];
  applied?: boolean;
}

interface EmailPreferenceSuggestion {
  type: 'email_filter' | 'response_rule' | 'exclusion_rule' | 'content_rule' | 'style_preference';
  name: string;
  description: string;
  rule: any;
  preview?: string;
}

interface PreferencesStats {
  total_rules: number;
  active_rules: number;
  last_updated: string | null;
  created_at: string | null;
}

export default function AIEmailPreferencesChat() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState<PreferencesStats | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Load initial data
  useEffect(() => {
    if (session?.user?.id) {
      loadPreferencesStats();
      initializeChat();
    }
  }, [session?.user?.id]);

  const loadPreferencesStats = async () => {
    try {
      const response = await fetch('/api/email/ai-preferences/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading preferences stats:', error);
    }
  };

  const initializeChat = () => {
    const welcomeMessage: ChatMessage = {
      id: 'welcome',
      type: 'assistant',
      content: `Hi! I'm your AI email assistant. I'll help you set up your email preferences through natural conversation.

You can tell me things like:
• "Don't send AI responses to promotional emails"
• "Always mark emails from sales agents as urgent"  
• "Use a friendly tone for customer support emails"
• "Exclude marketing emails from auto-processing"
• "For product inquiries, include pricing information"
• "Route complaint emails to manual review"
• "Don't process emails from competitors automatically"

You can also ask me about your current settings:
• "What are my current email preferences?"
• "Show me my AI settings"
• "What rules do I have set up?"

${stats ? `\nCurrent settings: ${stats.active_rules} active rules out of ${stats.total_rules} total` : ''}

What would you like to configure first?`,
      timestamp: new Date(),
    };

    setMessages([welcomeMessage]);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/email/ai-preferences-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          conversationHistory: messages.slice(-10) // Last 10 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      // Handle processing errors gracefully
      if (data.error === 'processing_error') {
        const errorMessage: ChatMessage = {
          id: data.messageId || 'error-' + Date.now(),
          type: 'system',
          content: data.response,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
      
      const assistantMessage: ChatMessage = {
        id: data.messageId || (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date(),
        preferences: data.preferences,
        applied: data.applied
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Reload stats if preferences were applied
      if (data.applied) {
        loadPreferencesStats();
        toast({
          title: "Settings Applied",
          description: "Your email preferences have been updated successfully.",
        });
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: 'error-' + Date.now(),
        type: 'system',
        content: 'I apologize, but I encountered an issue while processing your request. Please try again in a moment, or contact support if the problem persists.',
        timestamp: new Date(),
      }]);
      
      toast({
        title: "Connection Issue",
        description: "Unable to process your request right now. Please try again or contact support if this continues.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApplyPreferences = async (preferences: EmailPreferenceSuggestion[]) => {
    try {
      console.log('[Chat] Applying preferences:', preferences);
      
      const response = await fetch('/api/email/ai-preferences/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });

      console.log('[Chat] Response status:', response.status, response.statusText);

      if (response.ok) {
        const result = await response.json();
        console.log('[Chat] Apply result:', result);
        
        // Update message to show preferences were applied
        setMessages(prev => prev.map(msg => 
          msg.preferences === preferences 
            ? { ...msg, applied: true }
            : msg
        ));

        loadPreferencesStats();
        
        toast({
          title: "Success",
          description: "Email preferences applied successfully!",
        });
      } else {
        // Get error details from response
        let errorMessage = 'Unknown error occurred';
        let setupRequired = false;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          setupRequired = errorData.setup_required || false;
          console.error('[Chat] API error:', errorData);
        } catch (e) {
          console.error('[Chat] Failed to parse error response');
        }
        
        if (setupRequired) {
          throw new Error(`Setup Required: ${errorMessage}. Please contact your administrator to run the database migration.`);
        } else {
          throw new Error(`Failed to apply preferences: ${errorMessage}`);
        }
      }
    } catch (error) {
      console.error('[Chat] Error applying preferences:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: "Settings Error",
        description: `Unable to save your preferences: ${errorMessage}. Please try again or contact support if this continues.`,
        variant: "destructive"
      });
    }
  };

  const clearChat = () => {
    setMessages([]);
    initializeChat();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats Card */}
      {stats && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">{stats.active_rules} Active Rules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{stats.total_rules} Total</span>
                </div>
                {stats.last_updated && (
                  <div className="text-sm text-muted-foreground">
                    Last updated: {new Date(stats.last_updated).toLocaleDateString()}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadPreferencesStats}
                disabled={isLoading}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Card */}
      <Card className="h-[600px] flex flex-col isolate">
        <CardHeader className="pb-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Email Preferences Setup
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isLoading}
                  >
                    <HelpCircle className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      AI Email Preferences - What You Can Configure
                    </DialogTitle>
                    <DialogDescription>
                      Here's everything you can set up by talking to the AI assistant
                    </DialogDescription>
                  </DialogHeader>
                  <ScrollArea className="max-h-[60vh] pr-4">
                    <div className="space-y-6">
                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Filtering & Processing
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Examples you can say:</p>
                            <ul className="mt-2 space-y-1 text-gray-700">
                              <li>• "Don't send AI responses to promotional emails"</li>
                              <li>• "Skip processing marketing messages automatically"</li>
                              <li>• "Don't process emails from competitors"</li>
                              <li>• "Exclude newsletter emails from AI processing"</li>
                              <li>• "Flag urgent emails for manual review"</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          Response Style & Tone
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Examples you can say:</p>
                            <ul className="mt-2 space-y-1 text-gray-700">
                              <li>• "Use a friendly tone for customer support emails"</li>
                              <li>• "Be professional with sales inquiries"</li>
                              <li>• "Keep responses brief and to the point"</li>
                              <li>• "Use a casual tone for internal emails"</li>
                              <li>• "Be more detailed in technical responses"</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          Email Routing & Escalation
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Examples you can say:</p>
                            <ul className="mt-2 space-y-1 text-gray-700">
                              <li>• "Route complaint emails to manual review"</li>
                              <li>• "Always escalate legal emails to humans"</li>
                              <li>• "Flag high-value customer emails as priority"</li>
                              <li>• "Send contract discussions to manual handling"</li>
                              <li>• "Escalate anything mentioning refunds"</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4" />
                          Content & Template Rules
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="font-medium text-blue-700">Examples you can say:</p>
                            <ul className="mt-2 space-y-1 text-gray-700">
                              <li>• "Include pricing information for product inquiries"</li>
                              <li>• "Always add contact details in responses"</li>
                              <li>• "Include availability info for scheduling requests"</li>
                              <li>• "Add disclaimer for legal-related emails"</li>
                              <li>• "Include next steps in project emails"</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Check Your Current Settings
                        </h3>
                        <div className="space-y-2 text-sm">
                          <div className="bg-blue-50 p-3 rounded-lg border-l-4 border-blue-500">
                            <p className="font-medium text-blue-700">Ask the AI about your settings:</p>
                            <ul className="mt-2 space-y-1 text-blue-600">
                              <li>• "What are my current email preferences?"</li>
                              <li>• "Show me my AI settings"</li>
                              <li>• "What rules do I have set up?"</li>
                              <li>• "What's my response style configured as?"</li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <h4 className="font-semibold text-green-800 mb-2">💡 Pro Tips:</h4>
                        <ul className="text-sm text-green-700 space-y-1">
                          <li>• Be specific about your needs - the AI can handle complex scenarios</li>
                          <li>• You can combine multiple rules in one message</li>
                          <li>• Ask for clarification if you're unsure about something</li>
                          <li>• All changes are applied immediately and can be modified anytime</li>
                        </ul>
                      </div>
                    </div>
                  </ScrollArea>
                </DialogContent>
              </Dialog>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChat}
                disabled={isLoading}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <Separator className="flex-shrink-0" />

        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <ChatMessageComponent 
                  key={message.id} 
                  message={message}
                  onApplyPreferences={handleApplyPreferences}
                />
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing your settings...
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <Separator className="flex-shrink-0" />

          <div className="p-4 flex-shrink-0">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tell me about your email preferences..."
                disabled={isLoading}
                className="flex-1"
              />
              <Button 
                onClick={handleSendMessage} 
                disabled={isLoading || !input.trim()}
                size="sm"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ChatMessageComponent({ 
  message, 
  onApplyPreferences 
}: { 
  message: ChatMessage;
  onApplyPreferences: (preferences: EmailPreferenceSuggestion[]) => void;
}) {
  const isUser = message.type === 'user';
  
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <Bot className="h-4 w-4 text-blue-600" />
          </div>
        </div>
      )}
      
      <div className={`max-w-[80%] ${isUser ? 'order-first' : ''}`}>
        <div
          className={`rounded-lg px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white ml-auto'
              : message.type === 'system'
              ? 'bg-yellow-50 text-yellow-800 border border-yellow-200'
              : 'bg-gray-100 text-gray-900'
          }`}
        >
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
          
          {message.preferences && !message.applied && (
            <div className="mt-4 space-y-3">
              <Separator className="bg-white/20" />
              <p className="text-sm font-medium opacity-90">
                Suggested preferences:
              </p>
              <div className="space-y-2">
                {message.preferences.map((pref, index) => (
                  <div key={index} className="bg-white/20 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary" className="text-xs">
                        {pref.type.replace('_', ' ')}
                      </Badge>
                      <span className="font-medium">{pref.name}</span>
                    </div>
                    <p className="mb-2 opacity-90">{pref.description}</p>
                    {pref.preview && (
                      <p className="text-xs opacity-75 bg-white/10 rounded px-2 py-1">
                        Preview: {pref.preview}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                size="sm"
                onClick={() => onApplyPreferences(message.preferences!)}
                className="bg-green-600 hover:bg-green-700 w-full"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Apply These Settings
              </Button>
            </div>
          )}
          
          {message.applied && (
            <div className="mt-3 flex items-center gap-2 text-green-300 text-sm bg-white/10 rounded px-2 py-1">
              <CheckCircle2 className="h-4 w-4" />
              Settings applied successfully
            </div>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mt-1 px-1">
          {message.timestamp.toLocaleTimeString()}
        </div>
      </div>
      
      {isUser && (
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
        </div>
      )}
    </div>
  );
} 