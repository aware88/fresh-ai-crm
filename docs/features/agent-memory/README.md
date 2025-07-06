# Agent Memory System

## Overview
The Agent Memory System enables Fresh AI CRM agents to maintain context across conversations, remember important details, and provide more personalized interactions with contacts.

## Features

### 1. Memory Configuration
- Per-agent memory settings
- Configurable memory types (preferences, feedback, interactions, observations, insights)
- Adjustable relevance thresholds

### 2. Memory Management
- Create and update memories
- Retrieve relevant memories based on context
- Automatic memory cleanup and pruning

### 3. Analytics
- Memory usage statistics
- Contact memory insights
- Performance metrics

## Database Schema

### agent_memory_config
Stores configuration for agent memory settings.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| agent_id | UUID | Reference to agents table |
| organization_id | UUID | Reference to organizations table |
| enable_memory_creation | BOOLEAN | Whether memory creation is enabled |
| enable_memory_retrieval | BOOLEAN | Whether memory retrieval is enabled |
| max_memories_to_retrieve | INTEGER | Maximum number of memories to retrieve |
| min_relevance_score | FLOAT | Minimum relevance score for memories |
| memory_types | TEXT[] | Array of enabled memory types |
| created_at | TIMESTAMP | When the config was created |
| updated_at | TIMESTAMP | When the config was last updated |

### ai_memory_contexts
Stores memory contexts for conversations.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| organization_id | UUID | Reference to organizations table |
| agent_id | UUID | Reference to agents table |
| contact_id | UUID | Reference to contacts table |
| content | TEXT | Context content |
| metadata | JSONB | Additional metadata |
| created_at | TIMESTAMP | When the context was created |
| updated_at | TIMESTAMP | When the context was last updated |

## API Reference

### Memory Configuration

#### Create/Update Agent Memory Configuration
```http
POST /api/memory/agent-config
Content-Type: application/json
Authorization: Bearer <token>

{
  "agentId": "uuid",
  "enableMemoryCreation": true,
  "enableMemoryRetrieval": true,
  "maxMemoriesToRetrieve": 10,
  "minRelevanceScore": 0.7,
  "memoryTypes": ["preference", "feedback", "interaction", "observation", "insight"]
}
```

#### Get Agent Memory Configuration
```http
GET /api/memory/agent-config/{agentId}
Authorization: Bearer <token>
```

#### Update Agent Memory Configuration
```http
PATCH /api/memory/agent-config/{agentId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "enableMemoryCreation": true,
  "maxMemoriesToRetrieve": 15
}
```

### Memory Insights

#### Get Contact Memory Insights
```http
GET /api/memory/contact-insights/{contactId}
Authorization: Bearer <token>
```

#### Get Agent Memory Statistics
```http
GET /api/memory/agent-stats/{agentId}
Authorization: Bearer <token>
```

## Testing

### Running Tests

#### With Mock Server
```bash
cd tests/memory
./run-memory-tests.sh
```

#### Against Real Backend
```bash
cd tests/memory
node test-agent-memory-integration.js
```

### Test Coverage
- Unit tests for database functions
- Integration tests for API endpoints
- Mock server for isolated testing

## Setup

### Prerequisites
- Node.js 16+
- PostgreSQL 13+
- Supabase

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (copy from .env.example)
4. Run database migrations

## Development

### Adding New Memory Types
1. Add the new type to the `memory_types` enum in the database
2. Update the `memoryTypes` array in the agent memory config
3. Add any necessary migration scripts

### Best Practices
- Always include proper error handling
- Use transactions for multi-step operations
- Follow the principle of least privilege for database access
- Document all public API endpoints

## Troubleshooting

### Common Issues

#### Memory Not Being Retrieved
- Check if memory retrieval is enabled in the agent's config
- Verify the relevance score threshold
- Check for any filters that might be excluding the memory

#### Performance Issues
- Ensure proper indexes are in place
- Check for large memory sets that might need pagination
- Monitor query performance

## License
[Your License Here]

## Contributing
1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
