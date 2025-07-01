/**
 * Sales Document Sync Service
 * Handles synchronization between CRM sales documents and Metakocka sales documents
 */

import { MetakockaApiService } from './api-service';
import { MetakockaError } from './error-logger';
import { 
  SalesDocument, 
  SalesDocumentItem, 
  MetakockaSalesDocument, 
  MetakockaSalesDocumentItem,
  SalesDocumentMapping,
  SalesDocumentSyncResult
} from '@/types/sales-document';

/**
 * Maps CRM document types to Metakocka document types
 */
const DOCUMENT_TYPE_MAP: Record<string, string> = {
  'invoice': 'izdani_racun',
  'offer': 'ponudba',
  'order': 'narocilo_kupca',
  'proforma': 'predracun'
};

/**
 * Maps Metakocka document types to CRM document types
 */
const REVERSE_DOCUMENT_TYPE_MAP: Record<string, string> = {
  'izdani_racun': 'invoice',
  'ponudba': 'offer',
  'narocilo_kupca': 'order',
  'predracun': 'proforma'
};

/**
 * Maps CRM document statuses to Metakocka document statuses
 */
const DOCUMENT_STATUS_MAP: Record<string, string> = {
  'draft': 'draft',
  'sent': 'sent',
  'paid': 'paid',
  'overdue': 'overdue',
  'cancelled': 'cancelled'
};

/**
 * Maps Metakocka document statuses to CRM document statuses
 */
const REVERSE_DOCUMENT_STATUS_MAP: Record<string, string> = {
  'draft': 'draft',
  'sent': 'sent',
  'paid': 'paid',
  'overdue': 'overdue',
  'cancelled': 'cancelled'
};

export class SalesDocumentSyncService {
  private apiService: MetakockaApiService;

  constructor(secretKey: string, companyId: string) {
    this.apiService = new MetakockaApiService(secretKey, companyId);
  }

  /**
   * Convert a CRM sales document to Metakocka format
   * @param document CRM sales document
   * @returns Metakocka sales document
   */
  public convertToMetakocka(document: SalesDocument): MetakockaSalesDocument {
    try {
      // Convert document type
      const metakockaType = DOCUMENT_TYPE_MAP[document.document_type] || 'izdani_racun';

      // Convert document items
      const postavke = document.items?.map(item => this.convertItemToMetakocka(item)) || [];

      // Create Metakocka document
      const metakockaDocument: MetakockaSalesDocument = {
        tip_dokumenta: metakockaType,
        st_dokumenta: document.document_number,
        datum_dokumenta: document.document_date,
        datum_valute: document.due_date,
        partner_naziv: document.customer_name,
        partner_naslov: document.customer_address,
        partner_email: document.customer_email,
        znesek_z_ddv: document.total_amount,
        znesek_ddv: document.tax_amount,
        znesek_brez_ddv: document.total_amount - document.tax_amount,
        valuta: document.currency,
        opombe: document.notes,
        postavke: postavke
      };

      // Add partner ID if available
      if (document.customer_id) {
        metakockaDocument.partner_id = document.customer_id;
      }

      return metakockaDocument;
    } catch (error) {
      throw new MetakockaError(
        'conversion_error',
        'Failed to convert CRM document to Metakocka format',
        { documentId: document.id, error }
      );
    }
  }

  /**
   * Convert a CRM sales document item to Metakocka format
   * @param item CRM sales document item
   * @returns Metakocka sales document item
   */
  private convertItemToMetakocka(item: SalesDocumentItem): MetakockaSalesDocumentItem {
    try {
      const metakockaItem: MetakockaSalesDocumentItem = {
        naziv: item.description,
        kolicina: item.quantity,
        cena: item.unit_price,
        ddv_stopnja: item.tax_rate,
        znesek_ddv: item.tax_amount,
        znesek_z_ddv: item.total_amount
      };

      // Add product ID if available
      if (item.product_id) {
        metakockaItem.produkt_id = item.product_id;
      }

      return metakockaItem;
    } catch (error) {
      throw new MetakockaError(
        'conversion_error',
        'Failed to convert CRM document item to Metakocka format',
        { itemId: item.id, error }
      );
    }
  }

  /**
   * Convert a Metakocka sales document to CRM format
   * @param metakockaDocument Metakocka sales document
   * @returns CRM sales document
   */
  public convertToCRM(metakockaDocument: MetakockaSalesDocument): SalesDocument {
    try {
      // Convert document type
      const documentType = REVERSE_DOCUMENT_TYPE_MAP[metakockaDocument.tip_dokumenta] || 'invoice';

      // Convert document status if available
      const status = metakockaDocument.status_dokumenta 
        ? (REVERSE_DOCUMENT_STATUS_MAP[metakockaDocument.status_dokumenta] || 'draft')
        : 'draft';

      // Convert document items
      const items = metakockaDocument.postavke?.map(item => this.convertItemToCRM(item)) || [];

      // Create CRM document
      const crmDocument: SalesDocument = {
        document_type: documentType as any,
        document_number: metakockaDocument.st_dokumenta,
        document_date: metakockaDocument.datum_dokumenta,
        due_date: metakockaDocument.datum_valute,
        customer_name: metakockaDocument.partner_naziv,
        customer_address: metakockaDocument.partner_naslov,
        customer_email: metakockaDocument.partner_email,
        total_amount: metakockaDocument.znesek_z_ddv,
        tax_amount: metakockaDocument.znesek_ddv,
        currency: metakockaDocument.valuta || 'EUR',
        status: status as any,
        notes: metakockaDocument.opombe,
        items: items
      };

      // Add customer ID if available
      if (metakockaDocument.partner_id) {
        crmDocument.customer_id = metakockaDocument.partner_id;
      }

      return crmDocument;
    } catch (error) {
      throw new MetakockaError(
        'conversion_error',
        'Failed to convert Metakocka document to CRM format',
        { metakockaId: metakockaDocument.id_dokument, error }
      );
    }
  }

  /**
   * Convert a Metakocka sales document item to CRM format
   * @param metakockaItem Metakocka sales document item
   * @returns CRM sales document item
   */
  private convertItemToCRM(metakockaItem: MetakockaSalesDocumentItem): SalesDocumentItem {
    try {
      const crmItem: SalesDocumentItem = {
        description: metakockaItem.naziv,
        quantity: metakockaItem.kolicina,
        unit_price: metakockaItem.cena,
        tax_rate: metakockaItem.ddv_stopnja,
        tax_amount: metakockaItem.znesek_ddv,
        total_amount: metakockaItem.znesek_z_ddv
      };

      // Add product ID if available
      if (metakockaItem.produkt_id) {
        crmItem.product_id = metakockaItem.produkt_id;
      }

      return crmItem;
    } catch (error) {
      throw new MetakockaError(
        'conversion_error',
        'Failed to convert Metakocka document item to CRM format',
        { itemId: metakockaItem.id, error }
      );
    }
  }

  /**
   * Create a sales document in Metakocka
   * @param document CRM sales document
   * @returns Sync result with Metakocka ID
   */
  public async createInMetakocka(document: SalesDocument): Promise<SalesDocumentSyncResult> {
    try {
      // Convert document to Metakocka format
      const metakockaDocument = this.convertToMetakocka(document);

      // Create document in Metakocka
      const endpoint = this.getEndpointForDocumentType(document.document_type);
      const response = await this.apiService.post(endpoint, metakockaDocument);

      if (!response.success) {
        return {
          success: false,
          documentId: document.id,
          error: response.error || 'Failed to create document in Metakocka',
          errorCode: response.code,
          errorDetails: response.details
        };
      }

      return {
        success: true,
        documentId: document.id,
        metakockaId: response.data?.id_dokument
      };
    } catch (error) {
      if (error instanceof MetakockaError) {
        return {
          success: false,
          documentId: document.id,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        };
      }

      return {
        success: false,
        documentId: document.id,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Update a sales document in Metakocka
   * @param document CRM sales document
   * @param metakockaId Metakocka document ID
   * @returns Sync result
   */
  public async updateInMetakocka(document: SalesDocument, metakockaId: string): Promise<SalesDocumentSyncResult> {
    try {
      // Convert document to Metakocka format
      const metakockaDocument = this.convertToMetakocka(document);
      
      // Add Metakocka ID
      metakockaDocument.id_dokument = metakockaId;

      // Update document in Metakocka
      const endpoint = this.getEndpointForDocumentType(document.document_type);
      const response = await this.apiService.put(`${endpoint}/${metakockaId}`, metakockaDocument);

      if (!response.success) {
        return {
          success: false,
          documentId: document.id,
          metakockaId,
          error: response.error || 'Failed to update document in Metakocka',
          errorCode: response.code,
          errorDetails: response.details
        };
      }

      return {
        success: true,
        documentId: document.id,
        metakockaId
      };
    } catch (error) {
      if (error instanceof MetakockaError) {
        return {
          success: false,
          documentId: document.id,
          metakockaId,
          error: error.message,
          errorCode: error.code,
          errorDetails: error.details
        };
      }

      return {
        success: false,
        documentId: document.id,
        metakockaId,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get a sales document from Metakocka
   * @param metakockaId Metakocka document ID
   * @param documentType Document type
   * @returns CRM sales document
   */
  public async getFromMetakocka(metakockaId: string, documentType: string): Promise<SalesDocument> {
    try {
      // Get document from Metakocka
      const endpoint = this.getEndpointForDocumentType(documentType);
      const response = await this.apiService.get(`${endpoint}/${metakockaId}`);

      if (!response.success || !response.data) {
        throw new MetakockaError(
          'api_error',
          response.error || 'Failed to get document from Metakocka',
          { metakockaId, documentType, response }
        );
      }

      // Convert to CRM format
      return this.convertToCRM(response.data);
    } catch (error) {
      throw new MetakockaError(
        'sync_error',
        'Failed to get document from Metakocka',
        { metakockaId, documentType, error }
      );
    }
  }

  /**
   * Get the API endpoint for a document type
   * @param documentType Document type
   * @returns API endpoint
   */
  private getEndpointForDocumentType(documentType: string): string {
    switch (documentType) {
      case 'invoice':
        return 'sales_invoice';
      case 'offer':
        return 'offer';
      case 'order':
        return 'sales_order';
      case 'proforma':
        return 'sales_proforma';
      default:
        return 'sales_invoice';
    }
  }
}
