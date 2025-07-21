/**
 * Metakocka Integration
 * 
 * Export all Metakocka integration components
 */

// Import and re-export types
import type { 
  MetakockaCredentials,
  MetakockaBaseResponse,
  MetakockaErrorType,
  MetakockaProduct,
  MetakockaProductResponse,
  MetakockaPartner,
  MetakockaPartnerResponse,
  InventoryCheckRequest,
  InventoryCheckResponse,
  MetakockaSalesDocument,
  MetakockaSalesDocumentResponse,
  MetakockaSalesDocumentType,
  MetakockaSalesDocumentStatus,
  MetakockaSalesDocumentItem
} from './types';

import { MetakockaError } from './types';

// Import and re-export client
import { MetakockaClient } from './client';

// Import and re-export service
import { MetakockaService } from './service';

// Import and re-export AI integration
import type { 
  MetakockaAIContext,
  ProductForAI,
  ShipmentForAI,
  CustomerForAI,
  OrderForAI,
  InventoryForAI,
  AddressForAI
} from './metakocka-ai-integration';

import { 
  MetakockaAIIntegrationService,
  getMetakockaDataForAIContext,
  getOrderDetailsForAI
} from './metakocka-ai-integration';

// Export all types
export type {
  MetakockaCredentials,
  MetakockaBaseResponse,
  MetakockaErrorType,
  MetakockaProduct,
  MetakockaProductResponse,
  MetakockaPartner,
  MetakockaPartnerResponse,
  InventoryCheckRequest,
  InventoryCheckResponse,
  MetakockaSalesDocument,
  MetakockaSalesDocumentResponse,
  MetakockaSalesDocumentType,
  MetakockaSalesDocumentStatus,
  MetakockaSalesDocumentItem,
  MetakockaAIContext,
  ProductForAI,
  ShipmentForAI,
  CustomerForAI,
  OrderForAI,
  InventoryForAI,
  AddressForAI
};

// Export classes and functions
export { MetakockaError };
export { MetakockaClient };
export { MetakockaService };
export {
  MetakockaAIIntegrationService,
  getMetakockaDataForAIContext,
  getOrderDetailsForAI
};

// Also export everything using wildcard exports for backward compatibility
export * from './types';
export * from './client';
export * from './service';
export * from './metakocka-ai-integration';
