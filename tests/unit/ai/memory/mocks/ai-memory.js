// Mock for ai-memory module
module.exports = {
  AIMemory: class AIMemory {
    constructor(data) {
      Object.assign(this, data);
    }
  },
  MemoryType: {
    CONVERSATION: 'CONVERSATION',
    PREFERENCE: 'PREFERENCE',
    FACT: 'FACT',
    TASK: 'TASK'
  }
};
