/**
 * Mock Server for Memory Integration Tests
 * 
 * This script creates a simple Express server that mocks the API endpoints
 * needed for the memory integration tests.
 */

import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());
app.use(cors());

// In-memory database for testing
const mockDb = {
  agentMemoryConfigs: {},
  memories: [],
  interactions: []
};

// Helper function to generate timestamps
const now = () => new Date().toISOString();

// GET /api/memory/agent-config/:id - Get agent memory configuration
app.get('/api/memory/agent-config/:id', (req, res) => {
  const agentId = req.params.id;
  const organizationId = extractOrgIdFromToken(req.headers.authorization);
  
  const configKey = `${organizationId}:${agentId}`;
  const config = mockDb.agentMemoryConfigs[configKey];
  
  if (!config) {
    // Return default configuration if not found
    return res.json({
      id: null,
      agentId: agentId,
      organizationId: organizationId,
      enableMemoryCreation: true,
      enableMemoryRetrieval: true,
      maxMemoriesToRetrieve: 10,
      minRelevanceScore: 0.7,
      memoryTypes: ['preference', 'feedback', 'interaction', 'observation', 'insight'],
      createdAt: now(),
      updatedAt: now()
    });
  }
  
  res.json(config);
});

// POST /api/memory/agent-config - Create agent memory configuration
app.post('/api/memory/agent-config', (req, res) => {
  const organizationId = extractOrgIdFromToken(req.headers.authorization);
  const { agentId, enableMemoryCreation, enableMemoryRetrieval, maxMemoriesToRetrieve, minRelevanceScore, memoryTypes } = req.body;
  
  const configKey = `${organizationId}:${agentId}`;
  const config = {
    id: uuidv4(),
    agentId,
    organizationId,
    enableMemoryCreation: enableMemoryCreation ?? true,
    enableMemoryRetrieval: enableMemoryRetrieval ?? true,
    maxMemoriesToRetrieve: maxMemoriesToRetrieve ?? 10,
    minRelevanceScore: minRelevanceScore ?? 0.7,
    memoryTypes: memoryTypes ?? ['preference', 'feedback', 'interaction', 'observation', 'insight'],
    createdAt: now(),
    updatedAt: now()
  };
  
  mockDb.agentMemoryConfigs[configKey] = config;
  
  res.status(201).json(config);
});

// PATCH /api/memory/agent-config/:id - Update agent memory configuration
app.patch('/api/memory/agent-config/:id', (req, res) => {
  const agentId = req.params.id;
  const organizationId = extractOrgIdFromToken(req.headers.authorization);
  
  const configKey = `${organizationId}:${agentId}`;
  let config = mockDb.agentMemoryConfigs[configKey];
  
  if (!config) {
    // Create a new config if it doesn't exist
    config = {
      id: uuidv4(),
      agentId,
      organizationId,
      enableMemoryCreation: true,
      enableMemoryRetrieval: true,
      maxMemoriesToRetrieve: 10,
      minRelevanceScore: 0.7,
      memoryTypes: ['preference', 'feedback', 'interaction', 'observation', 'insight'],
      createdAt: now(),
      updatedAt: now()
    };
    mockDb.agentMemoryConfigs[configKey] = config;
  }
  
  // Update config with request body
  const { enableMemoryCreation, enableMemoryRetrieval, maxMemoriesToRetrieve, minRelevanceScore, memoryTypes } = req.body;
  
  if (enableMemoryCreation !== undefined) {
    config.enableMemoryCreation = enableMemoryCreation;
  }
  
  if (enableMemoryRetrieval !== undefined) {
    config.enableMemoryRetrieval = enableMemoryRetrieval;
  }
  
  if (maxMemoriesToRetrieve !== undefined) {
    config.maxMemoriesToRetrieve = maxMemoriesToRetrieve;
  }
  
  if (minRelevanceScore !== undefined) {
    config.minRelevanceScore = minRelevanceScore;
  }
  
  if (memoryTypes !== undefined) {
    config.memoryTypes = memoryTypes;
  }
  
  config.updatedAt = now();
  
  res.json(config);
});

// POST /api/agents/:id/process-message - Process message with memory-enhanced agent
app.post('/api/agents/:id/process-message', (req, res) => {
  const agentId = req.params.id;
  const { contactId, content } = req.body;
  const organizationId = extractOrgIdFromToken(req.headers.authorization);
  
  // Create a memory context for this interaction
  const memoryContextId = uuidv4();
  
  // Create an interaction record
  const interaction = {
    id: uuidv4(),
    agentId,
    contactId,
    content,
    organizationId,
    memoryContextId,
    memoryContextRelevance: 0.85,
    memoryContextUsefulness: 0.75,
    memoriesCreated: 2,
    createdAt: now()
  };
  
  mockDb.interactions.push(interaction);
  
  // Create some sample memories
  const memories = [
    {
      id: uuidv4(),
      organizationId,
      memoryType: 'preference',
      content: `Contact ${contactId} is interested in the premium plan but concerned about price.`,
      importanceScore: 0.8,
      metadata: { agentId, contactId },
      createdAt: now()
    },
    {
      id: uuidv4(),
      organizationId,
      memoryType: 'insight',
      content: `Contact ${contactId} is price-sensitive but values premium features.`,
      importanceScore: 0.75,
      metadata: { agentId, contactId },
      createdAt: now()
    }
  ];
  
  mockDb.memories.push(...memories);
  
  // Return a simulated agent response
  res.json({
    id: uuidv4(),
    content: "I understand you're interested in our premium plan but concerned about the price. Let me tell you about the features that make it worth the investment...",
    agentId,
    contactId,
    memoryContextId,
    createdAt: now()
  });
});

// GET /api/memory/contact-insights/:id - Get memory insights for a contact
app.get('/api/memory/contact-insights/:id', (req, res) => {
  const contactId = req.params.id;
  const organizationId = extractOrgIdFromToken(req.headers.authorization);
  
  // Filter memories for this contact
  const insights = mockDb.memories.filter(memory => 
    memory.metadata.contactId === contactId && 
    memory.organizationId === organizationId &&
    ['preference', 'feedback', 'insight'].includes(memory.memoryType)
  );
  
  // If no insights exist, create some sample ones
  if (insights.length === 0) {
    const sampleInsights = [
      {
        id: uuidv4(),
        memory_type: 'preference',
        content: `Contact prefers email communication over phone calls.`,
        importance_score: 0.85,
        created_at: now(),
        metadata: { contactId, source: 'conversation' }
      },
      {
        id: uuidv4(),
        memory_type: 'insight',
        content: `Contact is evaluating multiple vendors and price is a key factor.`,
        importance_score: 0.9,
        created_at: now(),
        metadata: { contactId, source: 'conversation' }
      }
    ];
    
    res.json(sampleInsights);
  } else {
    // Format existing memories as insights
    const formattedInsights = insights.map(memory => ({
      id: memory.id,
      memory_type: memory.memoryType,
      content: memory.content,
      importance_score: memory.importanceScore,
      created_at: memory.createdAt,
      metadata: memory.metadata
    }));
    
    res.json(formattedInsights);
  }
});

// GET /api/memory/agent-stats/:id - Get memory statistics for an agent
app.get('/api/memory/agent-stats/:id', (req, res) => {
  const agentId = req.params.id;
  const organizationId = extractOrgIdFromToken(req.headers.authorization);
  
  // Count memories for this agent
  const agentMemories = mockDb.memories.filter(memory => 
    memory.metadata.agentId === agentId && 
    memory.organizationId === organizationId
  );
  
  // Generate memory type distribution
  const memoryTypes = {};
  agentMemories.forEach(memory => {
    memoryTypes[memory.memoryType] = (memoryTypes[memory.memoryType] || 0) + 1;
  });
  
  const memoryTypesArray = Object.entries(memoryTypes).map(([memory_type, count]) => ({
    memory_type,
    count
  }));
  
  // Generate memory usage over time (last 30 days)
  const memoryUsage = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    memoryUsage.push({
      date: dateStr,
      count: Math.floor(Math.random() * 5) // Random count for sample data
    });
  }
  
  // Return stats
  res.json({
    total_memories: agentMemories.length || Math.floor(Math.random() * 50) + 10,
    memory_types: memoryTypesArray.length ? memoryTypesArray : [
      { memory_type: 'preference', count: 15 },
      { memory_type: 'insight', count: 12 },
      { memory_type: 'interaction', count: 30 },
      { memory_type: 'feedback', count: 8 }
    ],
    memory_usage: memoryUsage,
    memory_feedback: {
      average_relevance: 0.82,
      average_usefulness: 0.78
    }
  });
});

// Helper function to extract organization ID from token
function extractOrgIdFromToken(authHeader) {
  if (!authHeader) return null;
  
  const token = authHeader.replace('Bearer ', '');
  
  try {
    // In a real implementation, this would decode and verify the JWT
    // For our mock, we'll extract the org_id from the test token or use a default
    return '12345678-9abc-def0-1234-56789abcdef0';
  } catch (error) {
    console.error('Error extracting org ID from token:', error);
    return null;
  }
}

// Start server
app.listen(PORT, () => {
  console.log(`Mock server running on http://localhost:${PORT}`);
});

export default app;
