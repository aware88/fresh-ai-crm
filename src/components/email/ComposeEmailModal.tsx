'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Paperclip,
  Image,
  Smile,
  MoreVertical,
  Minimize2,
  Maximize2,
  Trash2,
  Save,
  Clock,
  ChevronDown,
  Sparkles,
  Bot,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import RichTextEditor from './RichTextEditor';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';

interface ComposeEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (email: EmailData) => Promise<void>;
  onDraftSave?: (email: EmailData) => Promise<void>;
  onAIDraft?: (prompt: string) => Promise<string>;
  defaultTo?: string;
  defaultCc?: string[];
  defaultSubject?: string;
  defaultBody?: string;
  replyTo?: any;
  accounts?: Array<{ id: string; email: string }>;
  selectedAccountId?: string;
}

interface EmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments: File[];
  priority: 'high' | 'normal' | 'low';
  accountId?: string;
}

export default function ComposeEmailModal({
  isOpen,
  onClose,
  onSend,
  onDraftSave,
  onAIDraft,
  defaultTo = '',
  defaultCc = [],
  defaultSubject = '',
  defaultBody = '',
  replyTo,
  accounts = [],
  selectedAccountId,
}: ComposeEmailModalProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [showCc, setShowCc] = useState(defaultCc.length > 0);
  const [showBcc, setShowBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  
  const [emailData, setEmailData] = useState<EmailData>({
    to: defaultTo ? [defaultTo] : [],
    cc: defaultCc || [],
    bcc: [],
    subject: replyTo ? `Re: ${replyTo.subject}` : defaultSubject,
    body: defaultBody,
    attachments: [],
    priority: 'normal',
    accountId: selectedAccountId,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.focus();
    }
  }, [isOpen]);

  // Update email data when props change
  useEffect(() => {
    if (isOpen) {
      setEmailData({
        to: defaultTo ? [defaultTo] : [],
        cc: defaultCc || [],
        bcc: [],
        subject: replyTo ? `Re: ${replyTo.subject}` : defaultSubject,
        body: defaultBody,
        attachments: [],
        priority: 'normal',
        accountId: selectedAccountId,
      });
      setShowCc(defaultCc.length > 0);
      setShowBcc(false);
    }
  }, [isOpen, defaultTo, defaultCc, defaultSubject, defaultBody, replyTo, selectedAccountId]);

  const handleSend = async () => {
    setIsSending(true);
    try {
      await onSend(emailData);
      onClose();
    } catch (error) {
      console.error('Failed to send email:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleDraftSave = async () => {
    if (!onDraftSave) return;
    setIsDrafting(true);
    try {
      await onDraftSave(emailData);
    } catch (error) {
      console.error('Failed to save draft:', error);
    } finally {
      setIsDrafting(false);
    }
  };

  const handleAIGenerate = async () => {
    if (!onAIDraft || !aiPrompt) return;
    try {
      const generatedContent = await onAIDraft(aiPrompt);
      setEmailData(prev => ({ ...prev, body: generatedContent }));
      setShowAIAssist(false);
      setAiPrompt('');
    } catch (error) {
      console.error('Failed to generate AI content:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setEmailData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files],
    }));
  };

  const removeAttachment = (index: number) => {
    setEmailData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              'bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col',
              isMaximized 
                ? 'w-full h-full' 
                : `w-full max-w-4xl max-h-[95vh] ${
                    showCc || showBcc 
                      ? 'h-auto min-h-[600px]' // Dynamic height when CC/BCC shown
                      : 'h-[90vh] max-h-[800px]'  // Fixed height when compact
                  }`,
              isMinimized && 'h-16'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {replyTo ? 'Reply' : 'New Message'}
                </h2>
              </div>
              
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMinimized(!isMinimized)}
                      >
                        <Minimize2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Minimize</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsMaximized(!isMaximized)}
                      >
                        <Maximize2 className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Maximize</TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Close</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* From Account Selector */}
                {accounts.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400">From:</span>
                      <Select
                        value={emailData.accountId}
                        onValueChange={(value) => setEmailData(prev => ({ ...prev, accountId: value }))}
                      >
                        <SelectTrigger className="w-auto border-0 bg-transparent">
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {accounts.map(account => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.email}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Recipients */}
                <div className="px-4 py-3 space-y-2 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">To:</span>
                    <Input
                      type="email"
                      placeholder="Recipients"
                      value={emailData.to.join(', ')}
                      onChange={(e) => setEmailData(prev => ({
                        ...prev,
                        to: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                      }))}
                      className="flex-1 border-0 bg-transparent focus:ring-0"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowCc(!showCc)}
                      className="text-xs"
                    >
                      Cc
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowBcc(!showBcc)}
                      className="text-xs"
                    >
                      Bcc
                    </Button>
                  </div>
                  
                  {showCc && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">Cc:</span>
                      <Input
                        type="email"
                        placeholder="Cc recipients"
                        value={emailData.cc.join(', ')}
                        onChange={(e) => setEmailData(prev => ({
                          ...prev,
                          cc: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }))}
                        className="flex-1 border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                  )}
                  
                  {showBcc && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-12">Bcc:</span>
                      <Input
                        type="email"
                        placeholder="Bcc recipients"
                        value={emailData.bcc.join(', ')}
                        onChange={(e) => setEmailData(prev => ({
                          ...prev,
                          bcc: e.target.value.split(',').map(email => email.trim()).filter(Boolean)
                        }))}
                        className="flex-1 border-0 bg-transparent focus:ring-0"
                      />
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
                  <Input
                    type="text"
                    placeholder="Subject"
                    value={emailData.subject}
                    onChange={(e) => setEmailData(prev => ({ ...prev, subject: e.target.value }))}
                    className="text-lg font-medium border-0 bg-transparent focus:ring-0"
                  />
                </div>

                {/* Body */}
                <div className="flex-1 px-4 py-4 overflow-auto min-h-0">
                  {showAIAssist && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mb-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-1" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                            AI Writing Assistant
                          </p>
                          <Textarea
                            placeholder="Describe what you want to write..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            className="min-h-[60px] mb-2"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={handleAIGenerate}
                              disabled={!aiPrompt}
                              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                            >
                              Generate
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowAIAssist(false)}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <RichTextEditor
                    value={emailData.body}
                    onChange={(value) => setEmailData(prev => ({ ...prev, body: value }))}
                    placeholder="Write your message..."
                    height={showCc || showBcc ? "250px" : "300px"} // Adjust height based on CC/BCC
                    className="border-0 bg-transparent"
                  />
                </div>

                {/* Attachments */}
                {emailData.attachments.length > 0 && (
                  <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-800">
                    <div className="flex flex-wrap gap-2">
                      {emailData.attachments.map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span className="text-sm">{file.name}</span>
                          <button
                            onClick={() => removeAttachment(index)}
                            className="ml-1 hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileSelect}
                    />
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Attach files</TooltipContent>
                      </Tooltip>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowAIAssist(!showAIAssist)}
                          >
                            <Sparkles className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>AI Assistant</TooltipContent>
                      </Tooltip>
                      
                      <Separator orientation="vertical" className="h-6" />
                      
                      <Select
                        value={emailData.priority}
                        onValueChange={(value: 'high' | 'normal' | 'low') => 
                          setEmailData(prev => ({ ...prev, priority: value }))
                        }
                      >
                        <SelectTrigger className="w-[120px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high">High Priority</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="low">Low Priority</SelectItem>
                        </SelectContent>
                      </Select>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {onDraftSave && (
                      <Button
                        variant="outline"
                        onClick={handleDraftSave}
                        disabled={isDrafting}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Draft
                      </Button>
                    )}
                    
                    <Button
                      onClick={handleSend}
                      disabled={isSending || emailData.to.length === 0}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                    >
                      {isSending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}