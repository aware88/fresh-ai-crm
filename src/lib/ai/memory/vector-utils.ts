/**
 * Utility functions for working with vector embeddings stored as JSON arrays
 * This is a fallback implementation when pgvector is not available
 */

/**
 * Calculate cosine similarity between two vectors
 * @param vec1 First vector as array of numbers
 * @param vec2 Second vector as array of numbers
 * @returns Similarity score between 0 and 1
 */
export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;
  
  // Get the minimum length to avoid index errors
  const minLength = Math.min(vec1.length, vec2.length);
  
  for (let i = 0; i < minLength; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }
  
  // Avoid division by zero
  if (norm1 === 0 || norm2 === 0) return 0;
  
  // Calculate and return cosine similarity
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
}

/**
 * Find similar items from a list based on vector similarity
 * @param queryEmbedding The query embedding to compare against
 * @param items List of items with embedding_json property
 * @param options Configuration options
 * @returns Sorted list of items with similarity scores
 */
export function findSimilarItems<T extends { embedding_json: number[] }>(
  queryEmbedding: number[],
  items: T[],
  options: {
    threshold?: number;
    limit?: number;
    scoreField?: string;
  } = {}
): (T & { similarity: number })[] {
  const { 
    threshold = 0.7, 
    limit = 10,
    scoreField = 'similarity'
  } = options;
  
  return items
    .map(item => ({
      ...item,
      [scoreField]: calculateCosineSimilarity(queryEmbedding, item.embedding_json)
    }))
    .filter(item => item[scoreField] >= threshold)
    .sort((a, b) => b[scoreField] - a[scoreField])
    .slice(0, limit);
}

/**
 * Hybrid search function that combines keyword filtering with vector similarity
 * @param queryEmbedding The query embedding to compare against
 * @param items List of items with embedding_json property
 * @param keywordFilter Function to pre-filter items by keywords
 * @param options Configuration options
 * @returns Sorted list of items with similarity scores
 */
export function hybridSearch<T extends { embedding_json: number[], content: string }>(
  queryEmbedding: number[],
  items: T[],
  keywordFilter: (item: T) => boolean,
  options: {
    threshold?: number;
    limit?: number;
  } = {}
): (T & { similarity: number })[] {
  // First filter by keywords to reduce the candidate set
  const filteredItems = items.filter(keywordFilter);
  
  // Then apply vector similarity search
  return findSimilarItems(queryEmbedding, filteredItems, options);
}
