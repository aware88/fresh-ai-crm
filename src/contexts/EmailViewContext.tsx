'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type EmailViewMode = 'list' | 'detail' | 'split-reply' | 'split-compose';
export type ReplyMode = 'reply' | 'replyAll' | 'forward' | 'new';

interface EmailViewContextType {
  viewMode: EmailViewMode;
  replyMode: ReplyMode;
  selectedEmailId: string | null;
  emailData: any;
  showDraftWindow: boolean;
  isGeneratingDraft: boolean;
  setViewMode: (mode: EmailViewMode) => void;
  setReplyMode: (mode: ReplyMode) => void;
  setSelectedEmailId: (id: string | null) => void;
  setEmailData: (data: any) => void;
  setShowDraftWindow: (show: boolean) => void;
  setIsGeneratingDraft: (generating: boolean) => void;
  startReply: (emailId: string, emailData: any, mode: ReplyMode) => void;
  closeDraftWindow: () => void;
  backToList: () => void;
}

const EmailViewContext = createContext<EmailViewContextType | undefined>(undefined);

interface EmailViewProviderProps {
  children: ReactNode;
}

export function EmailViewProvider({ children }: EmailViewProviderProps) {
  const [viewMode, setViewMode] = useState<EmailViewMode>('list');
  const [replyMode, setReplyMode] = useState<ReplyMode>('reply');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [emailData, setEmailData] = useState<any>(null);
  const [showDraftWindow, setShowDraftWindow] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const startReply = (emailId: string, emailData: any, mode: ReplyMode) => {
    setSelectedEmailId(emailId);
    setEmailData(emailData);
    setReplyMode(mode);
    setViewMode('split-reply');
    setShowDraftWindow(true);
    
    // Start generating draft automatically
    setIsGeneratingDraft(true);
    // The actual generation will be handled by the AIDraftWindow component
  };

  const closeDraftWindow = () => {
    setShowDraftWindow(false);
    setIsGeneratingDraft(false);
    // Keep the email selected but switch to detail view
    if (selectedEmailId) {
      setViewMode('detail');
    } else {
      setViewMode('list');
    }
  };

  const backToList = () => {
    setViewMode('list');
    setSelectedEmailId(null);
    setEmailData(null);
    setShowDraftWindow(false);
    setIsGeneratingDraft(false);
  };

  return (
    <EmailViewContext.Provider value={{
      viewMode,
      replyMode,
      selectedEmailId,
      emailData,
      showDraftWindow,
      isGeneratingDraft,
      setViewMode,
      setReplyMode,
      setSelectedEmailId,
      setEmailData,
      setShowDraftWindow,
      setIsGeneratingDraft,
      startReply,
      closeDraftWindow,
      backToList
    }}>
      {children}
    </EmailViewContext.Provider>
  );
}

export function useEmailView() {
  const context = useContext(EmailViewContext);
  if (context === undefined) {
    throw new Error('useEmailView must be used within an EmailViewProvider');
  }
  return context;
}


