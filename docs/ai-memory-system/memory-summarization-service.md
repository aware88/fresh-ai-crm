# Memory Summarization Service

## Overview
The Memory Summarization Service automatically clusters and summarizes AI memories to create higher-level insights. This improves the quality and relevance of AI responses by condensing large volumes of individual memories into actionable summaries.

## Key Features
- **Memory Clustering**: Groups similar memories by type and semantic similarity
- **AI-Powered Summarization**: Generates concise summaries using OpenAI
- **Summary Storage**: Stores summaries as new memories with relationships to originals
- **Scheduled Jobs**: Automatically runs summarization on a configurable schedule
- **Multi-tenant Isolation**: Maintains strict data separation between organizations

## Core Components

### 1. Clustering Engine
- `clusterMemoriesByType()`: Groups memories by their type (OBSERVATION, DECISION, etc.)
- `clusterMemoriesBySimilarity()`: Uses cosine similarity of embeddings to group related memories
- `calculateCosineSimilarity()`: Calculates similarity between memory embeddings

### 2. Summarization Engine
- `generateSummary()`: Creates a summary for a group of memories using OpenAI
- `summarizeMemoryGroup()`: Processes a group of memories into a summary
- `storeSummaryAsMemory()`: Saves the summary as a new memory with relationships

### 3. Scheduling System
- `scheduleRegularSummarization()`: Creates scheduled jobs for periodic summarization
- `summarizeAllMemories()`: Entry point for summarizing all eligible memories

### 4. Configuration
- `getConfigForOrganization()`: Retrieves organization-specific configuration
- Configurable parameters include:
  - Maximum memories per summary
  - Minimum memories for summarization
  - Similarity threshold
  - Feature flags

## Usage

### Manual Summarization
```typescript
const result = await memorySummarizationService.summarizeAllMemories(
  organizationId,
  userId // optional
);
```

### Scheduled Summarization
```typescript
const jobId = await memorySummarizationService.scheduleRegularSummarization(
  organizationId,
  24 // Run every 24 hours
);
```

## Testing
The service includes comprehensive tests covering:
- Memory clustering
- Summary generation
- Summary storage
- Scheduled jobs
- Multi-tenant isolation
- Error handling

## Implementation Status
- ✅ Core clustering algorithms
- ✅ OpenAI integration for summarization
- ✅ Summary storage with relationships
- ✅ Scheduled job creation
- ✅ Multi-tenant isolation
- ✅ Comprehensive test suite
