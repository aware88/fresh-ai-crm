# Quick Start Guide: Agent Memory System

## Prerequisites
- Node.js 16+
- PostgreSQL 13+
- Supabase project

## Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd crm-mind
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd tests/memory
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Run database migrations**
   ```bash
   node scripts/apply-memory-migrations.js
   ```

## Running Tests

### With Mock Server
```bash
cd tests/memory
./run-memory-tests.sh
```

### Against Real Backend
```bash
cd tests/memory
node test-agent-memory-integration.js
```

## Basic Usage

### Configure Agent Memory
```javascript
const response = await fetch('/api/memory/agent-config', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer <token>'
  },
  body: JSON.stringify({
    agentId: 'your-agent-id',
    enableMemoryCreation: true,
    enableMemoryRetrieval: true,
    maxMemoriesToRetrieve: 10,
    minRelevanceScore: 0.7,
    memoryTypes: ['preference', 'feedback', 'interaction']
  })
});
```

### Get Memory Insights
```javascript
const response = await fetch('/api/memory/contact-insights/contact-id', {
  headers: {
    'Authorization': 'Bearer <token>'
  }
});
```

## Next Steps
- Explore the [API Reference](./README.md#api-reference)
- Check out the [test suite](../tests/memory/)
- Review the [database schema](./README.md#database-schema)
