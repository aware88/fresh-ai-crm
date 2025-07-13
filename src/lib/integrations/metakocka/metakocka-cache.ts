/**
 * Metakocka Cache Service
 * 
 * Provides caching functionality for Metakocka API responses to improve performance
 * and reduce API calls. Uses memory caching with time-based invalidation.
 */

import { MetakockaErrorLogger } from './metakocka-error-logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  userId: string;
}

interface CacheOptions {
  ttlSeconds: number;
}

export class MetakockaCache {
  private static cache: Map<string, CacheItem<any>> = new Map();
  private static defaultTTL = 5 * 60; // 5 minutes default TTL
  private static logger = new MetakockaErrorLogger();
  
  /**
   * Get an item from the cache
   * 
   * @param key Cache key
   * @param userId User ID for multi-tenant isolation
   * @returns Cached data or null if not found or expired
   */
  static get<T>(key: string, userId: string): T | null {
    const cacheKey = this.getCacheKey(key, userId);
    const item = this.cache.get(cacheKey);
    
    if (!item) {
      return null;
    }
    
    // Check if the item has expired
    if (this.isExpired(item)) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return item.data as T;
  }
  
  /**
   * Set an item in the cache
   * 
   * @param key Cache key
   * @param data Data to cache
   * @param userId User ID for multi-tenant isolation
   * @param options Cache options
   */
  static set<T>(key: string, data: T, userId: string, options?: CacheOptions): void {
    const cacheKey = this.getCacheKey(key, userId);
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      userId
    });
    
    // Log cache operation
    this.logger.logInfo({
      message: 'Cached Metakocka data',
      userId,
      cacheKey: key,
      dataSizeBytes: JSON.stringify(data).length,
      ttlSeconds: options?.ttlSeconds || this.defaultTTL
    });
  }
  
  /**
   * Delete an item from the cache
   * 
   * @param key Cache key
   * @param userId User ID for multi-tenant isolation
   */
  static delete(key: string, userId: string): void {
    const cacheKey = this.getCacheKey(key, userId);
    this.cache.delete(cacheKey);
  }
  
  /**
   * Clear all cache entries for a specific user
   * 
   * @param userId User ID
   */
  static clearUserCache(userId: string): void {
    for (const [key, item] of this.cache.entries()) {
      if (item.userId === userId) {
        this.cache.delete(key);
      }
    }
    
    this.logger.logInfo({
      message: 'Cleared user cache',
      userId
    });
  }
  
  /**
   * Clear all cache entries
   */
  static clearAll(): void {
    this.cache.clear();
    
    this.logger.logInfo({
      message: 'Cleared all cache'
    });
  }
  
  /**
   * Get cache statistics
   * 
   * @returns Cache statistics
   */
  static getStats() {
    const stats = {
      totalItems: this.cache.size,
      totalSizeBytes: 0,
      itemsByUser: {} as Record<string, number>,
      expiredItems: 0
    };
    
    for (const [key, item] of this.cache.entries()) {
      stats.totalSizeBytes += JSON.stringify(item.data).length;
      
      if (!stats.itemsByUser[item.userId]) {
        stats.itemsByUser[item.userId] = 0;
      }
      stats.itemsByUser[item.userId]++;
      
      if (this.isExpired(item)) {
        stats.expiredItems++;
      }
    }
    
    return stats;
  }
  
  /**
   * Check if a cache item has expired
   * 
   * @param item Cache item
   * @param ttlSeconds TTL in seconds
   * @returns Whether the item has expired
   */
  private static isExpired(item: CacheItem<any>, ttlSeconds = this.defaultTTL): boolean {
    const now = Date.now();
    const expiryTime = item.timestamp + (ttlSeconds * 1000);
    return now > expiryTime;
  }
  
  /**
   * Generate a cache key with user ID for multi-tenant isolation
   * 
   * @param key Base cache key
   * @param userId User ID
   * @returns Full cache key
   */
  private static getCacheKey(key: string, userId: string): string {
    return `${userId}:${key}`;
  }
}
