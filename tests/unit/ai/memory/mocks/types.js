// Mock for memory types
module.exports = {
  MemoryContextConfig: class MemoryContextConfig {
    constructor(data) {
      Object.assign(this, {
        enableLongTermMemory: true,
        enableMemoryCompression: false,
        enableContextPrioritization: true,
        enableContextPersistence: true,
        enableContextSharing: false,
        maxContextSize: 2000,
        relevanceThreshold: 0.7,
        ...data
      });
    }
  },
  ContextProviderConfig: class ContextProviderConfig {
    constructor(data) {
      Object.assign(this, {
        enableLongTermMemory: true,
        enableMemoryCompression: false,
        enableContextPrioritization: true,
        enableContextPersistence: true,
        enableContextSharing: false,
        maxContextSize: 2000,
        relevanceThreshold: 0.7,
        ...data
      });
    }
  },
  ContextRequest: class ContextRequest {
    constructor(data) {
      Object.assign(this, {
        query: '',
        organizationId: '',
        userId: undefined,
        contextId: undefined,
        agentId: undefined,
        memoryTypes: undefined,
        ...data
      });
    }
  },
  MemoryContext: class MemoryContext {
    constructor(data) {
      Object.assign(this, {
        memories: [],
        contextId: '',
        metadata: {},
        query: '',
        totalTokens: 0,
        truncated: false,
        relevanceScore: 0,
        ...data
      });
    }
  },
  MemoryContextResult: class MemoryContextResult {
    constructor(data) {
      Object.assign(this, {
        memories: [],
        totalTokens: 0,
        truncated: false,
        prioritizationStrategy: '',
        metadata: {
          retrievalTime: 0,
          memoryCount: {
            retrieved: 0,
            selected: 0,
            compressed: 0
          },
          contextUtilization: 0
        },
        ...data
      });
    }
  }
};
