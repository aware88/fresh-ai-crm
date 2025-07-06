# Sales Agent Core

## Overview

The Sales Agent Core is Phase 2 of the AI Memory System implementation. It builds on the foundation established in Phase 1 to create intelligent sales agents that can engage in conversations with contacts, make decisions, and learn from interactions over time.

## Key Components

### 1. Agent Personalities

Agent personalities define the behavioral characteristics of sales agents:

- **Tone**: The emotional tone of the agent (friendly, professional, etc.)
- **Communication Style**: How the agent structures communication
- **Empathy Level**: How well the agent recognizes and responds to emotions
- **Assertiveness Level**: How direct and confident the agent is
- **Formality Level**: How formal or casual the agent's language is
- **Humor Level**: How much humor the agent incorporates
- **Expertise Areas**: Domains where the agent has specialized knowledge

### 2. Agent Configurations

Agent configurations define operational parameters:

- **Personality**: Link to the agent's personality profile
- **Default Goals**: Initial goals for conversations
- **Allowed Actions**: Actions the agent can take
- **Memory Access Level**: How the agent can interact with the memory system
- **Decision Confidence Threshold**: Minimum confidence required for decisions
- **Message Length**: Maximum length of agent messages
- **Response Time Target**: Target response time in milliseconds

### 3. Conversation Context

Conversation context tracks the state of ongoing conversations:

- **Current State**: Where in the sales process the conversation is
- **Current Goal**: What the agent is trying to achieve
- **Contact History**: Summary of past interactions
- **Recent Interactions**: Recent messages for context
- **Relevant Memories**: IDs of memories relevant to the conversation

### 4. Decision-Making Framework

The decision-making framework enables agents to:

- Analyze contact messages
- Consider relevant memories
- Evaluate appropriate sales tactics
- Make decisions with confidence scores
- Select actions based on the conversation state
- Generate appropriate responses

### 5. Memory Integration

Memory integration connects the agent with the AI Memory System:

- **Memory Preferences**: What types of memories to create and access
- **Memory Weighting**: How to prioritize memories (recency, relevance, importance)
- **Memory Recording**: Storing decisions and interactions as memories
- **Memory Relationships**: Connecting related memories

## API Endpoints

### Agent Management

- `POST /api/ai/agent/personalities`: Create agent personality
- `GET /api/ai/agent/personalities`: List or get agent personalities
- `PUT /api/ai/agent/personalities`: Update agent personality
- `DELETE /api/ai/agent/personalities`: Delete agent personality
- `POST /api/ai/agent/configs`: Create agent configuration
- `GET /api/ai/agent/configs`: List or get agent configurations
- `PUT /api/ai/agent/configs`: Update agent configuration
- `DELETE /api/ai/agent/configs`: Delete agent configuration
- `GET /api/ai/agent/memory-preferences`: Get agent memory preferences
- `PUT /api/ai/agent/memory-preferences`: Update agent memory preferences

### Conversation Management

- `POST /api/ai/agent/process-message`: Process a contact message and generate response

## Database Schema

The Sales Agent Core uses the following tables:

1. `agent_personalities`: Stores personality profiles
2. `agent_configs`: Stores agent configurations
3. `agent_memory_preferences`: Stores memory-related preferences
4. `conversation_contexts`: Tracks conversation state and context
5. `agent_decisions`: Records decisions made by agents
6. `agent_messages`: Stores messages sent by agents
7. `contact_messages`: Stores messages sent by contacts
8. `contact_personality_profiles`: Stores contact personality data

## Integration with AI Memory System

The Sales Agent Core integrates with the AI Memory System in several ways:

1. **Memory Storage**:
   - Stores agent decisions as memories
   - Stores agent and contact messages as interaction memories
   - Generates insights from significant interactions

2. **Memory Retrieval**:
   - Searches for relevant memories during conversations
   - Retrieves memories related to specific contacts
   - Uses memory importance to prioritize retrieval

3. **Memory Relationships**:
   - Connects decisions to resulting messages
   - Links contact messages to agent responses
   - Establishes cause-effect relationships between memories

4. **Memory Learning**:
   - Records outcomes of agent decisions
   - Updates memory importance based on outcomes
   - Learns from successful and unsuccessful interactions

## Usage Example

```typescript
// Create a sales agent service
const salesAgentService = new SalesAgentService();

// Process a contact message
const result = await salesAgentService.processContactMessage({
  organization_id: 'org-123',
  contact_id: 'contact-456',
  conversation_id: 'conv-789',
  content: "I'm interested in your product but concerned about the price.",
  metadata: {
    agent_id: 'agent-123',
    source: 'chat'
  },
  created_at: new Date().toISOString()
});

// Get the agent's response
console.log(result.response.content);
```

## Security Considerations

- All operations enforce multi-tenant isolation via organization_id
- Row-level security policies restrict access to organization data
- API endpoints require authentication and validate organization context
- Agent configurations control memory access levels

## Performance Considerations

- Conversation contexts are cached for quick access
- Memory retrieval is optimized with relevance, recency, and importance weights
- Database indexes on frequently queried fields
- Asynchronous processing for non-critical operations

## Testing

The Sales Agent Core includes comprehensive testing:

1. **Unit Tests**: Test individual components and functions
2. **Integration Tests**: Test the interaction between components
3. **End-to-End Tests**: Test the complete flow from contact message to agent response

To run the integration tests:

```bash
# Copy the sample environment file
cp scripts/test-sales-agent-core.env.sample scripts/.env

# Update the environment variables in the .env file

# Run the test script
node scripts/test-sales-agent-core.js
```

## Future Enhancements

- **Advanced NLP**: Sentiment analysis and intent detection
- **Multi-turn Planning**: Planning multiple steps ahead in conversations
- **Adaptive Personalities**: Adjusting personality based on contact preferences
- **Team Collaboration**: Multiple agents collaborating on complex sales
- **Performance Analytics**: Detailed analytics on agent performance

## Conclusion

The Sales Agent Core builds on the AI Memory System to create intelligent, personalized sales agents that can engage in meaningful conversations with contacts. By leveraging memory, learning from interactions, and adapting to contact preferences, these agents can provide a more effective and personalized sales experience.
