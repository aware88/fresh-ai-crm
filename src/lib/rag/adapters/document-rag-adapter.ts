import { UnifiedRAGService } from '../unified-rag-service';
import { IngestContent, RAGSourceType } from '@/types/rag';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

/**
 * Document RAG Adapter
 * Integrates user-uploaded documents with the RAG system
 * Works with existing document processing pipeline
 */
export class DocumentRAGAdapter {
  private ragService: UnifiedRAGService;
  private supabase: SupabaseClient<Database>;

  constructor(
    ragService: UnifiedRAGService,
    supabase: SupabaseClient<Database>
  ) {
    this.ragService = ragService;
    this.supabase = supabase;
  }

  /**
   * Process and ingest a document that was just uploaded
   */
  async ingestUploadedDocument(
    documentId: string,
    organizationId: string,
    userId: string
  ): Promise<boolean> {
    try {
      console.log(`[Document RAG] Processing uploaded document ${documentId}`);

      // Get document from supplier_documents table
      const { data: document, error: docError } = await this.supabase
        .from('supplier_documents')
        .select('*')
        .eq('id', documentId)
        .eq('organization_id', organizationId)
        .single();

      if (docError || !document) {
        console.error('[Document RAG] Document not found:', docError);
        return false;
      }

      // Extract text content from document
      const textContent = await this.extractTextFromDocument(document);
      
      if (!textContent) {
        console.warn('[Document RAG] No text content extracted from document');
        return false;
      }

      // Format for RAG ingestion
      const content = this.formatDocumentForRAG(document, textContent);

      // Ingest into RAG system
      const result = await this.ragService.ingestContent(
        organizationId,
        content,
        {
          chunkSize: 800, // Smaller chunks for documents
          chunkOverlap: 150,
          preserveStructure: true
        }
      );

      if (result.success) {
        // Update document processing status
        await this.updateDocumentProcessingStatus(documentId, 'rag_indexed', result.knowledgeBaseId);
        console.log(`[Document RAG] Successfully ingested document ${documentId}: ${result.chunksCreated} chunks`);
      } else {
        await this.updateDocumentProcessingStatus(documentId, 'rag_failed', '', result.error);
        console.error(`[Document RAG] Failed to ingest document ${documentId}:`, result.error);
      }

      return result.success;
    } catch (error) {
      console.error('[Document RAG] Document processing failed:', error);
      await this.updateDocumentProcessingStatus(
        documentId, 
        'rag_failed', 
        '', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      return false;
    }
  }

  /**
   * Bulk process existing documents for an organization
   */
  async ingestExistingDocuments(
    organizationId: string,
    userId: string,
    options: {
      batchSize?: number;
      documentTypes?: string[];
      skipProcessed?: boolean;
    } = {}
  ): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const {
      batchSize = 10,
      documentTypes,
      skipProcessed = true
    } = options;

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      console.log(`[Document RAG] Starting bulk document processing for organization ${organizationId}`);

      // Build query
      let query = this.supabase
        .from('supplier_documents')
        .select('*')
        .eq('organization_id', organizationId);

      if (documentTypes && documentTypes.length > 0) {
        query = query.in('document_type', documentTypes);
      }

      if (skipProcessed) {
        // Skip documents that are already processed or failed
        query = query.not('processing_status', 'in', '(rag_indexed,rag_failed)');
      }

      const { data: documents, error } = await query.limit(1000); // Reasonable limit

      if (error) {
        results.errors.push(`Failed to fetch documents: ${error.message}`);
        return results;
      }

      if (!documents || documents.length === 0) {
        console.log('[Document RAG] No documents found to process');
        return results;
      }

      console.log(`[Document RAG] Found ${documents.length} documents to process`);

      // Process in batches
      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);
        
        for (const document of batch) {
          results.processed++;
          
          const success = await this.ingestUploadedDocument(
            document.id,
            organizationId,
            userId
          );

          if (success) {
            results.successful++;
          } else {
            results.failed++;
            results.errors.push(`Failed to process document: ${document.file_name}`);
          }

          // Small delay to prevent overwhelming the system
          await this.delay(200);
        }

        console.log(`[Document RAG] Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(documents.length / batchSize)}`);
        
        // Longer delay between batches
        if (i + batchSize < documents.length) {
          await this.delay(1000);
        }
      }

      console.log(`[Document RAG] Bulk processing completed: ${results.successful}/${results.processed} successful`);

      return results;
    } catch (error) {
      console.error('[Document RAG] Bulk processing failed:', error);
      results.errors.push(`Bulk processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Process documents from email attachments
   */
  async ingestEmailAttachments(
    organizationId: string,
    emailId: string
  ): Promise<{
    processed: number;
    successful: number;
    errors: string[];
  }> {
    const results = {
      processed: 0,
      successful: 0,
      errors: [] as string[]
    };

    try {
      // Find documents from email attachments
      const { data: documents, error } = await this.supabase
        .from('supplier_documents')
        .select('*')
        .eq('organization_id', organizationId)
        .contains('metadata', { from_email: true, email_id: emailId });

      if (error || !documents || documents.length === 0) {
        return results;
      }

      for (const document of documents) {
        results.processed++;
        
        const success = await this.ingestUploadedDocument(
          document.id,
          organizationId,
          document.created_by
        );

        if (success) {
          results.successful++;
        } else {
          results.errors.push(`Failed to process attachment: ${document.file_name}`);
        }
      }

      return results;
    } catch (error) {
      console.error('[Document RAG] Email attachment processing failed:', error);
      results.errors.push(`Email attachment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return results;
    }
  }

  /**
   * Extract text content from document
   */
  private async extractTextFromDocument(document: any): Promise<string | null> {
    try {
      // Check if we already have extracted data
      if (document.extracted_data && typeof document.extracted_data === 'object') {
        const extractedData = document.extracted_data as any;
        
        // Try to find text content in various fields
        if (extractedData.text_content) {
          return extractedData.text_content;
        }
        
        if (extractedData.content) {
          return extractedData.content;
        }

        // For structured data, create a text representation
        if (extractedData.products || extractedData.pricing || extractedData.summary) {
          return this.formatStructuredDataAsText(extractedData);
        }
      }

      // If no extracted data available, we'll need to process the file
      // For now, return a placeholder - in production you'd implement actual text extraction
      console.warn(`[Document RAG] No extracted text available for document ${document.id}`);
      
      // Create basic content from available metadata
      return this.createFallbackContent(document);
    } catch (error) {
      console.error('[Document RAG] Text extraction failed:', error);
      return null;
    }
  }

  /**
   * Format structured extracted data as text
   */
  private formatStructuredDataAsText(extractedData: any): string {
    const sections: string[] = [];

    if (extractedData.summary) {
      sections.push(`Summary: ${extractedData.summary}`);
    }

    if (extractedData.products && Array.isArray(extractedData.products)) {
      const productList = extractedData.products
        .map((product: any) => {
          const parts = [`Product: ${product.name || 'Unknown'}`];
          if (product.sku) parts.push(`SKU: ${product.sku}`);
          if (product.description) parts.push(`Description: ${product.description}`);
          if (product.category) parts.push(`Category: ${product.category}`);
          return parts.join('\n');
        })
        .join('\n\n');
      sections.push(`Products:\n${productList}`);
    }

    if (extractedData.pricing && Array.isArray(extractedData.pricing)) {
      const pricingList = extractedData.pricing
        .map((price: any) => {
          const parts = [`Product: ${price.product_name || 'Unknown'}`];
          if (price.price) parts.push(`Price: ${price.price} ${price.currency || 'EUR'}`);
          if (price.quantity) parts.push(`Quantity: ${price.quantity}`);
          if (price.unit) parts.push(`Unit: ${price.unit}`);
          return parts.join('\n');
        })
        .join('\n\n');
      sections.push(`Pricing:\n${pricingList}`);
    }

    if (extractedData.suppliers && Array.isArray(extractedData.suppliers)) {
      const supplierList = extractedData.suppliers
        .map((supplier: any) => `Supplier: ${supplier.name || 'Unknown'}`)
        .join('\n');
      sections.push(`Suppliers:\n${supplierList}`);
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * Create fallback content when no extracted text is available
   */
  private createFallbackContent(document: any): string {
    const sections: string[] = [];

    sections.push(`Document: ${document.file_name}`);
    sections.push(`Type: ${document.document_type}`);
    sections.push(`File Type: ${document.file_type}`);
    
    if (document.document_date) {
      sections.push(`Date: ${document.document_date}`);
    }

    if (document.document_number) {
      sections.push(`Number: ${document.document_number}`);
    }

    if (document.notes) {
      sections.push(`Notes: ${document.notes}`);
    }

    if (document.metadata && typeof document.metadata === 'object') {
      const metadata = document.metadata as any;
      if (metadata.original_name && metadata.original_name !== document.file_name) {
        sections.push(`Original Name: ${metadata.original_name}`);
      }
      if (metadata.size) {
        sections.push(`Size: ${Math.round(metadata.size / 1024)} KB`);
      }
    }

    return sections.join('\n');
  }

  /**
   * Format document for RAG ingestion
   */
  private formatDocumentForRAG(document: any, textContent: string): IngestContent {
    return {
      title: document.file_name,
      content: textContent,
      sourceType: 'document' as RAGSourceType,
      sourceId: document.id,
      metadata: {
        documentType: document.document_type,
        fileType: document.file_type,
        fileName: document.file_name,
        documentDate: document.document_date,
        documentNumber: document.document_number,
        supplierId: document.supplier_id,
        fileSize: document.file_size,
        uploadedBy: document.created_by,
        uploadedAt: document.created_at,
        hasExtractedData: !!document.extracted_data,
        notes: document.notes,
        reviewStatus: document.review_status,
        processingStatus: document.processing_status
      }
    };
  }

  /**
   * Update document processing status
   */
  private async updateDocumentProcessingStatus(
    documentId: string,
    status: string,
    knowledgeBaseId?: string,
    error?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        processing_status: status,
        processing_completed_at: new Date().toISOString()
      };

      if (knowledgeBaseId) {
        updateData.metadata = {
          rag_knowledge_base_id: knowledgeBaseId
        };
      }

      if (error) {
        updateData.processing_error = error;
      }

      await this.supabase
        .from('supplier_documents')
        .update(updateData)
        .eq('id', documentId);
    } catch (updateError) {
      console.error('[Document RAG] Failed to update processing status:', updateError);
    }
  }

  /**
   * Get processing statistics for an organization
   */
  async getProcessingStats(organizationId: string): Promise<{
    totalDocuments: number;
    processed: number;
    failed: number;
    pending: number;
    byType: Record<string, number>;
    recentActivity: Array<{
      documentName: string;
      status: string;
      processedAt: string;
    }>;
  }> {
    try {
      const { data: documents, error } = await this.supabase
        .from('supplier_documents')
        .select('file_name, document_type, processing_status, processing_completed_at')
        .eq('organization_id', organizationId);

      if (error || !documents) {
        return {
          totalDocuments: 0,
          processed: 0,
          failed: 0,
          pending: 0,
          byType: {},
          recentActivity: []
        };
      }

      const stats = {
        totalDocuments: documents.length,
        processed: documents.filter(d => d.processing_status === 'rag_indexed').length,
        failed: documents.filter(d => d.processing_status === 'rag_failed').length,
        pending: documents.filter(d => !d.processing_status || d.processing_status === 'pending').length,
        byType: {} as Record<string, number>,
        recentActivity: [] as Array<{
          documentName: string;
          status: string;
          processedAt: string;
        }>
      };

      // Calculate by type
      documents.forEach(doc => {
        stats.byType[doc.document_type] = (stats.byType[doc.document_type] || 0) + 1;
      });

      // Recent activity (last 10 processed documents)
      stats.recentActivity = documents
        .filter(d => d.processing_completed_at)
        .sort((a, b) => new Date(b.processing_completed_at!).getTime() - new Date(a.processing_completed_at!).getTime())
        .slice(0, 10)
        .map(d => ({
          documentName: d.file_name,
          status: d.processing_status || 'unknown',
          processedAt: d.processing_completed_at!
        }));

      return stats;
    } catch (error) {
      console.error('[Document RAG] Failed to get processing stats:', error);
      return {
        totalDocuments: 0,
        processed: 0,
        failed: 0,
        pending: 0,
        byType: {},
        recentActivity: []
      };
    }
  }

  /**
   * Reprocess failed documents
   */
  async reprocessFailedDocuments(
    organizationId: string,
    userId: string,
    limit: number = 10
  ): Promise<{
    reprocessed: number;
    successful: number;
    stillFailed: number;
  }> {
    const results = {
      reprocessed: 0,
      successful: 0,
      stillFailed: 0
    };

    try {
      const { data: failedDocuments, error } = await this.supabase
        .from('supplier_documents')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('processing_status', 'rag_failed')
        .limit(limit);

      if (error || !failedDocuments || failedDocuments.length === 0) {
        return results;
      }

      for (const doc of failedDocuments) {
        results.reprocessed++;
        
        const success = await this.ingestUploadedDocument(
          doc.id,
          organizationId,
          userId
        );

        if (success) {
          results.successful++;
        } else {
          results.stillFailed++;
        }

        // Delay between reprocessing attempts
        await this.delay(500);
      }

      console.log(`[Document RAG] Reprocessed ${results.reprocessed} failed documents: ${results.successful} successful`);

      return results;
    } catch (error) {
      console.error('[Document RAG] Reprocessing failed:', error);
      return results;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


