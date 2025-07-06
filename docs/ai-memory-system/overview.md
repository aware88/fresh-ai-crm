# AI Memory System Overview

## Introduction

The AI Memory System is a core component of the Fresh AI CRM's intelligent agent infrastructure. It enables AI agents to store, retrieve, and learn from past interactions and decisions, creating a continuously improving system that delivers increasingly personalized and effective assistance over time.

Unlike simple data storage, this system is designed to facilitate true learning by:

1. Storing structured memories with semantic embeddings
2. Tracking relationships between memories
3. Recording access patterns and outcomes
4. Adjusting importance based on usage and effectiveness
5. Integrating with existing AI systems like sales tactics

## Core Components

### 1. Database Schema

The AI Memory System uses three primary tables:

- **ai_memories**: Stores individual memory entries with vector embeddings for semantic search
- **ai_memory_relationships**: Tracks connections between related memories
- **ai_memory_access**: Records when and how memories are accessed, and their outcomes

The schema includes:
- Vector embeddings using pgvector extension
- Multi-tenant isolation via organization_id
- Row-level security policies
- Optimized indexes for performance

### 2. AI Memory Service

The `AIMemoryService` class provides the core functionality:

- **Memory Storage**: Generate embeddings and store memories
- **Semantic Search**: Find relevant memories using vector similarity
- **Relationship Management**: Connect related memories
- **Access Tracking**: Record memory usage and outcomes
- **Importance Calculation**: Dynamically adjust memory importance

### 3. API Layer

RESTful API endpoints for interacting with the memory system:

- **/api/ai/memory/store**: Create new memories
- **/api/ai/memory/search**: Search memories by semantic similarity
- **/api/ai/memory/related**: Find related memories
- **/api/ai/memory/connect**: Create relationships between memories
- **/api/ai/memory/record-outcome**: Record outcomes of memory usage

### 4. Sales Tactics Integration

The `MemoryEnabledSalesTacticsService` extends the existing sales tactics system with memory capabilities:

- **Enhanced Tactic Selection**: Prioritize tactics based on past effectiveness
- **Tactic Decision Storage**: Record when tactics are used
- **Outcome Recording**: Track the results of tactic application
- **Effectiveness Learning**: Adjust tactic importance based on outcomes
- **Insight Generation**: Create higher-level insights from patterns

## Memory Types

The system supports various memory types:

- **DECISION**: Records of decisions made by AI agents
- **OBSERVATION**: Factual observations about users or contexts
- **FEEDBACK**: User feedback on AI actions
- **INTERACTION**: Records of user-AI interactions
- **TACTIC**: Sales tactics and their application
- **PREFERENCE**: User preferences and tendencies
- **INSIGHT**: Higher-level patterns and conclusions

## Relationship Types

Memories can be connected with various relationship types:

- **CAUSED**: One memory led to another
- **RELATED_TO**: General relationship between memories
- **CONTRADICTS**: One memory contradicts another
- **SUPPORTS**: One memory supports or reinforces another
- **FOLLOWS**: Temporal relationship (after)
- **PRECEDES**: Temporal relationship (before)

## Security and Multi-tenancy

The AI Memory System maintains strict multi-tenant isolation:

- All tables include organization_id for tenant isolation
- Row-level security policies restrict access to organization data
- API endpoints enforce authentication and organization context
- Memory access is tracked for audit purposes

## Performance Considerations

The system is designed for performance:

- Vector indexes for efficient semantic search
- Strategic database indexes on frequently queried fields
- Caching opportunities for frequently accessed memories
- Background processing for non-critical operations

## Integration Points

The AI Memory System integrates with:

- **Sales Tactics**: Enhanced with memory-based effectiveness data
- **OpenAI API**: For generating embeddings and semantic search
- **Supabase**: For database operations and RLS policies
- **Authentication**: For user context and multi-tenant isolation

## Next Steps

Future enhancements to the memory system include:

- Memory consolidation and summarization
- Automated memory pruning for scalability
- Cross-organization pattern recognition (anonymized)
- Advanced memory visualization for transparency
- Memory export/import capabilities
