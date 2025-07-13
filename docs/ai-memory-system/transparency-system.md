# AI Transparency System

## Overview

The AI Transparency System is Phase 3 of the AI Memory System implementation. It builds on the foundation established in Phases 1 and 2 to provide complete transparency and user control over AI operations. This system allows users to view, manage, and control how AI agents operate within the CRM.

## Key Components

### 1. Database Schema

The transparency system uses three main tables:

- **ai_agent_activities**: Records all actions taken by AI agents
- **ai_agent_thoughts**: Captures the reasoning process behind agent decisions
- **ai_agent_settings**: Stores user-configurable settings for controlling agent behavior

The schema includes proper row-level security policies for multi-tenant isolation and appropriate indexes for performance.

### 2. TransparencyService

Core service that handles:

- Logging agent activities and thoughts
- Managing agent settings
- Retrieving activity history and thought processes
- Memory management from the transparency perspective

```typescript
// Example usage
const transparencyService = new TransparencyService(supabaseClient, organizationId);

// Log an activity
const activity = await transparencyService.logActivity({
  agentId: "agent-123",
  activityType: "process_message",
  description: "Processing message from contact",
  relatedEntityType: "contact",
  relatedEntityId: "contact-456"
});

// Log a thought process
await transparencyService.logThought({
  agentId: "agent-123",
  activityId: activity.id,
  thoughtStep: 1,
  reasoning: "Analyzing message content for intent",
  confidence: 0.85
});
```

### 3. TransparentSalesAgent

Extended version of the SalesAgent that:

- Logs all activities and thought processes
- Respects user-configured settings
- Provides detailed reasoning for decisions
- Allows control over agent behavior

```typescript
// Example usage
const agent = new TransparentSalesAgent(
  supabaseClient,
  openaiClient,
  "agent-123",
  organizationId
);

// Process a message with full transparency
const response = await agent.processContactMessage(message);

// Configure agent behavior
await agent.setActivityLogging(false);
await agent.setThoughtLogging(true);
```

### 4. API Endpoints

The system provides several API endpoints:

- `/api/ai/transparency/memories`: List, edit, delete memories
- `/api/ai/transparency/activities`: View agent activities
- `/api/ai/transparency/thoughts`: View agent reasoning
- `/api/ai/transparency/settings`: Control agent behavior

### 5. User Interface Components

The transparency dashboard includes:

- **Memory Browser**: View, search, edit, and delete AI memories
- **Activity Timeline**: Chronological view of agent activities with thought process details
- **Agent Control Panel**: Configure agent settings and behavior

## Implementation Details

### Multi-tenant Security

- Row-level security policies ensure organization isolation
- All operations include organization context
- User-specific settings support

### Error Handling

- Comprehensive error handling for all operations
- Detailed error logging
- Graceful fallbacks for failed operations

### Testing

- Unit tests for TransparencyService
- Unit tests for TransparentSalesAgent
- Integration tests for API endpoints

## Usage Examples

### Viewing Agent Activities

```javascript
// Client-side code
const fetchActivities = async (agentId) => {
  const response = await fetch(`/api/ai/transparency/activities?agentId=${agentId}`);
  const data = await response.json();
  return data.activities;
};
```

### Configuring Agent Settings

```javascript
// Client-side code
const updateAgentSetting = async (agentId, settingKey, settingValue) => {
  const response = await fetch('/api/ai/transparency/settings', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId,
      settingKey,
      settingValue
    }),
  });
  return await response.json();
};
```

## Integration with Existing Systems

The Transparency System integrates with:

1. **AI Memory System**: Provides visibility and control over stored memories
2. **Sales Agent Core**: Extends agents with transparency features
3. **CRM Frontend**: Adds transparency dashboard to the user interface

## Future Enhancements

1. **Advanced Filtering**: More sophisticated filtering of activities and memories
2. **Bulk Operations**: Batch editing and deletion of memories
3. **Visualization Tools**: Graphical representation of agent decision processes
4. **Export/Import**: Data portability for transparency data
5. **Notification System**: Alerts for important agent activities

## Technical Requirements

- Supabase database with vector extension
- Next.js frontend
- OpenAI API for embedding generation
- Tailwind CSS for styling components
