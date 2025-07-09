# AI Memory System Implementation Guide

## Introduction

This technical guide provides detailed information on how to implement, integrate with, and extend the AI Memory System within the CRM Mind platform. It's intended for developers who need to work with the memory system or build features that leverage its capabilities.

## System Architecture

The AI Memory System follows a layered architecture:

1. **Database Layer**: PostgreSQL with pgvector extension for vector storage and search
2. **Service Layer**: TypeScript classes that encapsulate memory operations
3. **API Layer**: Next.js API routes that expose memory functionality
4. **Integration Layer**: Components that connect the memory system to other parts of the CRM

```
┌─────────────────────────┐
│   CRM Applications      │
│  (Sales, Email, etc.)   │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│  Memory Integration     │
│  (e.g., Sales Tactics)  │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│    Memory API Layer     │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│   Memory Service Layer  │
└───────────┬─────────────┘
            │
┌───────────▼─────────────┐
│     Database Layer      │
└─────────────────────────┘
```

## Database Schema

The AI Memory System uses three primary tables:

### ai_memories

```sql
CREATE TABLE ai_memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  content TEXT NOT NULL,
  embedding VECTOR(1536) NOT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  memory_type TEXT NOT NULL,
  importance_score FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ai_memory_relationships

```sql
CREATE TABLE ai_memory_relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  source_memory_id UUID NOT NULL REFERENCES ai_memories(id),
  target_memory_id UUID NOT NULL REFERENCES ai_memories(id),
  relationship_type TEXT NOT NULL,
  strength FLOAT DEFAULT 0.5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### ai_memory_access

```sql
CREATE TABLE ai_memory_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  memory_id UUID NOT NULL REFERENCES ai_memories(id),
  user_id UUID REFERENCES auth.users(id),
  access_type TEXT NOT NULL,
  context TEXT,
  outcome TEXT,
  outcome_score FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Core Service Implementation

The `AIMemoryService` class provides the foundation for all memory operations. Here's how to use it:

### Initialization

```typescript
import { AIMemoryService } from '@/lib/ai/memory/ai-memory-service';

// Create a new instance
const memoryService = new AIMemoryService();
```

### Storing Memories

```typescript
// Create a memory object
const memory = {
  organization_id: 'org-uuid',
  user_id: 'user-uuid', // Optional
  content: 'Memory content text',
  metadata: { key1: 'value1', key2: 'value2' },
  memory_type: AIMemoryType.DECISION,
  importance_score: 0.7 // Optional, defaults to 0.5
};

// Store the memory
const storedMemory = await memoryService.storeMemory(memory);
```

### Searching Memories

```typescript
// Create search parameters
const searchParams = {
  query: 'Search query text',
  memory_types: [AIMemoryType.DECISION, AIMemoryType.OBSERVATION], // Optional
  min_importance: 0.3, // Optional
  max_results: 10, // Optional
  time_range: { // Optional
    start: new Date('2023-01-01'),
    end: new Date()
  },
  metadata_filters: { // Optional
    key1: 'value1'
  }
};

// Search memories
const searchResults = await memoryService.searchMemories(searchParams, 'org-uuid');
```

### Connecting Memories

```typescript
// Create a relationship
const relationship = {
  organization_id: 'org-uuid',
  source_memory_id: 'source-memory-uuid',
  target_memory_id: 'target-memory-uuid',
  relationship_type: AIMemoryRelationshipType.CAUSED,
  strength: 0.9 // Optional, defaults to 0.5
};

// Connect memories
const createdRelationship = await memoryService.connectMemories(relationship);
```

### Recording Memory Access

```typescript
// Create an access record
const access = {
  organization_id: 'org-uuid',
  memory_id: 'memory-uuid',
  user_id: 'user-uuid', // Optional
  access_type: AIMemoryAccessType.RETRIEVE,
  context: 'Context of access'
};

// Record access
const accessRecord = await memoryService.recordMemoryAccess(access);
```

### Updating Memory Outcomes

```typescript
// Update outcome for an access
const updatedAccess = await memoryService.updateMemoryOutcome(
  'access-uuid',
  'Positive outcome description',
  0.8 // Optional, defaults to 0.5
);

// Update memory importance based on outcomes
const updatedMemory = await memoryService.updateMemoryImportance('memory-uuid', 'org-uuid');
```

## Integration with Sales Tactics

The `MemoryEnabledSalesTacticsService` demonstrates how to integrate the memory system with existing CRM features:

```typescript
import { MemoryEnabledSalesTacticsService } from '@/lib/ai/sales-tactics-with-memory';

// Create a new instance
const tacticService = new MemoryEnabledSalesTacticsService();

// Get memory-enhanced sales tactics
const personalityProfile = {
  Tone_Preference: 'friendly, professional',
  Emotional_Trigger: 'achievement'
};

const emailContext = {
  subject: 'Meeting follow-up',
  content: 'Thank you for taking the time to meet with us yesterday...'
};

const enhancedTactics = await tacticService.getMemoryEnhancedSalesTactics(
  personalityProfile,
  emailContext,
  'org-uuid'
);

// Format tactics for AI context
const formattedTactics = tacticService.formatEnhancedSalesTacticsForAIContext(enhancedTactics);

// Store a tactic decision
const tactic = enhancedTactics[0];
const context = {
  email_id: 'email-uuid',
  contact_id: 'contact-uuid',
  content: emailContext.content
};

const tacticMemory = await tacticService.storeTacticDecision(
  tactic,
  context,
  'org-uuid',
  'user-uuid'
);

// Record tactic outcome
const outcome = {
  tactic_id: tactic.id,
  email_id: 'email-uuid',
  contact_id: 'contact-uuid',
  outcome_type: 'positive',
  outcome_details: 'Customer responded positively and scheduled a demo',
  outcome_score: 0.9
};

const updatedMemory = await tacticService.recordTacticOutcome(
  outcome,
  'org-uuid',
  'user-uuid'
);
```

## API Integration

To integrate with the memory system via API endpoints:

### Storing a Memory

```typescript
// Client-side example
const response = await fetch('/api/ai/memory/store', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: 'Memory content text',
    metadata: { key1: 'value1' },
    memory_type: 'DECISION',
    importance_score: 0.7
  })
});

const data = await response.json();
const memoryId = data.memory.id;
```

### Searching Memories

```typescript
// Client-side example
const response = await fetch('/api/ai/memory/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'Search query text',
    memory_types: ['DECISION', 'OBSERVATION'],
    min_importance: 0.3,
    max_results: 10
  })
});

const data = await response.json();
const searchResults = data.results;
```

## Best Practices

### Memory Content

- Keep memory content concise and focused
- Include relevant context but avoid unnecessary details
- Use consistent formatting for similar types of memories
- Consider searchability when writing memory content

### Memory Types

- Choose the most specific memory type available
- Be consistent in how you categorize memories
- Consider creating custom memory types for specific use cases

### Metadata

- Use metadata for structured information about the memory
- Include IDs of related entities (contacts, emails, etc.)
- Add timestamps for events referenced in the memory
- Include categorization tags for better filtering

### Importance Scores

- Start with a reasonable default (0.5 for average importance)
- Use higher scores (0.7-1.0) for critical information
- Use lower scores (0.0-0.3) for routine or less important information
- Let the system adjust scores over time based on usage

### Performance Considerations

- Batch memory operations when possible
- Use specific search parameters to limit result sets
- Consider caching frequently accessed memories
- Use background processing for non-critical operations

## Extending the System

### Adding New Memory Types

1. Add the new type to the `AIMemoryType` enum in `ai-memory-service.ts`
2. Update any UI components that display memory types
3. Consider adding type-specific processing in the service layer

### Adding New Relationship Types

1. Add the new type to the `AIMemoryRelationshipType` enum in `ai-memory-service.ts`
2. Update any UI components that display relationship types
3. Consider adding type-specific processing in the service layer

### Creating Custom Memory Services

You can extend the base `AIMemoryService` class for specific use cases:

```typescript
import { AIMemoryService, AIMemoryType } from '@/lib/ai/memory/ai-memory-service';

export class CustomerMemoryService extends AIMemoryService {
  // Store a customer interaction memory
  async storeCustomerInteraction(
    organizationId: string,
    userId: string,
    customerId: string,
    interactionType: string,
    content: string
  ) {
    return this.storeMemory({
      organization_id: organizationId,
      user_id: userId,
      content,
      metadata: {
        customer_id: customerId,
        interaction_type: interactionType
      },
      memory_type: AIMemoryType.INTERACTION,
      importance_score: 0.6
    });
  }
  
  // Get customer history
  async getCustomerHistory(customerId: string, organizationId: string) {
    const searchParams = {
      query: `customer ${customerId}`,
      metadata_filters: { customer_id: customerId },
      max_results: 50
    };
    
    return this.searchMemories(searchParams, organizationId);
  }
}
```

## Testing

The AI Memory System includes comprehensive tests:

```bash
# Run memory service tests
npm test -- src/lib/ai/memory/__tests__/ai-memory-service.test.ts
```

When writing tests for components that use the memory system:

1. Mock the `AIMemoryService` methods
2. Test both success and error paths
3. Verify that organization ID is always included
4. Test multi-tenant isolation

## Troubleshooting

### Common Issues

1. **Missing OpenAI API Key**
   - Error: "OpenAI API key is required"
   - Solution: Set the OPENAI_API_KEY environment variable

2. **Vector Search Errors**
   - Error: "Function cosine_distance does not exist"
   - Solution: Ensure pgvector extension is installed in the database

3. **Permission Errors**
   - Error: "new row violates row-level security policy"
   - Solution: Check that organization_id is correctly set and RLS policies are in place

### Debugging

1. Enable debug logging:

```typescript
// Set environment variable
process.env.DEBUG_AI_MEMORY = 'true';

// In AIMemoryService
private debug(message: string, data?: any) {
  if (process.env.DEBUG_AI_MEMORY === 'true') {
    console.log(`[AIMemoryService] ${message}`, data || '');
  }
}
```

2. Check Supabase logs for database errors
3. Use the browser console to debug API calls
4. Monitor memory usage patterns with analytics

## Conclusion

The AI Memory System provides a powerful foundation for building intelligent, learning AI features in the CRM Mind. By following this implementation guide, you can effectively integrate with and extend the system to create increasingly personalized and effective AI experiences.
