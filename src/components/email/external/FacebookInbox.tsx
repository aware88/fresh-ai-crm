'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Facebook, MessageSquare, User, Clock, RefreshCw, Send, Paperclip, Image as ImageIcon, Smile, AlertCircle, CheckCircle } from 'lucide-react';
import Image from 'next/image';

interface FacebookMessage {
  id: string;
  sender: {
    id: string;
    name: string;
    profilePicture?: string;
  };
  content: string;
  timestamp: string;
  attachments?: {
    type: 'image' | 'video' | 'file';
    url: string;
    name?: string;
    previewUrl?: string;
  }[];
  isRead: boolean;
  isFromPage: boolean;
}

interface FacebookConversation {
  id: string;
  participants: {
    id: string;
    name: string;
    profilePicture?: string;
  }[];
  lastMessage: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  unreadCount: number;
}

export default function FacebookInbox() {
  const { data: session } = useSession();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [conversations, setConversations] = useState<FacebookConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<FacebookMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Check if Facebook is connected
  useEffect(() => {
    async function checkConnection() {
      try {
        setIsLoading(true);
        // In a real implementation, this would check the connection status with the API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock connection status
        setIsConnected(true);
        fetchConversations();
      } catch (err: any) {
        console.error('Failed to check Facebook connection:', err);
        setError('Failed to connect to Facebook');
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    }
    
    checkConnection();
  }, []);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from the Facebook API
      await new Promise(resolve => setTimeout(resolve, 600));
      
      // Mock conversations
      const mockConversations: FacebookConversation[] = [
        {
          id: '1',
          participants: [
            {
              id: '101',
              name: 'John Smith',
              profilePicture: 'https://i.pravatar.cc/150?img=1'
            }
          ],
          lastMessage: {
            content: 'I have a question about your product',
            timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
            isRead: false
          },
          unreadCount: 2
        },
        {
          id: '2',
          participants: [
            {
              id: '102',
              name: 'Sarah Johnson',
              profilePicture: 'https://i.pravatar.cc/150?img=5'
            }
          ],
          lastMessage: {
            content: 'Thanks for the quick response!',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            isRead: true
          },
          unreadCount: 0
        },
        {
          id: '3',
          participants: [
            {
              id: '103',
              name: 'Michael Brown',
              profilePicture: 'https://i.pravatar.cc/150?img=8'
            }
          ],
          lastMessage: {
            content: 'When will my order be shipped?',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            isRead: false
          },
          unreadCount: 1
        },
      ];
      
      setConversations(mockConversations);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Facebook conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoading(true);
      // In a real implementation, this would fetch from the Facebook API
      await new Promise(resolve => setTimeout(resolve, 700));
      
      // Mock messages
      const mockMessages: FacebookMessage[] = [
        {
          id: '1',
          sender: {
            id: conversationId === '1' ? '101' : conversationId === '2' ? '102' : '103',
            name: conversationId === '1' ? 'John Smith' : conversationId === '2' ? 'Sarah Johnson' : 'Michael Brown',
            profilePicture: `https://i.pravatar.cc/150?img=${conversationId === '1' ? '1' : conversationId === '2' ? '5' : '8'}`
          },
          content: conversationId === '1' ? 'Hello, I\'m interested in your products.' : 
                  conversationId === '2' ? 'Hi there! I saw your ad on Facebook.' : 
                  'Do you ship internationally?',
          timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isFromPage: false
        },
        {
          id: '2',
          sender: {
            id: 'page',
            name: 'Your Business',
            profilePicture: 'https://i.pravatar.cc/150?img=12'
          },
          content: conversationId === '1' ? 'Thank you for your interest! How can I help you today?' : 
                  conversationId === '2' ? 'Welcome! Thanks for reaching out. What can I help you with?' : 
                  'Yes, we do ship internationally. Shipping costs vary by country.',
          timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          isFromPage: true
        },
        {
          id: '3',
          sender: {
            id: conversationId === '1' ? '101' : conversationId === '2' ? '102' : '103',
            name: conversationId === '1' ? 'John Smith' : conversationId === '2' ? 'Sarah Johnson' : 'Michael Brown',
            profilePicture: `https://i.pravatar.cc/150?img=${conversationId === '1' ? '1' : conversationId === '2' ? '5' : '8'}`
          },
          content: conversationId === '1' ? 'I have a question about your product' : 
                  conversationId === '2' ? 'Thanks for the quick response!' : 
                  'When will my order be shipped?',
          timestamp: conversationId === '1' ? new Date(Date.now() - 25 * 60 * 1000).toISOString() : 
                    conversationId === '2' ? new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() : 
                    new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          isRead: conversationId === '2',
          isFromPage: false
        },
      ];
      
      if (conversationId === '1') {
        mockMessages.push({
          id: '4',
          sender: {
            id: '101',
            name: 'John Smith',
            profilePicture: 'https://i.pravatar.cc/150?img=1'
          },
          content: 'Do you have this in blue?',
          timestamp: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
          isRead: false,
          isFromPage: false
        });
      }
      
      setMessages(mockMessages);
      setSelectedConversation(conversationId);
      
      // Mark conversation as read
      setConversations(conversations.map(conv => {
        if (conv.id === conversationId) {
          return { ...conv, unreadCount: 0, lastMessage: { ...conv.lastMessage, isRead: true } };
        }
        return conv;
      }));
      
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch Facebook messages:', err);
      setError('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    try {
      setIsSending(true);
      // In a real implementation, this would send to the Facebook API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newMsg: FacebookMessage = {
        id: `msg-${Date.now()}`,
        sender: {
          id: 'page',
          name: 'Your Business',
          profilePicture: 'https://i.pravatar.cc/150?img=12'
        },
        content: newMessage,
        timestamp: new Date().toISOString(),
        isRead: true,
        isFromPage: true
      };
      
      setMessages([...messages, newMsg]);
      setNewMessage('');
      setSuccess('Message sent successfully');
      
      // Update conversation list
      setConversations(conversations.map(conv => {
        if (conv.id === selectedConversation) {
          return {
            ...conv,
            lastMessage: {
              content: newMessage,
              timestamp: new Date().toISOString(),
              isRead: true
            }
          };
        }
        return conv;
      }));
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to send Facebook message:', err);
      setError('Failed to send message');
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (isLoading && !isConnected) {
    return (
      <div className="facebook-inbox p-4 border rounded-lg bg-white">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          <span>Connecting to Facebook...</span>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="facebook-inbox p-4 border rounded-lg bg-white">
        <div className="flex items-center mb-4">
          <Facebook className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium">Facebook Inbox</h3>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-md mb-4">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-blue-800">Not Connected</h4>
              <p className="text-sm text-blue-700 mt-1">
                Connect your Facebook page to manage messages directly from your CRM.
              </p>
            </div>
          </div>
        </div>
        
        <button
          onClick={() => setIsConnected(true)}
          className="w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
        >
          <Facebook className="h-4 w-4 mr-2" />
          Connect Facebook Page
        </button>
      </div>
    );
  }

  return (
    <div className="facebook-inbox border rounded-lg bg-white overflow-hidden">
      <div className="flex items-center justify-between p-4 bg-blue-50 border-b">
        <div className="flex items-center">
          <Facebook className="h-5 w-5 mr-2 text-blue-600" />
          <h3 className="text-lg font-medium">Facebook Inbox</h3>
        </div>
        
        <button
          onClick={fetchConversations}
          disabled={isLoading}
          className="p-1 hover:bg-blue-100 rounded-full"
          title="Refresh conversations"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 p-3 m-4 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-4 w-4 text-red-500 mr-2 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 p-3 m-4 rounded-md">
          <div className="flex items-start">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}
      
      <div className="flex h-[600px]">
        {/* Conversation List */}
        <div className="w-1/3 border-r overflow-y-auto">
          {conversations.length > 0 ? (
            <div>
              {conversations.map(conversation => (
                <div 
                  key={conversation.id} 
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${selectedConversation === conversation.id ? 'bg-blue-50' : ''}`}
                  onClick={() => fetchMessages(conversation.id)}
                >
                  <div className="flex items-center mb-2">
                    {conversation.participants[0].profilePicture ? (
                      <Image 
                        src={conversation.participants[0].profilePicture} 
                        alt={conversation.participants[0].name}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full mr-3 object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <User className="h-6 w-6 text-gray-500" />
                      </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium truncate">
                          {conversation.participants[0].name}
                        </h4>
                        <span className="text-xs text-gray-500">
                          {formatTime(conversation.lastMessage.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.lastMessage.content}
                    </p>
                    
                    {conversation.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-blue-600 text-white text-xs">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageSquare className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">No conversations yet</p>
              <p className="text-xs text-gray-500 mt-1">Messages from your Facebook page will appear here</p>
            </div>
          )}
        </div>
        
        {/* Message View */}
        <div className="w-2/3 flex flex-col">
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <div className="p-3 border-b bg-gray-50 flex items-center">
                {conversations.find(c => c.id === selectedConversation)?.participants[0].profilePicture ? (
                  <Image 
                    src={conversations.find(c => c.id === selectedConversation)?.participants[0].profilePicture || ''} 
                    alt={conversations.find(c => c.id === selectedConversation)?.participants[0].name || 'Profile'}
                    width={32}
                    height={32}
                    className="h-8 w-8 rounded-full mr-3 object-cover"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium">
                    {conversations.find(c => c.id === selectedConversation)?.participants[0].name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    Facebook Messenger
                  </p>
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`flex ${message.isFromPage ? 'justify-end' : 'justify-start'}`}
                  >
                    {!message.isFromPage && (
                      <div className="flex-shrink-0 mr-2">
                        {message.sender.profilePicture ? (
                          <Image 
                            src={message.sender.profilePicture} 
                            alt={message.sender.name}
                            width={32}
                            height={32}
                            className="h-8 w-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <User className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div 
                      className={`max-w-[70%] rounded-lg p-3 ${message.isFromPage ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
                    >
                      <p>{message.content}</p>
                      
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-2 space-y-2">
                          {message.attachments.map((attachment, index) => (
                            <div key={index} className="rounded border overflow-hidden">
                              {attachment.type === 'image' && attachment.previewUrl && (
                                <Image 
                                  src={attachment.previewUrl} 
                                  alt={attachment.name || 'Attachment'}
                                  width={300}
                                  height={200}
                                  className="max-w-full h-auto object-contain"
                                />
                              )}
                              <div className="p-1 bg-white text-xs truncate">
                                {attachment.name || 'Attachment'}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      <div className={`text-xs mt-1 ${message.isFromPage ? 'text-blue-200' : 'text-gray-500'}`}>
                        {formatTime(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Message Input */}
              <div className="p-3 border-t">
                <div className="flex items-center">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="w-full p-2 pr-24 border rounded-md"
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    
                    <div className="absolute right-2 top-2 flex space-x-1">
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <Paperclip className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <ImageIcon className="h-4 w-4" />
                      </button>
                      <button className="p-1 text-gray-500 hover:text-gray-700">
                        <Smile className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || isSending}
                    className="ml-2 p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300"
                  >
                    {isSending ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-4 text-center">
              <MessageSquare className="h-12 w-12 text-gray-300 mb-3" />
              <h3 className="text-lg font-medium text-gray-700">No conversation selected</h3>
              <p className="text-gray-500 mt-1">Select a conversation from the list to view messages</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
