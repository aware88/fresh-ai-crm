import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { 
  IngestContent, 
  IngestOptions, 
  IngestResult, 
  RetrievalOptions, 
  RetrievedChunk, 
  RetrievalResult,
  QueryContext,
  RAGResponse,
  RAGKnowledgeBase,
  RAGChunk,
  RAGSourceType,
  Citation,
  ChunkingConfig
} from '@/types/rag';
import { EnhancedOpenAIEmbeddings } from './embeddings/enhanced-openai-embeddings';
import { DocumentChunker } from './chunking/document-chunker';
import { createHash } from 'crypto';
import OpenAI from 'openai';

/**
 * Unified RAG Service
 * Central service for all RAG operations across the CRM system
 * Integrates seamlessly with existing AI infrastructure
 */
export class UnifiedRAGService {
  private supabase: SupabaseClient<Database>;
  private embeddings: EnhancedOpenAIEmbeddings;
  private chunker: DocumentChunker;
  private openai: OpenAI;

  constructor(
    supabase: SupabaseClient<Database>,
    openaiApiKey: string
  ) {
    this.supabase = supabase;
    this.embeddings = new EnhancedOpenAIEmbeddings(openaiApiKey);
    this.chunker = new DocumentChunker();
    this.openai = new OpenAI({ apiKey: openaiApiKey });
  }

  // ===================
  // INGESTION METHODS
  // ===================

  /**
   * Ingest content into the RAG system
   */
  async ingestContent(
    organizationId: string,
    content: IngestContent,
    options: IngestOptions = {}
  ): Promise<IngestResult> {
    const startTime = Date.now();
    
    try {
      console.log(`[RAG] Ingesting ${content.sourceType} content: ${content.title}`);
      
      // Check if content already exists (unless forced update)
      if (!content.forceUpdate && options.skipIfExists) {
        const existing = await this.findExistingContent(organizationId, content);
        if (existing) {
          console.log(`[RAG] Content already exists, skipping ingestion`);
          return {
            knowledgeBaseId: existing.id,
            chunksCreated: 0,
            tokensProcessed: 0,
            processingTimeMs: Date.now() - startTime,
            success: true
          };
        }
      }

      // Create content hash for deduplication
      const contentHash = this.createContentHash(content.content);

      // Create or update knowledge base entry
      const knowledgeBase = await this.upsertKnowledgeBase(
        organizationId, 
        content, 
        contentHash
      );

      // Chunk the content
      const chunkingConfig: Partial<ChunkingConfig> = {
        chunkSize: options.chunkSize || 1000,
        chunkOverlap: options.chunkOverlap || 200,
        preserveStructure: options.preserveStructure ?? true
      };

      const chunks = content.sourceType === 'product' 
        ? await this.chunkProductContent(content, chunkingConfig)
        : await this.chunker.chunkDocument(content.content, chunkingConfig);

      // Generate embeddings for chunks
      const chunkContents = chunks.map(chunk => chunk.content);
      const embeddings = await this.embeddings.getBatchEmbeddingsWithRetry(chunkContents);

      // Store chunks with embeddings
      const ragChunks: Omit<RAGChunk, 'id' | 'created_at'>[] = chunks.map((chunk, index) => ({
        knowledge_base_id: knowledgeBase.id,
        organization_id: organizationId,
        content: chunk.content,
        embedding: embeddings[index],
        chunk_index: chunk.index,
        chunk_size: chunk.tokenCount,
        token_count: chunk.tokenCount,
        overlap_with_previous: chunk.overlapWithPrevious,
        overlap_with_next: chunk.overlapWithNext,
        metadata: {
          ...chunk.metadata,
          ...options.customMetadata
        }
      }));

      // Insert chunks in batches
      await this.insertChunksBatch(ragChunks);

      const totalTokens = chunks.reduce((sum, chunk) => sum + chunk.tokenCount, 0);
      const processingTime = Date.now() - startTime;

      console.log(`[RAG] Successfully ingested content: ${chunks.length} chunks, ${totalTokens} tokens, ${processingTime}ms`);

      return {
        knowledgeBaseId: knowledgeBase.id,
        chunksCreated: chunks.length,
        tokensProcessed: totalTokens,
        processingTimeMs: processingTime,
        success: true
      };

    } catch (error) {
      console.error('[RAG] Ingestion failed:', error);
      return {
        knowledgeBaseId: '',
        chunksCreated: 0,
        tokensProcessed: 0,
        processingTimeMs: Date.now() - startTime,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Batch ingest multiple content items
   */
  async ingestBatch(
    organizationId: string,
    contents: IngestContent[],
    options: IngestOptions = {}
  ): Promise<IngestResult[]> {
    const results: IngestResult[] = [];
    
    for (const content of contents) {
      const result = await this.ingestContent(organizationId, content, options);
      results.push(result);
      
      // Small delay to prevent overwhelming the system
      await this.delay(100);
    }
    
    return results;
  }

  // ===================
  // RETRIEVAL METHODS
  // ===================

  /**
   * Retrieve relevant content for a query
   */
  async retrieveRelevantContent(
    query: string,
    organizationId: string,
    options: RetrievalOptions = {}
  ): Promise<RetrievalResult> {
    const startTime = Date.now();
    const queryId = this.generateQueryId();

    try {
      console.log(`[RAG] Retrieving content for query: "${query.substring(0, 100)}..."`);

      // Generate query embedding
      const queryEmbedding = await this.embeddings.getEmbeddingWithRetry(query);

      // Perform similarity search
      const chunks = await this.performSimilaritySearch(
        queryEmbedding,
        organizationId,
        options
      );

      // Convert to RetrievedChunk format
      const retrievedChunks: RetrievedChunk[] = chunks.map(chunk => ({
        id: chunk.chunk_id,
        content: chunk.content,
        similarity: chunk.similarity,
        source: {
          knowledgeBaseId: chunk.knowledge_base_id,
          sourceType: chunk.source_type as RAGSourceType,
          sourceId: chunk.metadata?.sourceId,
          title: chunk.title
        },
        metadata: chunk.metadata || {},
        chunkIndex: chunk.metadata?.chunkIndex || 0,
        tokenCount: chunk.metadata?.tokenCount
      }));

      const processingTime = Date.now() - startTime;

      // Log query for analytics
      await this.logQuery(queryId, query, organizationId, retrievedChunks, processingTime);

      console.log(`[RAG] Retrieved ${retrievedChunks.length} relevant chunks in ${processingTime}ms`);

      return {
        chunks: retrievedChunks,
        totalFound: retrievedChunks.length,
        processingTimeMs: processingTime,
        queryId
      };

    } catch (error) {
      console.error('[RAG] Retrieval failed:', error);
      return {
        chunks: [],
        totalFound: 0,
        processingTimeMs: Date.now() - startTime,
        queryId
      };
    }
  }

  /**
   * Query with AI generation
   */
  async queryWithGeneration(
    query: string,
    organizationId: string,
    context: QueryContext
  ): Promise<RAGResponse> {
    const startTime = Date.now();

    try {
      console.log(`[RAG] Generating response for query: "${query.substring(0, 100)}..."`);

      // Retrieve relevant content
      const retrievalResult = await this.retrieveRelevantContent(
        query,
        organizationId,
        {
          sourceTypes: this.determineRelevantSources(query, context),
          limit: 5,
          similarityThreshold: 0.7
        }
      );

      if (retrievalResult.chunks.length === 0) {
        return {
          answer: "I don't have enough relevant information to answer your question accurately.",
          confidence: 0.1,
          sources: [],
          citations: [],
          contextUsed: '',
          tokensUsed: 0,
          processingTimeMs: Date.now() - startTime,
          queryId: retrievalResult.queryId
        };
      }

      // Build context from retrieved chunks
      const contextText = this.buildContextFromChunks(retrievalResult.chunks);
      
      // Generate response using OpenAI
      const response = await this.generateResponse(query, contextText, context);
      
      // Create citations
      const citations = this.createCitations(retrievalResult.chunks);

      const processingTime = Date.now() - startTime;

      console.log(`[RAG] Generated response with ${citations.length} citations in ${processingTime}ms`);

      return {
        answer: response.content,
        confidence: this.calculateConfidence(retrievalResult.chunks, response.content),
        sources: retrievalResult.chunks,
        citations,
        contextUsed: contextText,
        tokensUsed: response.tokensUsed,
        processingTimeMs: processingTime,
        queryId: retrievalResult.queryId
      };

    } catch (error) {
      console.error('[RAG] Generation failed:', error);
      return {
        answer: "I encountered an error while processing your request. Please try again.",
        confidence: 0,
        sources: [],
        citations: [],
        contextUsed: '',
        tokensUsed: 0,
        processingTimeMs: Date.now() - startTime,
        queryId: this.generateQueryId()
      };
    }
  }

  // ===================
  // PRIVATE METHODS
  // ===================

  private async findExistingContent(
    organizationId: string, 
    content: IngestContent
  ): Promise<RAGKnowledgeBase | null> {
    const contentHash = this.createContentHash(content.content);
    
    const { data, error } = await this.supabase
      .from('rag_knowledge_base')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('source_type', content.sourceType)
      .eq('content_hash', contentHash)
      .eq('status', 'active')
      .single();

    if (error || !data) return null;
    return data as RAGKnowledgeBase;
  }

  private createContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async upsertKnowledgeBase(
    organizationId: string,
    content: IngestContent,
    contentHash: string
  ): Promise<RAGKnowledgeBase> {
    const knowledgeBaseData = {
      organization_id: organizationId,
      source_type: content.sourceType,
      source_id: content.sourceId,
      title: content.title,
      content: content.content,
      content_hash: contentHash,
      metadata: content.metadata || {},
      status: 'active' as const,
      embedding_model: 'text-embedding-ada-002',
      embedding_dimensions: 1536,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('rag_knowledge_base')
      .upsert(knowledgeBaseData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to upsert knowledge base: ${error.message}`);
    }

    return data as RAGKnowledgeBase;
  }

  private async chunkProductContent(
    content: IngestContent,
    config: Partial<ChunkingConfig>
  ) {
    // For products, try to extract structured data from metadata
    const productData = {
      name: content.title,
      sku: content.metadata?.sku,
      description: content.content,
      category: content.metadata?.category,
      specifications: content.metadata?.specifications,
      attributes: content.metadata?.attributes
    };

    return this.chunker.chunkProductData(productData, config);
  }

  private async insertChunksBatch(chunks: Omit<RAGChunk, 'id' | 'created_at'>[]): Promise<void> {
    const batchSize = 100; // Supabase batch size limit
    
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const { error } = await this.supabase
        .from('rag_chunks')
        .insert(batch);

      if (error) {
        throw new Error(`Failed to insert chunk batch: ${error.message}`);
      }
    }
  }

  private async performSimilaritySearch(
    queryEmbedding: number[],
    organizationId: string,
    options: RetrievalOptions
  ): Promise<any[]> {
    const {
      sourceTypes,
      limit = 10,
      similarityThreshold = 0.7
    } = options;

    const { data, error } = await this.supabase.rpc(
      'rag_similarity_search',
      {
        query_embedding: queryEmbedding,
        org_id: organizationId,
        source_types: sourceTypes || null,
        similarity_threshold: similarityThreshold,
        max_results: limit
      }
    );

    if (error) {
      throw new Error(`Similarity search failed: ${error.message}`);
    }

    return data || [];
  }

  private determineRelevantSources(query: string, context: QueryContext): RAGSourceType[] {
    const sources: RAGSourceType[] = [];
    const lowerQuery = query.toLowerCase();

    // Product-related keywords
    if (lowerQuery.includes('product') || lowerQuery.includes('item') || 
        lowerQuery.includes('buy') || lowerQuery.includes('price') ||
        lowerQuery.includes('specification') || lowerQuery.includes('feature')) {
      sources.push('product', 'metakocka');
    }

    // Document-related keywords
    if (lowerQuery.includes('document') || lowerQuery.includes('file') ||
        lowerQuery.includes('manual') || lowerQuery.includes('guide')) {
      sources.push('document');
    }

    // Contact-related keywords
    if (lowerQuery.includes('contact') || lowerQuery.includes('customer') ||
        lowerQuery.includes('client') || lowerQuery.includes('person')) {
      sources.push('contact');
    }

    // If no specific sources identified, include all
    if (sources.length === 0) {
      sources.push('product', 'document', 'metakocka', 'contact');
    }

    return sources;
  }

  private buildContextFromChunks(chunks: RetrievedChunk[]): string {
    return chunks
      .map((chunk, index) => `[${index + 1}] ${chunk.source.title}\n${chunk.content}`)
      .join('\n\n---\n\n');
  }

  private async generateResponse(
    query: string,
    context: string,
    queryContext: QueryContext
  ): Promise<{ content: string; tokensUsed: number }> {
    const systemPrompt = `You are an intelligent AI assistant for a CRM system. Use the provided context to answer questions accurately and helpfully.

Context Information:
${context}

Instructions:
- Answer based on the provided context
- If the context doesn't contain enough information, say so
- Include specific details when available
- Be concise but comprehensive
- Use a professional, helpful tone
- Reference specific sources when making claims`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query }
      ],
      temperature: 0.3,
      max_tokens: 500
    });

    return {
      content: response.choices[0]?.message?.content || 'No response generated',
      tokensUsed: response.usage?.total_tokens || 0
    };
  }

  private createCitations(chunks: RetrievedChunk[]): Citation[] {
    return chunks.map((chunk, index) => ({
      id: chunk.id,
      title: chunk.source.title,
      sourceType: chunk.source.sourceType,
      score: chunk.similarity,
      excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '...' : '')
    }));
  }

  private calculateConfidence(chunks: RetrievedChunk[], response: string): number {
    if (chunks.length === 0) return 0.1;
    
    const avgSimilarity = chunks.reduce((sum, chunk) => sum + chunk.similarity, 0) / chunks.length;
    const responseLength = response.length;
    
    // Simple confidence calculation based on similarity and response completeness
    const similarityScore = avgSimilarity;
    const completenessScore = Math.min(responseLength / 100, 1); // Normalize response length
    
    return Math.min((similarityScore * 0.7 + completenessScore * 0.3), 0.95);
  }

  private async logQuery(
    queryId: string,
    query: string,
    organizationId: string,
    chunks: RetrievedChunk[],
    processingTime: number
  ): Promise<void> {
    try {
      const queryEmbedding = await this.embeddings.getEmbeddingWithRetry(query);
      
      await this.supabase
        .from('rag_query_history')
        .insert({
          id: queryId,
          organization_id: organizationId,
          query_text: query,
          query_embedding: queryEmbedding,
          source_types: Array.from(new Set(chunks.map(c => c.source.sourceType))),
          chunk_ids: chunks.map(c => c.id),
          response_generated: true,
          processing_time_ms: processingTime
        });
    } catch (error) {
      console.warn('[RAG] Failed to log query:', error);
    }
  }

  private generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ===================
  // PUBLIC UTILITIES
  // ===================

  /**
   * Get RAG system statistics
   */
  async getSystemStats(organizationId: string): Promise<{
    totalKnowledgeBases: number;
    totalChunks: number;
    sourceTypeBreakdown: Record<string, number>;
    averageChunkSize: number;
    lastUpdated: string;
  }> {
    const { data: kbData } = await this.supabase
      .from('rag_knowledge_base')
      .select('source_type, updated_at')
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    const { data: chunkData } = await this.supabase
      .from('rag_chunks')
      .select('chunk_size')
      .eq('organization_id', organizationId);

    const sourceTypeBreakdown: Record<string, number> = {};
    kbData?.forEach(kb => {
      sourceTypeBreakdown[kb.source_type] = (sourceTypeBreakdown[kb.source_type] || 0) + 1;
    });

    const averageChunkSize = chunkData?.length 
      ? chunkData.reduce((sum, chunk) => sum + (chunk.chunk_size || 0), 0) / chunkData.length
      : 0;

    const lastUpdated = kbData?.length 
      ? Math.max(...kbData.map(kb => new Date(kb.updated_at).getTime())).toString()
      : new Date().toISOString();

    return {
      totalKnowledgeBases: kbData?.length || 0,
      totalChunks: chunkData?.length || 0,
      sourceTypeBreakdown,
      averageChunkSize: Math.round(averageChunkSize),
      lastUpdated
    };
  }

  /**
   * Delete knowledge base and all associated chunks
   */
  async deleteKnowledgeBase(knowledgeBaseId: string, organizationId: string): Promise<boolean> {
    try {
      // Delete chunks first (foreign key constraint)
      await this.supabase
        .from('rag_chunks')
        .delete()
        .eq('knowledge_base_id', knowledgeBaseId)
        .eq('organization_id', organizationId);

      // Delete knowledge base
      const { error } = await this.supabase
        .from('rag_knowledge_base')
        .delete()
        .eq('id', knowledgeBaseId)
        .eq('organization_id', organizationId);

      return !error;
    } catch (error) {
      console.error('[RAG] Failed to delete knowledge base:', error);
      return false;
    }
  }
}


