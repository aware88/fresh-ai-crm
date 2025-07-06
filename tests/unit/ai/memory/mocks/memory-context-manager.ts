// Mock for MemoryContextManager
export class MemoryContextManager {
  constructor() {
    // Mock constructor
  }

  getContext = jest.fn().mockResolvedValue({
    contextId: 'mock-context-id',
    memories: [],
    metadata: {}
  });

  updateMemoryImportanceScores = jest.fn().mockResolvedValue(true);
  
  persistContext = jest.fn().mockResolvedValue('mock-context-id');
}
