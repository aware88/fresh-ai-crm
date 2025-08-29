/**
 * Progressive Email Loading System
 * 
 * Optimizes email loading with:
 * 1. Progressive batching: 10 + 10 + 30 emails
 * 2. Local caching to avoid reloading same emails
 * 3. Smart AI analysis (only for new/uncached emails)
 * 4. Background loading for better UX
 */

import { analyzeEmailForUpsell, EmailWithUpsell } from './enhanced-upsell-detection';

interface BaseEmail {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
  read: boolean;
  folder: string;
  attachments: any[];
}

interface CachedEmail extends BaseEmail {
  upsellData?: EmailWithUpsell;
  analyzed_at?: string;
  cache_version?: string;
}

interface LoadingProgress {
  phase: 'initial' | 'secondary' | 'bulk' | 'complete';
  loaded: number;
  total: number;
  isLoading: boolean;
}

const CACHE_VERSION = '1.0';
// No expiry for AI analysis - once analyzed, it's permanent!

export class ProgressiveEmailLoader {
  private cache = new Map<string, CachedEmail>();
  private loadingCallbacks: ((progress: LoadingProgress) => void)[] = [];
  private organizationId?: string;

  constructor(organizationId?: string) {
    this.organizationId = organizationId;
    this.loadCacheFromStorage();
  }

  /**
   * Register callback for loading progress updates
   */
  onProgress(callback: (progress: LoadingProgress) => void) {
    this.loadingCallbacks.push(callback);
    return () => {
      this.loadingCallbacks = this.loadingCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Emit progress update to all callbacks
   */
  private emitProgress(progress: LoadingProgress) {
    this.loadingCallbacks.forEach(callback => callback(progress));
  }

  /**
   * Load emails progressively: 10 + 10 + 30
   */
  async loadEmails(
    emailFetcher: (limit: number, offset: number) => Promise<BaseEmail[]>,
    totalExpected: number = 50
  ): Promise<CachedEmail[]> {
    
    console.log('Starting progressive email loading...');
    this.emitProgress({ phase: 'initial', loaded: 0, total: totalExpected, isLoading: true });

    const allEmails: CachedEmail[] = [];

    try {
      // Phase 1: Load first 10 emails (immediate display)
      console.log('Phase 1: Loading first 10 emails...');
      const batch1 = await emailFetcher(10, 0);
      const processed1 = await this.processBatch(batch1, 1);
      allEmails.push(...processed1);
      
      this.emitProgress({ phase: 'initial', loaded: 10, total: totalExpected, isLoading: true });

      // Phase 2: Load next 10 emails (quick follow-up)
      console.log('Phase 2: Loading next 10 emails...');
      const batch2 = await emailFetcher(10, 10);
      const processed2 = await this.processBatch(batch2, 2);
      allEmails.push(...processed2);
      
      this.emitProgress({ phase: 'secondary', loaded: 20, total: totalExpected, isLoading: true });

      // Phase 3: Load remaining 30 emails (background)
      console.log('Phase 3: Loading remaining 30 emails...');
      const batch3 = await emailFetcher(30, 20);
      const processed3 = await this.processBatch(batch3, 3);
      allEmails.push(...processed3);
      
      this.emitProgress({ phase: 'complete', loaded: 50, total: totalExpected, isLoading: false });

      // Save updated cache
      this.saveCacheToStorage();
      
      console.log(`Progressive loading complete: ${allEmails.length} emails loaded`);
      return allEmails;

    } catch (error) {
      console.error('Progressive email loading failed:', error);
      this.emitProgress({ phase: 'complete', loaded: allEmails.length, total: totalExpected, isLoading: false });
      return allEmails;
    }
  }

  /**
   * Process a batch of emails with caching and smart AI analysis
   */
  private async processBatch(emails: BaseEmail[], batchNumber: number): Promise<CachedEmail[]> {
    console.log(`Processing batch ${batchNumber}: ${emails.length} emails`);
    
    const processed: CachedEmail[] = [];
    const needsAnalysis: BaseEmail[] = [];

    // Check cache first
    for (const email of emails) {
      const cached = this.getCachedEmail(email.id);
      
      if (cached && this.isCacheValid(cached)) {
        // Use cached version
        processed.push(cached);
        console.log(`Using cached analysis for email ${email.id}`);
      } else {
        // Needs fresh analysis
        needsAnalysis.push(email);
      }
    }

    // Analyze uncached emails
    if (needsAnalysis.length > 0) {
      console.log(`Analyzing ${needsAnalysis.length} new emails with AI...`);
      
      // Process AI analysis in parallel for better performance
      const analysisPromises = needsAnalysis.map(async (email) => {
        try {
          const upsellData = await analyzeEmailForUpsell({
            subject: email.subject,
            body: email.body,
            from: email.from,
            organizationId: this.organizationId
          });

          const cachedEmail: CachedEmail = {
            ...email,
            upsellData,
            analyzed_at: new Date().toISOString(),
            cache_version: CACHE_VERSION
          };

          // Update cache
          this.cache.set(email.id, cachedEmail);
          return cachedEmail;

        } catch (error) {
          console.warn(`AI analysis failed for email ${email.id}:`, error);
          
          // Cache without analysis to avoid retrying
          const cachedEmail: CachedEmail = {
            ...email,
            analyzed_at: new Date().toISOString(),
            cache_version: CACHE_VERSION
          };
          
          this.cache.set(email.id, cachedEmail);
          return cachedEmail;
        }
      });

      const analyzedEmails = await Promise.all(analysisPromises);
      processed.push(...analyzedEmails);
    }

    return processed.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  /**
   * Get cached email if available
   */
  private getCachedEmail(emailId: string): CachedEmail | null {
    return this.cache.get(emailId) || null;
  }

  /**
   * Check if cached email is still valid
   * AI analysis never expires - once analyzed, always valid!
   */
  private isCacheValid(cached: CachedEmail): boolean {
    if (!cached.analyzed_at || !cached.cache_version) {
      return false;
    }

    // Only check version - no time-based expiry for AI analysis
    return cached.cache_version === CACHE_VERSION;
  }

  /**
   * Load cache from localStorage
   */
  private loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem('email-analysis-cache');
      if (stored) {
        const parsed = JSON.parse(stored);
        
        // Convert to Map and validate
        Object.entries(parsed).forEach(([id, email]) => {
          const cachedEmail = email as CachedEmail;
          if (this.isCacheValid(cachedEmail)) {
            this.cache.set(id, cachedEmail);
          }
        });
        
        console.log(`Loaded ${this.cache.size} cached email analyses`);
      }
    } catch (error) {
      console.warn('Failed to load email cache:', error);
      this.cache.clear();
    }
  }

  /**
   * Save cache to localStorage
   */
  private saveCacheToStorage() {
    try {
      const cacheObject = Object.fromEntries(this.cache);
      localStorage.setItem('email-analysis-cache', JSON.stringify(cacheObject));
      console.log(`Saved ${this.cache.size} email analyses to cache`);
    } catch (error) {
      console.warn('Failed to save email cache:', error);
    }
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    let removed = 0;
    
    for (const [id, email] of this.cache.entries()) {
      if (!this.isCacheValid(email)) {
        this.cache.delete(id);
        removed++;
      }
    }
    
    if (removed > 0) {
      console.log(`Cleared ${removed} expired cache entries`);
      this.saveCacheToStorage();
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      totalCached: this.cache.size,
      cacheVersion: CACHE_VERSION,
      permanentCache: true // AI analysis never expires!
    };
  }
}
