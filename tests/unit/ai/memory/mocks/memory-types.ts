// Mock types for AI memory system

// Define the memory types enum here to avoid import issues
export enum AIMemoryType {
  CONVERSATION = 'conversation',
  DOCUMENT = 'document',
  NOTE = 'note',
  TASK = 'task',
  SUMMARY = 'summary',
  USER_PROFILE = 'user_profile',
  SYSTEM_MESSAGE = 'system_message',
  PREFERENCE = 'preference',
  FEEDBACK = 'feedback',
  INSIGHT = 'insight'
}

export interface MemoryContext {
  memories: any[];
  contextId: string;
  metadata: any;
  query?: string;
  totalTokens?: number;
  truncated?: boolean;
  relevanceScore?: number;
}

/**
 * Interface for memory context config
 */
export interface MemoryContextConfig {
  maxContextSize: number;
  relevanceThreshold: number;
  subscriptionTier: string;
  enableContextPersistence: boolean;
  enableCrossUserMemories: boolean;
  enableLongTermMemory?: boolean;
  enableMemoryCompression?: boolean;
  enableContextPrioritization?: boolean;
  enableContextSharing?: boolean;
  enableContextFeedback: boolean;
  enableImportanceScoring: boolean;
  featureFlags: {
    enableContextPersistence: boolean;
    enableCrossUserMemories: boolean;
  };
}

/**
 * Interface for memory context result
 */
export interface MemoryContextResult extends MemoryContext {
  relevantMemories?: AIMemory[];
  totalTokens?: number;
}

/**
 * Interface for AI memory
 */
export interface AIMemory {
  id: string;
  memoryType: AIMemoryType;
  content: string;
  importanceScore: number;
  createdAt: Date;
  userId: string;
  metadata?: Record<string, any>;
  organizationId: string;
  content_embedding?: number[];
  relevanceScore?: number;
}

/**
 * Interface for context request
 */
export interface ContextRequest {
  query: string;
  userId?: string;
  organizationId: string;
  agentId?: string;
  contextId?: string;
  conversationId?: string;
  maxTokens?: number;
  metadata?: any;
}

/**
 * Interface for context provider config
 */
export interface ContextProviderConfig {
  maxContextSize: number;
  relevanceThreshold: number;
  subscriptionTier: string;
  enableContextPersistence: boolean;
  enableContextFeedback: boolean;
  enableImportanceScoring: boolean;
  enableMemoryCompression: boolean;
  featureFlags: {
    enableContextPersistence: boolean;
    enableCrossUserMemories: boolean;
  };
}
