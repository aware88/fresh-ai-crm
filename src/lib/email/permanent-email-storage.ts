/**
 * Permanent Email Storage System
 * 
 * Stores emails and AI analysis permanently in database
 * Uses IndexedDB for fast local caching
 * No more re-analysis of same emails!
 */

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { Database } from '@/types/supabase';
import { analyzeEmailForUpsell, EmailWithUpsell } from './enhanced-upsell-detection';

interface StoredEmail {
  id: string;
  user_id: string;
  email_account_id: string;
  organization_id: string;
  message_id?: string;
  from_address: string;
  from_name?: string;
  to_address?: string;
  subject?: string;
  text_content?: string;
  html_content?: string;
  received_date: string;
  sent_date?: string;
  folder: string;
  has_attachments?: boolean;
  headers?: any;
  is_processed?: boolean;
  is_archived?: boolean;
  is_read: boolean;
  priority?: string;
  labels?: string[];
  thread_id?: string;
  
  // AI Analysis (stored permanently)
  ai_analyzed?: boolean;
  ai_analyzed_at?: string;
  upsell_data?: EmailWithUpsell;
  assigned_agent?: 'customer' | 'sales' | 'dispute' | 'billing' | 'auto_reply';
  highlight_color?: string;
  agent_priority?: 'low' | 'medium' | 'high' | 'urgent';
  replied?: boolean;
  last_reply_at?: string;
  
  // Timestamps
  created_at: string;
  updated_at: string;
}

interface EmailCacheEntry {
  email: StoredEmail;
  cached_at: string;
}

export class PermanentEmailStorage {
  private supabase = createClientComponentClient<Database>();
  private dbName = 'EmailCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initIndexedDB();
  }

  /**
   * Initialize IndexedDB for local caching
   */
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create emails store
        if (!db.objectStoreNames.contains('emails')) {
          const store = db.createObjectStore('emails', { keyPath: 'id' });
          store.createIndex('email_account_id', 'email_account_id', { unique: false });
          store.createIndex('received_date', 'received_date', { unique: false });
          store.createIndex('folder', 'folder', { unique: false });
        }
      };
    });
  }

  /**
   * Load emails with intelligent caching
   * 1. Check IndexedDB cache first
   * 2. Load from database 
   * 3. Analyze new emails only
   * 4. Update both caches
   */
  async loadEmails(
    emailAccountId: string, 
    organizationId: string,
    folder: string = 'inbox',
    limit: number = 50
  ): Promise<StoredEmail[]> {
    
    console.log(`Loading emails for account ${emailAccountId}, folder ${folder}`);
    
    try {
      // Step 1: Try IndexedDB cache first (instant)
      const cachedEmails = await this.getFromIndexedDB(emailAccountId, folder, limit);
      
      // Step 2: Check database for newer emails
      const dbEmails = await this.getFromDatabase(emailAccountId, organizationId, folder, limit);
      
      // Step 3: Identify new emails that need analysis
      const cachedIds = new Set(cachedEmails.map(e => e.id));
      const newEmails = dbEmails.filter(email => !cachedIds.has(email.id));
      const needsAnalysis = dbEmails.filter(email => !email.ai_analyzed);
      
      console.log(`Found ${newEmails.length} new emails, ${needsAnalysis.length} need AI analysis`);
      
      // Step 4: Analyze new emails (in background if possible)
      if (needsAnalysis.length > 0) {
        // Don't wait for analysis - return cached emails immediately
        this.analyzeEmailsInBackground(needsAnalysis, organizationId);
      }
      
      // Step 5: Return best available data immediately
      const allEmails = this.mergeEmailSources(cachedEmails, dbEmails);
      
      // Step 6: Update IndexedDB cache
      if (newEmails.length > 0) {
        await this.updateIndexedDBCache(newEmails);
      }
      
      return allEmails.slice(0, limit);
      
    } catch (error) {
      console.error('Error loading emails:', error);
      return [];
    }
  }

  /**
   * Get emails from database (permanent storage)
   */
  private async getFromDatabase(
    emailAccountId: string,
    organizationId: string, 
    folder: string,
    limit: number
  ): Promise<StoredEmail[]> {
    
    try {
      // Use the new email_index table structure
      const { data, error } = await this.supabase
        .from('email_index')
        .select(`
          id,
          message_id,
          subject,
          sender_email,
          sender_name,
          recipient_email,
          received_at,
          sent_at,
          is_read,
          has_attachments,
          email_type,
          folder_name,
          processing_status,
          created_at,
          updated_at
        `)
        .eq('email_account_id', emailAccountId)
        .eq('folder_name', folder)
        .order('received_at', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('Database query error:', error);
        return [];
      }
      
      // Transform the data to match the StoredEmail interface
      const transformedData = (data || []).map(email => ({
        id: email.id,
        message_id: email.message_id,
        subject: email.subject || 'No Subject',
        sender: email.sender_email || 'Unknown',
        sender_name: email.sender_name,
        recipient: email.recipient_email,
        received_date: email.received_at,
        sent_date: email.sent_at,
        is_read: email.is_read || false,
        has_attachments: email.has_attachments || false,
        email_type: email.email_type || 'received',
        folder: email.folder_name || folder,
        processing_status: email.processing_status || 'pending',
        created_at: email.created_at,
        updated_at: email.updated_at,
        // Add placeholder fields for compatibility
        raw_content: '',
        html_content: '',
        plain_content: '',
        attachments: []
      })) as StoredEmail[];
      
      return transformedData;
    } catch (error) {
      console.error('Database query error:', error);
      return [];
    }
  }

  /**
   * Get emails from IndexedDB cache (fast local access)
   */
  private async getFromIndexedDB(
    emailAccountId: string,
    folder: string,
    limit: number
  ): Promise<StoredEmail[]> {
    try {
      // Skip IndexedDB for now to avoid errors
      console.log('Skipping IndexedDB cache, returning empty array');
      return [];
      
      // TODO: Re-enable when IndexedDB is properly initialized
      /*
      if (!this.db) {
        await this.initIndexedDB();
      }
      
      if (!this.db) {
        console.warn('IndexedDB not available, returning empty array');
        return [];
      }

      return new Promise((resolve) => {
        try {
          const transaction = this.db!.transaction(['emails'], 'readonly');
          const store = transaction.objectStore('emails');
          const index = store.index('email_account_id');
          
          transaction.onerror = () => {
            console.error('Database query error:', transaction.error);
            resolve([]);
          };

          const request = index.getAll(emailAccountId);
          
          request.onsuccess = () => {
            try {
              const emails = request.result
                .filter((email: StoredEmail) => email.folder === folder)
                .sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime())
                .slice(0, limit);
              
              console.log(`Retrieved ${emails.length} emails from IndexedDB cache`);
              resolve(emails);
            } catch (error) {
              console.error('Error processing IndexedDB results:', error);
              resolve([]);
            }
          };
          
          request.onerror = () => {
            console.warn('IndexedDB read error:', request.error);
            resolve([]);
          };
        } catch (error) {
          console.error('Database query error:', error);
          resolve([]);
        }
      });
      */
    } catch (error) {
      console.error('Error in getFromIndexedDB:', error);
      return [];
    }
  }

  /**
   * Analyze emails in background without blocking UI
   */
  private async analyzeEmailsInBackground(
    emails: StoredEmail[],
    organizationId: string
  ): Promise<void> {
    
    console.log(`Starting background analysis of ${emails.length} emails`);
    
    // Process in small batches to avoid overwhelming the API
    const batchSize = 5;
    
    for (let i = 0; i < emails.length; i += batchSize) {
      const batch = emails.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(async (email) => {
        try {
          const upsellData = await analyzeEmailForUpsell({
            subject: email.subject || '',
            body: email.text_content || email.html_content || '',
            from: email.from_address,
            organizationId
          });
          
          // Update database with analysis
          await this.updateEmailAnalysis(email.id, {
            ai_analyzed: true,
            ai_analyzed_at: new Date().toISOString(),
            upsell_data: upsellData,
            // Extract agent assignment from analysis
            assigned_agent: this.extractAgentFromAnalysis(upsellData),
            highlight_color: this.extractColorFromAnalysis(upsellData)
          });
          
          console.log(`Analyzed email ${email.id}`);
          
        } catch (error) {
          console.warn(`Analysis failed for email ${email.id}:`, error);
          
          // Mark as analyzed (failed) to avoid retrying
          await this.updateEmailAnalysis(email.id, {
            ai_analyzed: true,
            ai_analyzed_at: new Date().toISOString()
          });
        }
      });
      
      await Promise.all(promises);
      
      // Small delay between batches to be API-friendly
      if (i + batchSize < emails.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    console.log(`Background analysis complete for ${emails.length} emails`);
  }

  /**
   * Update email analysis in database
   */
  private async updateEmailAnalysis(
    emailId: string,
    analysis: Partial<StoredEmail>
  ): Promise<void> {
    
    const { error } = await this.supabase
      .from('emails')
      .update({
        ...analysis,
        updated_at: new Date().toISOString()
      })
      .eq('id', emailId);
    
    if (error) {
      console.error('Failed to update email analysis:', error);
    }
  }

  /**
   * Store new emails in database (permanent)
   */
  async storeEmails(
    emails: any[],
    emailAccountId: string,
    userId: string,
    organizationId: string
  ): Promise<void> {
    
    const emailsToStore = emails.map(email => ({
      id: email.id,
      user_id: userId,
      email_account_id: emailAccountId,
      organization_id: organizationId,
      message_id: email.messageId,
      from_address: email.from,
      from_name: email.fromName,
      to_address: email.to,
      subject: email.subject,
      text_content: email.textContent,
      html_content: email.htmlContent,
      received_date: email.date,
      sent_date: email.sentDate,
      folder: email.folder || 'inbox',
      has_attachments: email.hasAttachments,
      headers: email.headers,
      is_read: email.read || false,
      priority: email.priority || 'normal',
      labels: email.labels,
      thread_id: email.threadId,
      ai_analyzed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    const { error } = await this.supabase
      .from('emails')
      .upsert(emailsToStore, {
        onConflict: 'id',
        ignoreDuplicates: false
      });
    
    if (error) {
      console.error('Failed to store emails:', error);
    } else {
      console.log(`Stored ${emailsToStore.length} emails in database`);
    }
  }

  /**
   * Update IndexedDB cache
   */
  private async updateIndexedDBCache(emails: StoredEmail[]): Promise<void> {
    if (!this.db) return;
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['emails'], 'readwrite');
      const store = transaction.objectStore('emails');
      
      emails.forEach(email => {
        store.put(email);
      });
      
      transaction.oncomplete = () => {
        console.log(`Updated IndexedDB cache with ${emails.length} emails`);
        resolve();
      };
      
      transaction.onerror = () => {
        console.warn('IndexedDB update error:', transaction.error);
        resolve();
      };
    });
  }

  /**
   * Merge emails from different sources, preferring database data
   */
  private mergeEmailSources(
    cachedEmails: StoredEmail[],
    dbEmails: StoredEmail[]
  ): StoredEmail[] {
    
    const dbEmailsMap = new Map(dbEmails.map(email => [email.id, email]));
    const mergedEmails = new Map<string, StoredEmail>();
    
    // Add database emails first (they're authoritative)
    dbEmails.forEach(email => {
      mergedEmails.set(email.id, email);
    });
    
    // Add cached emails that aren't in database
    cachedEmails.forEach(email => {
      if (!mergedEmails.has(email.id)) {
        mergedEmails.set(email.id, email);
      }
    });
    
    return Array.from(mergedEmails.values())
      .sort((a, b) => new Date(b.received_date).getTime() - new Date(a.received_date).getTime());
  }

  /**
   * Extract agent assignment from upsell analysis
   */
  private extractAgentFromAnalysis(upsellData?: EmailWithUpsell): StoredEmail['assigned_agent'] {
    if (!upsellData?.hasUpsellOpportunity) return undefined;
    
    // Logic to determine agent based on opportunity type
    const opportunities = upsellData.opportunities || [];
    
    for (const opp of opportunities) {
      if (opp.type === 'product_inquiry') return 'sales';
      if (opp.type === 'price_question') return 'sales';
      if (opp.type === 'competitor_mention') return 'sales';
    }
    
    return 'customer';
  }

  /**
   * Extract highlight color from analysis
   */
  private extractColorFromAnalysis(upsellData?: EmailWithUpsell): string | undefined {
    if (!upsellData?.hasUpsellOpportunity) return undefined;
    
    const confidence = upsellData.highestConfidence;
    
    if (confidence === 'high') return '#10B981'; // Green
    if (confidence === 'medium') return '#F59E0B'; // Amber
    
    return undefined;
  }

  /**
   * Clear old cache entries (maintenance)
   */
  async clearOldCache(daysOld: number = 30): Promise<void> {
    if (!this.db) return;
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    return new Promise((resolve) => {
      const transaction = this.db!.transaction(['emails'], 'readwrite');
      const store = transaction.objectStore('emails');
      const dateIndex = store.index('received_date');
      const range = IDBKeyRange.upperBound(cutoffDate.toISOString());
      
      const request = dateIndex.openCursor(range);
      let deletedCount = 0;
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          deletedCount++;
          cursor.continue();
        } else {
          console.log(`Cleared ${deletedCount} old cache entries`);
          resolve();
        }
      };
      
      request.onerror = () => {
        console.warn('Cache cleanup error:', request.error);
        resolve();
      };
    });
  }
}
