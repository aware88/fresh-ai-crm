import OpenAI from 'openai';

/**
 * Service for generating embeddings using OpenAI's API
 */
export class OpenAIEmbeddings {
  private openai: OpenAI;
  private model: string;
  private embeddingDimension: number;
  private apiKey: string;

  /**
   * Create a new OpenAIEmbeddings instance
   * @param apiKey OpenAI API key
   * @param model Embedding model to use (defaults to text-embedding-ada-002)
   */
  constructor(apiKey: string, model = 'text-embedding-ada-002') {
    this.apiKey = apiKey;
    this.model = model;
    this.embeddingDimension = 1536; // Default for text-embedding-ada-002
    
    this.openai = new OpenAI({
      apiKey: this.apiKey
    });
  }

  /**
   * Get the embedding dimension for the current model
   */
  public getEmbeddingDimension(): number {
    return this.embeddingDimension;
  }

  /**
   * Generate an embedding for the given text
   * @param text Text to generate embedding for
   * @returns Array of numbers representing the embedding
   */
  public async getEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embedding returned from OpenAI API');
      }

      return response.data[0].embedding;
    } catch (error: unknown) {
      console.error('Error generating embedding:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate embedding: ${errorMessage}`);
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * @param texts Array of texts to generate embeddings for
   * @returns Array of embeddings
   */
  public async getBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: texts,
      });

      if (!response.data || response.data.length === 0) {
        throw new Error('No embeddings returned from OpenAI API');
      }

      // Sort by index to ensure order matches input
      return response.data
        .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
        .map((item: { embedding: number[] }) => item.embedding);
    } catch (error: unknown) {
      console.error('Error generating batch embeddings:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to generate batch embeddings: ${errorMessage}`);
    }
  }
}
