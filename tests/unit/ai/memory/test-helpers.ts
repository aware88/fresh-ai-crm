// Test helpers for exposing private methods
import { MemoryContextProvider } from '../../../../src/lib/ai/memory/memory-context-provider';

/**
 * Helper function to expose private methods on MemoryContextProvider for testing
 * 
 * @param provider The provider instance
 * @returns The provider instance cast to a type that allows access to private methods
 */
export const asTestProvider = (provider: MemoryContextProvider): any => {
  return provider as any;
};

/**
 * Type definition for a test-specific provider
 * This avoids extending the original class which would cause TypeScript errors
 * with private method access
 */
export type TestableMemoryContextProvider = {
  getConfigForRequest(request: any): Promise<any>;
  getConfigForOrganization(organizationId: string): Promise<any>;
  getAgentSettings(agentId: string): Promise<any>;
  persistContext(query: string, memories: any[], tokenCount: number, truncated?: boolean, relevanceScore?: number, organizationId?: string): Promise<string>;
  updateContextWithFeedback(contextId: string, feedback: any, organizationId: string): Promise<void>;
  getContext(request: any): Promise<any>;
  formatContextForPrompt(memories: any[]): string;
};
