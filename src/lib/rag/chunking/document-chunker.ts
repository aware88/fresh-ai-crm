import { ChunkingConfig, DocumentChunk } from '../../types/rag';

/**
 * Document Chunking Service for RAG System
 * Intelligently splits documents into optimal chunks for embedding and retrieval
 */
export class DocumentChunker {
  private defaultConfig: ChunkingConfig = {
    chunkSize: 1000,        // Target tokens per chunk
    chunkOverlap: 200,      // Overlap between chunks
    preserveStructure: true, // Try to preserve paragraph boundaries
    minChunkSize: 100,      // Minimum chunk size
    maxChunkSize: 1500,     // Maximum chunk size
    separators: ['\n\n', '\n', '. ', '! ', '? ', '; ', ', ', ' '] // Hierarchy of separators
  };

  /**
   * Chunk a document into optimal pieces
   */
  async chunkDocument(
    content: string, 
    config: Partial<ChunkingConfig> = {}
  ): Promise<DocumentChunk[]> {
    const finalConfig = { ...this.defaultConfig, ...config };
    
    if (!content || content.trim().length === 0) {
      throw new Error('Content cannot be empty');
    }

    // Clean and normalize content
    const cleanContent = this.preprocessContent(content);
    
    // Split into chunks
    const chunks = this.splitIntoChunks(cleanContent, finalConfig);
    
    // Add overlap and metadata
    const processedChunks = this.addOverlapAndMetadata(chunks, finalConfig);
    
    // Validate chunks
    const validChunks = this.validateChunks(processedChunks, finalConfig);
    
    console.log(`Chunked document into ${validChunks.length} chunks (avg: ${Math.round(validChunks.reduce((sum, c) => sum + c.tokenCount, 0) / validChunks.length)} tokens per chunk)`);
    
    return validChunks;
  }

  /**
   * Chunk product data specifically
   */
  async chunkProductData(
    productData: {
      name: string;
      sku?: string;
      description?: string;
      category?: string;
      specifications?: Record<string, any>;
      attributes?: Record<string, any>;
    },
    config: Partial<ChunkingConfig> = {}
  ): Promise<DocumentChunk[]> {
    // Format product data for optimal chunking
    const formattedContent = this.formatProductContent(productData);
    
    // Use smaller chunks for structured product data
    const productConfig: Partial<ChunkingConfig> = {
      chunkSize: 500,
      chunkOverlap: 100,
      preserveStructure: true,
      ...config
    };
    
    return this.chunkDocument(formattedContent, productConfig);
  }

  /**
   * Chunk document with metadata preservation
   */
  async chunkDocumentWithMetadata(
    content: string,
    metadata: Record<string, any> = {},
    config: Partial<ChunkingConfig> = {}
  ): Promise<DocumentChunk[]> {
    const chunks = await this.chunkDocument(content, config);
    
    // Add metadata to each chunk
    return chunks.map(chunk => ({
      ...chunk,
      metadata: {
        ...chunk.metadata,
        ...metadata,
        sourceMetadata: metadata
      }
    }));
  }

  /**
   * Preprocess content for better chunking
   */
  private preprocessContent(content: string): string {
    return content
      // Normalize line endings
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive whitespace but preserve structure
      .replace(/[ \t]+/g, ' ')
      // Normalize multiple newlines but preserve paragraph breaks
      .replace(/\n{3,}/g, '\n\n')
      // Trim
      .trim();
  }

  /**
   * Split content into chunks using hierarchical separators
   */
  private splitIntoChunks(content: string, config: ChunkingConfig): string[] {
    if (this.estimateTokenCount(content) <= config.chunkSize) {
      return [content];
    }

    return this.recursiveSplit(content, config.separators, config);
  }

  /**
   * Recursively split content using different separators
   */
  private recursiveSplit(
    text: string, 
    separators: string[], 
    config: ChunkingConfig
  ): string[] {
    if (separators.length === 0 || this.estimateTokenCount(text) <= config.maxChunkSize) {
      return [text];
    }

    const separator = separators[0];
    const parts = text.split(separator);
    
    if (parts.length === 1) {
      // Current separator didn't split, try next one
      return this.recursiveSplit(text, separators.slice(1), config);
    }

    const chunks: string[] = [];
    let currentChunk = '';

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const potentialChunk = currentChunk + (currentChunk ? separator : '') + part;
      
      if (this.estimateTokenCount(potentialChunk) <= config.chunkSize) {
        currentChunk = potentialChunk;
      } else {
        // Current chunk is full
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        
        // If this part is too large, split it further
        if (this.estimateTokenCount(part) > config.chunkSize) {
          const subChunks = this.recursiveSplit(part, separators.slice(1), config);
          chunks.push(...subChunks);
          currentChunk = '';
        } else {
          currentChunk = part;
        }
      }
    }

    // Add remaining chunk
    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  }

  /**
   * Add overlap between chunks and metadata
   */
  private addOverlapAndMetadata(chunks: string[], config: ChunkingConfig): DocumentChunk[] {
    const processedChunks: DocumentChunk[] = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      let finalContent = chunk;

      // Add overlap with previous chunk
      let overlapWithPrevious = 0;
      if (i > 0 && config.chunkOverlap > 0) {
        const prevChunk = chunks[i - 1];
        const overlapText = this.getOverlapText(prevChunk, config.chunkOverlap, 'end');
        if (overlapText) {
          finalContent = overlapText + '\n...\n' + finalContent;
          overlapWithPrevious = this.estimateTokenCount(overlapText);
        }
      }

      // Add overlap with next chunk
      let overlapWithNext = 0;
      if (i < chunks.length - 1 && config.chunkOverlap > 0) {
        const nextChunk = chunks[i + 1];
        const overlapText = this.getOverlapText(nextChunk, config.chunkOverlap, 'start');
        if (overlapText) {
          finalContent = finalContent + '\n...\n' + overlapText;
          overlapWithNext = this.estimateTokenCount(overlapText);
        }
      }

      const tokenCount = this.estimateTokenCount(finalContent);

      processedChunks.push({
        content: finalContent,
        index: i,
        tokenCount,
        overlapWithPrevious,
        overlapWithNext,
        metadata: {
          originalLength: chunk.length,
          chunkIndex: i,
          totalChunks: chunks.length,
          hasOverlap: overlapWithPrevious > 0 || overlapWithNext > 0
        },
        startPosition: 0, // Will be calculated if needed
        endPosition: finalContent.length
      });
    }

    return processedChunks;
  }

  /**
   * Get overlap text from beginning or end of chunk
   */
  private getOverlapText(text: string, targetTokens: number, position: 'start' | 'end'): string {
    const words = text.split(' ');
    const estimatedWordsNeeded = Math.floor(targetTokens * 0.75); // Rough token-to-word ratio

    if (position === 'start') {
      return words.slice(0, Math.min(estimatedWordsNeeded, words.length)).join(' ');
    } else {
      return words.slice(Math.max(0, words.length - estimatedWordsNeeded)).join(' ');
    }
  }

  /**
   * Validate chunks meet requirements
   */
  private validateChunks(chunks: DocumentChunk[], config: ChunkingConfig): DocumentChunk[] {
    return chunks.filter(chunk => {
      // Filter out chunks that are too small
      if (chunk.tokenCount < config.minChunkSize) {
        console.warn(`Filtered out chunk ${chunk.index} (${chunk.tokenCount} tokens < ${config.minChunkSize} minimum)`);
        return false;
      }

      // Filter out chunks that are too large
      if (chunk.tokenCount > config.maxChunkSize) {
        console.warn(`Filtered out chunk ${chunk.index} (${chunk.tokenCount} tokens > ${config.maxChunkSize} maximum)`);
        return false;
      }

      return true;
    });
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough approximation: 1 token ≈ 4 characters for English text
    // This is conservative to avoid exceeding limits
    return Math.ceil(text.length / 3.5);
  }

  /**
   * Format product data for optimal chunking
   */
  private formatProductContent(productData: {
    name: string;
    sku?: string;
    description?: string;
    category?: string;
    specifications?: Record<string, any>;
    attributes?: Record<string, any>;
  }): string {
    const sections: string[] = [];

    // Basic product info
    sections.push(`Product: ${productData.name}`);
    
    if (productData.sku) {
      sections.push(`SKU: ${productData.sku}`);
    }
    
    if (productData.category) {
      sections.push(`Category: ${productData.category}`);
    }

    // Description
    if (productData.description) {
      sections.push(`Description: ${productData.description}`);
    }

    // Specifications
    if (productData.specifications) {
      const specs = Object.entries(productData.specifications)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      sections.push(`Specifications:\n${specs}`);
    }

    // Attributes
    if (productData.attributes) {
      const attrs = Object.entries(productData.attributes)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
      sections.push(`Attributes:\n${attrs}`);
    }

    return sections.join('\n\n');
  }

  /**
   * Get chunking statistics
   */
  getChunkingStats(chunks: DocumentChunk[]): {
    totalChunks: number;
    averageTokens: number;
    minTokens: number;
    maxTokens: number;
    totalTokens: number;
    averageOverlap: number;
  } {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        averageTokens: 0,
        minTokens: 0,
        maxTokens: 0,
        totalTokens: 0,
        averageOverlap: 0
      };
    }

    const tokenCounts = chunks.map(c => c.tokenCount);
    const overlapCounts = chunks.map(c => c.overlapWithPrevious + c.overlapWithNext);

    return {
      totalChunks: chunks.length,
      averageTokens: Math.round(tokenCounts.reduce((sum, count) => sum + count, 0) / chunks.length),
      minTokens: Math.min(...tokenCounts),
      maxTokens: Math.max(...tokenCounts),
      totalTokens: tokenCounts.reduce((sum, count) => sum + count, 0),
      averageOverlap: Math.round(overlapCounts.reduce((sum, count) => sum + count, 0) / chunks.length)
    };
  }
}


