# AI Memory System

## Overview

The AI Memory System is a core component of the CRM Mind platform that enables AI agents to store, retrieve, and learn from past interactions and decisions. This system transforms the CRM from a static database into an intelligent assistant that continuously improves over time.

## Key Features

- **Semantic Memory Storage**: Store AI memories with vector embeddings for semantic search
- **Memory Relationships**: Connect related memories with typed relationships
- **Access Tracking**: Record how and when memories are accessed
- **Outcome Learning**: Update memory importance based on usage outcomes
- **Multi-tenant Isolation**: Strict organization-based data separation
- **Sales Tactics Enhancement**: Memory-enhanced sales tactics selection

## Directory Structure

```
crm-mind/
├── src/
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── memory/
│   │   │   │   ├── schema.sql             # Database schema
│   │   │   │   ├── ai-memory-service.ts   # Core memory service
│   │   │   │   └── __tests__/             # Unit tests
│   │   │   └── sales-tactics-with-memory.ts  # Memory-enhanced tactics
│   ├── pages/
│   │   ├── api/
│   │   │   ├── ai/
│   │   │   │   ├── memory/
│   │   │   │   │   ├── store.ts           # Store memory endpoint
│   │   │   │   │   ├── search.ts          # Search memories endpoint
│   │   │   │   │   ├── related.ts         # Get related memories endpoint
│   │   │   │   │   ├── connect.ts         # Connect memories endpoint
│   │   │   │   │   └── record-outcome.ts  # Record memory outcome endpoint
├── docs/
│   ├── ai-memory-system/
│   │   ├── overview.md                    # System overview
│   │   ├── api-reference.md               # API documentation
│   │   ├── implementation-guide.md        # Developer guide
│   │   └── usage-guide.md                 # User guide
└── scripts/
    ├── test-ai-memory-system.js           # Integration test script
    └── test-ai-memory-system.env.sample   # Sample environment file
```

## Documentation

- [System Overview](./overview.md): High-level overview of the AI Memory System
- [API Reference](./api-reference.md): Detailed documentation of API endpoints
- [Implementation Guide](./implementation-guide.md): Technical guide for developers
- [Usage Guide](./usage-guide.md): Guide for non-technical users

## Getting Started

### Prerequisites

- PostgreSQL database with pgvector extension installed
- OpenAI API key for generating embeddings
- Node.js and npm

### Installation

1. Apply the database schema:
   ```bash
   psql -d your_database -f src/lib/ai/memory/schema.sql
   ```

2. Set environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Import and use the AIMemoryService in your code:
   ```typescript
   import { AIMemoryService } from '@/lib/ai/memory/ai-memory-service';
   
   const memoryService = new AIMemoryService();
   ```

## Testing

### Unit Tests

Run the unit tests for the memory service:

```bash
npm test -- src/lib/ai/memory/__tests__/ai-memory-service.test.ts
```

### Integration Tests

1. Copy the sample environment file:
   ```bash
   cp scripts/test-ai-memory-system.env.sample scripts/.env
   ```

2. Update the environment variables in the `.env` file

3. Run the integration test script:
   ```bash
   node scripts/test-ai-memory-system.js
   ```

## API Usage Examples

### Storing a Memory

```typescript
const memory = await memoryService.storeMemory({
  organization_id: 'org-id',
  user_id: 'user-id',
  content: 'Customer prefers email communication over phone calls',
  metadata: { customer_id: 'cust-123' },
  memory_type: 'PREFERENCE',
  importance_score: 0.7
});
```

### Searching Memories

```typescript
const results = await memoryService.searchMemories({
  query: 'customer communication preferences',
  memory_types: ['PREFERENCE'],
  metadata_filters: { customer_id: 'cust-123' }
}, 'org-id');
```

### Connecting Memories

```typescript
const relationship = await memoryService.connectMemories({
  organization_id: 'org-id',
  source_memory_id: 'memory-1',
  target_memory_id: 'memory-2',
  relationship_type: 'RELATED_TO',
  strength: 0.8
});
```

## Integration with Sales Tactics

The memory system enhances the existing sales tactics system:

```typescript
import { MemoryEnabledSalesTacticsService } from '@/lib/ai/sales-tactics-with-memory';

const tacticService = new MemoryEnabledSalesTacticsService();

// Get memory-enhanced tactics
const tactics = await tacticService.getMemoryEnhancedSalesTactics(
  personalityProfile,
  emailContext,
  organizationId
);

// Format for AI context
const formattedTactics = tacticService.formatEnhancedSalesTacticsForAIContext(tactics);
```

## Security Considerations

- All operations enforce multi-tenant isolation via organization_id
- Row-level security policies restrict access to organization data
- API endpoints require authentication and validate organization context
- Memory access is tracked for audit purposes

## Performance Considerations

- Vector indexes for efficient semantic search
- Strategic database indexes on frequently queried fields
- Caching opportunities for frequently accessed memories
- Background processing for non-critical operations

## Future Enhancements

- Memory consolidation and summarization
- Automated memory pruning for scalability
- Cross-organization pattern recognition (anonymized)
- Advanced memory visualization for transparency
- Memory export/import capabilities

## License

This project is proprietary and confidential. Unauthorized copying, transfer, or reproduction of the contents is strictly prohibited.

## Contact

For questions or support, contact the development team at dev@freshai.com.
