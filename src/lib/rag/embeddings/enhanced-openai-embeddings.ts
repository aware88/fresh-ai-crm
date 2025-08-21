import OpenAI from 'openai';
import { OpenAIEmbeddings } from '../../ai/embeddings/openai-embeddings';

/**
 * Enhanced OpenAI Embeddings Service for RAG System
 * Extends the existing OpenAI embeddings with RAG-specific optimizations
 */
export class EnhancedOpenAIEmbeddings extends OpenAIEmbeddings {
  private rateLimitDelay: number = 100; // ms between requests
  private maxRetries: number = 3;
  private batchSize: number = 100; // OpenAI limit is 2048, but we use smaller batches for reliability

  constructor(apiKey: string, model = 'text-embedding-ada-002') {
    super(apiKey, model);
  }

  /**
   * Generate embeddings with enhanced error handling and rate limiting
   */
  async getEmbeddingWithRetry(text: string, retryCount = 0): Promise<number[]> {
    try {
      // Add delay for rate limiting
      if (retryCount > 0) {
        await this.delay(this.rateLimitDelay * Math.pow(2, retryCount));
      }

      return await this.getEmbedding(text);
    } catch (error: any) {
      if (retryCount < this.maxRetries) {
        console.warn(`Embedding generation failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error.message);
        return this.getEmbeddingWithRetry(text, retryCount + 1);
      }
      
      console.error('Failed to generate embedding after all retries:', error);
      throw new Error(`Embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Generate embeddings for multiple texts with optimized batching
   */
  async getBatchEmbeddingsWithRetry(texts: string[], retryCount = 0): Promise<number[][]> {
    try {
      // Add delay for rate limiting
      if (retryCount > 0) {
        await this.delay(this.rateLimitDelay * Math.pow(2, retryCount));
      }

      // If batch is too large, split it
      if (texts.length > this.batchSize) {
        return this.processBatchesSequentially(texts);
      }

      return await this.getBatchEmbeddings(texts);
    } catch (error: any) {
      if (retryCount < this.maxRetries) {
        console.warn(`Batch embedding generation failed, retrying (${retryCount + 1}/${this.maxRetries}):`, error.message);
        return this.getBatchEmbeddingsWithRetry(texts, retryCount + 1);
      }
      
      console.error('Failed to generate batch embeddings after all retries:', error);
      throw new Error(`Batch embedding generation failed: ${error.message}`);
    }
  }

  /**
   * Process large batches by splitting them into smaller chunks
   */
  private async processBatchesSequentially(texts: string[]): Promise<number[][]> {
    const results: number[][] = [];
    
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      console.log(`Processing embedding batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(texts.length / this.batchSize)}`);
      
      const batchResults = await this.getBatchEmbeddingsWithRetry(batch);
      results.push(...batchResults);
      
      // Add delay between batches to respect rate limits
      if (i + this.batchSize < texts.length) {
        await this.delay(this.rateLimitDelay);
      }
    }
    
    return results;
  }

  /**
   * Generate embedding with content preprocessing
   */
  async getOptimizedEmbedding(content: string, options: {
    maxLength?: number;
    cleanText?: boolean;
    preserveStructure?: boolean;
  } = {}): Promise<number[]> {
    const {
      maxLength = 8000, // Safe limit for text-embedding-ada-002
      cleanText = true,
      preserveStructure = false
    } = options;

    let processedContent = content;

    // Clean text if requested
    if (cleanText) {
      processedContent = this.cleanTextForEmbedding(processedContent);
    }

    // Truncate if too long
    if (processedContent.length > maxLength) {
      if (preserveStructure) {
        // Try to truncate at sentence boundaries
        processedContent = this.truncateAtSentenceBoundary(processedContent, maxLength);
      } else {
        processedContent = processedContent.substring(0, maxLength);
      }
    }

    return this.getEmbeddingWithRetry(processedContent);
  }

  /**
   * Clean text for better embedding quality
   */
  private cleanTextForEmbedding(text: string): string {
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove control characters
      .replace(/[\x00-\x1F\x7F]/g, '')
      // Remove excessive punctuation
      .replace(/[.]{3,}/g, '...')
      // Normalize quotes
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
      // Trim
      .trim();
  }

  /**
   * Truncate text at sentence boundary to preserve meaning
   */
  private truncateAtSentenceBoundary(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.substring(0, maxLength);
    const lastSentenceEnd = Math.max(
      truncated.lastIndexOf('.'),
      truncated.lastIndexOf('!'),
      truncated.lastIndexOf('?')
    );

    if (lastSentenceEnd > maxLength * 0.7) {
      // If we can preserve at least 70% of content with sentence boundary
      return truncated.substring(0, lastSentenceEnd + 1);
    }

    // Otherwise, just truncate at word boundary
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    return lastSpaceIndex > maxLength * 0.8 
      ? truncated.substring(0, lastSpaceIndex)
      : truncated;
  }

  /**
   * Calculate similarity between two embeddings
   */
  calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] * embedding1[i];
      norm2 += embedding2[i] * embedding2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * Validate embedding dimensions
   */
  validateEmbedding(embedding: number[]): boolean {
    return Array.isArray(embedding) && 
           embedding.length === this.getEmbeddingDimension() &&
           embedding.every(num => typeof num === 'number' && !isNaN(num));
  }

  /**
   * Get embedding statistics
   */
  getEmbeddingStats(embedding: number[]): {
    dimension: number;
    magnitude: number;
    mean: number;
    std: number;
    min: number;
    max: number;
  } {
    const dimension = embedding.length;
    const sum = embedding.reduce((a, b) => a + b, 0);
    const mean = sum / dimension;
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    
    const variance = embedding.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / dimension;
    const std = Math.sqrt(variance);
    
    const min = Math.min(...embedding);
    const max = Math.max(...embedding);

    return { dimension, magnitude, mean, std, min, max };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get model information
   */
  getModelInfo(): {
    model: string;
    dimensions: number;
    maxTokens: number;
    costPer1kTokens: number;
  } {
    return {
      model: 'text-embedding-ada-002',
      dimensions: this.getEmbeddingDimension(),
      maxTokens: 8191,
      costPer1kTokens: 0.0001 // As of 2024, subject to change
    };
  }
}


