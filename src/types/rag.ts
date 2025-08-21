/**
 * RAG System Types
 * Comprehensive types for the Retrieval-Augmented Generation system
 */

// Core RAG Interfaces
export interface RAGKnowledgeBase {
  id: string;
  organization_id: string;
  source_type: RAGSourceType;
  source_id?: string;
  title: string;
  content: string;
  content_hash?: string;
  metadata: Record<string, any>;
  status: 'active' | 'archived' | 'processing';
  embedding_model: string;
  embedding_dimensions: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

export interface RAGChunk {
  id: string;
  knowledge_base_id: string;
  organization_id: string;
  content: string;
  embedding: number[];
  chunk_index: number;
  chunk_size: number;
  token_count?: number;
  overlap_with_previous: number;
  overlap_with_next: number;
  metadata: Record<string, any>;
  created_at: string;
}

export interface RAGQueryHistory {
  id: string;
  organization_id: string;
  user_id?: string;
  query_text: string;
  query_embedding?: number[];
  source_types?: string[];
  chunk_ids?: string[];
  response_generated: boolean;
  response_quality_score?: number;
  processing_time_ms?: number;
  created_at: string;
}

// Source Types
export type RAGSourceType = 
  | 'product'      // Products from local database
  | 'document'     // User uploaded documents
  | 'metakocka'    // Data from Metakocka ERP
  | 'magento'      // Products from Magento (future)
  | 'manual'       // Manually entered knowledge
  | 'email'        // Email conversations
  | 'contact'      // Contact information
  | 'supplier';    // Supplier data

// Ingestion Interfaces
export interface IngestContent {
  title: string;
  content: string;
  sourceType: RAGSourceType;
  sourceId?: string;
  metadata?: Record<string, any>;
  forceUpdate?: boolean; // Force re-ingestion even if content hasn't changed
}

export interface IngestOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  preserveStructure?: boolean;
  customMetadata?: Record<string, any>;
  skipIfExists?: boolean;
}

export interface IngestResult {
  knowledgeBaseId: string;
  chunksCreated: number;
  tokensProcessed: number;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

// Retrieval Interfaces
export interface RetrievalOptions {
  sourceTypes?: RAGSourceType[];
  limit?: number;
  similarityThreshold?: number;
  includeMetadata?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  metadataFilters?: Record<string, any>;
}

export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  source: {
    knowledgeBaseId: string;
    sourceType: RAGSourceType;
    sourceId?: string;
    title: string;
  };
  metadata: Record<string, any>;
  chunkIndex: number;
  tokenCount?: number;
}

export interface RetrievalResult {
  chunks: RetrievedChunk[];
  totalFound: number;
  processingTimeMs: number;
  queryId: string;
}

// Query and Generation Interfaces
export interface QueryContext {
  emailId?: string;
  contactId?: string;
  userId: string;
  organizationId: string;
  conversationHistory?: string[];
  userIntent?: string;
  includeRecommendations?: boolean;
  maxContextTokens?: number;
}

export interface RAGResponse {
  answer: string;
  confidence: number;
  sources: RetrievedChunk[];
  citations: Citation[];
  contextUsed: string;
  tokensUsed: number;
  processingTimeMs: number;
  queryId: string;
}

export interface Citation {
  id: string;
  title: string;
  sourceType: RAGSourceType;
  score: number;
  excerpt: string;
  url?: string;
}

// Chunking Interfaces
export interface ChunkingConfig {
  chunkSize: number;        // Target chunk size in tokens
  chunkOverlap: number;     // Overlap between chunks in tokens
  preserveStructure: boolean; // Try to preserve paragraph/section boundaries
  minChunkSize: number;     // Minimum chunk size
  maxChunkSize: number;     // Maximum chunk size
  separators: string[];     // Custom separators for chunking
}

export interface DocumentChunk {
  content: string;
  index: number;
  tokenCount: number;
  overlapWithPrevious: number;
  overlapWithNext: number;
  metadata: Record<string, any>;
  startPosition?: number;
  endPosition?: number;
}

// Source-Specific Interfaces
export interface ProductRAGContent {
  id: string;
  name: string;
  sku?: string;
  description?: string;
  category?: string;
  price?: number;
  stock?: number;
  attributes?: Record<string, any>;
  specifications?: Record<string, any>;
  tags?: string[];
}

export interface DocumentRAGContent {
  id: string;
  filename: string;
  fileType: string;
  extractedText: string;
  documentType?: string;
  uploadedBy?: string;
  processedAt?: string;
}

export interface MetakockaRAGContent {
  id: string;
  type: 'product' | 'customer' | 'order' | 'invoice';
  name: string;
  code?: string;
  description?: string;
  data: Record<string, any>;
  lastSynced: string;
}

// Analytics and Performance
export interface RAGUsageAnalytics {
  id: string;
  organization_id: string;
  date: string;
  total_queries: number;
  successful_queries: number;
  failed_queries: number;
  avg_response_time_ms: number;
  total_chunks_retrieved: number;
  unique_knowledge_bases_accessed: number;
  created_at: string;
}

export interface RAGPerformanceMetrics {
  queryLatency: number;
  retrievalAccuracy: number;
  chunkRelevance: number;
  userSatisfaction: number;
  systemLoad: number;
}

// Configuration Interfaces
export interface RAGSystemConfig {
  embedding: {
    model: string;
    dimensions: number;
    batchSize: number;
  };
  chunking: ChunkingConfig;
  retrieval: {
    defaultSimilarityThreshold: number;
    maxResults: number;
    enableReranking: boolean;
  };
  generation: {
    maxContextTokens: number;
    temperature: number;
    maxResponseTokens: number;
  };
  performance: {
    cacheEnabled: boolean;
    cacheTTL: number;
    maxConcurrentRequests: number;
  };
}

// Error Handling
export interface RAGError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
  organizationId?: string;
  userId?: string;
}

// Sync and Update Interfaces
export interface SyncStatus {
  sourceType: RAGSourceType;
  lastSyncAt: string;
  status: 'success' | 'failed' | 'in_progress';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsFailed: number;
  error?: string;
}

export interface UpdateOperation {
  operation: 'create' | 'update' | 'delete';
  sourceType: RAGSourceType;
  sourceId: string;
  content?: IngestContent;
  timestamp: string;
}

// Search and Filter Types
export interface SearchFilters {
  sourceTypes?: RAGSourceType[];
  dateRange?: {
    start: string;
    end: string;
  };
  contentTypes?: string[];
  tags?: string[];
  categories?: string[];
  minScore?: number;
  maxResults?: number;
}

export interface SearchResult {
  results: RetrievedChunk[];
  totalCount: number;
  facets: Record<string, number>;
  suggestions: string[];
  processingTime: number;
}

// Export utility types
export type RAGContentType = ProductRAGContent | DocumentRAGContent | MetakockaRAGContent;
export type RAGOperationResult<T = any> = {
  success: boolean;
  data?: T;
  error?: RAGError;
  metadata?: Record<string, any>;
};


