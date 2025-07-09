# AI Memory System API Reference

## Overview

This document provides detailed information about the API endpoints available in the AI Memory System. These endpoints allow you to store, search, connect, and manage AI memories within the CRM Mind platform.

## Authentication

All API endpoints require authentication using a valid session token. The token must be included in the request headers as follows:

```
Authorization: Bearer <token>
```

Additionally, all endpoints enforce multi-tenant isolation based on the organization ID associated with the authenticated user.

## API Endpoints

### 1. Store Memory

Creates a new memory in the system with vector embeddings.

**Endpoint:** `POST /api/ai/memory/store`

**Request Body:**

```json
{
  "content": "Memory content text",
  "metadata": {
    "key1": "value1",
    "key2": "value2"
  },
  "memory_type": "DECISION",
  "importance_score": 0.7,
  "user_id": "optional-user-id"
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| content | string | Yes | The text content of the memory |
| metadata | object | No | Additional structured data about the memory |
| memory_type | string | Yes | Type of memory (DECISION, OBSERVATION, FEEDBACK, INTERACTION, TACTIC, PREFERENCE, INSIGHT) |
| importance_score | number | No | Initial importance score (0-1), defaults to 0.5 |
| user_id | string | No | ID of the user associated with this memory |

**Response:**

```json
{
  "memory": {
    "id": "memory-uuid",
    "organization_id": "org-id",
    "user_id": "user-id",
    "content": "Memory content text",
    "embedding": [...],
    "metadata": { "key1": "value1", "key2": "value2" },
    "memory_type": "DECISION",
    "importance_score": 0.7,
    "created_at": "2023-07-05T07:11:32.000Z",
    "updated_at": "2023-07-05T07:11:32.000Z"
  }
}
```

**Error Codes:**

- `400`: Missing required fields
- `401`: Unauthorized
- `500`: Server error

### 2. Search Memories

Searches for memories using semantic similarity.

**Endpoint:** `POST /api/ai/memory/search`

**Request Body:**

```json
{
  "query": "Search query text",
  "memory_types": ["DECISION", "OBSERVATION"],
  "min_importance": 0.3,
  "max_results": 10,
  "time_range": {
    "start": "2023-01-01T00:00:00.000Z",
    "end": "2023-07-05T00:00:00.000Z"
  },
  "metadata_filters": {
    "key1": "value1"
  }
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| query | string | Yes | Text to search for |
| memory_types | array | No | Types of memories to include in search |
| min_importance | number | No | Minimum importance score (0-1) |
| max_results | number | No | Maximum number of results to return |
| time_range | object | No | Time range for memory creation |
| metadata_filters | object | No | Filter by metadata key-value pairs |

**Response:**

```json
{
  "results": [
    {
      "memory": {
        "id": "memory-uuid",
        "organization_id": "org-id",
        "user_id": "user-id",
        "content": "Memory content text",
        "metadata": { "key1": "value1" },
        "memory_type": "DECISION",
        "importance_score": 0.7,
        "created_at": "2023-07-05T07:11:32.000Z",
        "updated_at": "2023-07-05T07:11:32.000Z"
      },
      "similarity": 0.92
    }
  ]
}
```

**Error Codes:**

- `400`: Missing required fields
- `401`: Unauthorized
- `500`: Server error

### 3. Get Related Memories

Retrieves memories related to a specific memory.

**Endpoint:** `GET /api/ai/memory/related?memoryId=memory-uuid`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| memoryId | string | Yes | ID of the memory to find related memories for |

**Response:**

```json
{
  "memories": [
    {
      "memory": {
        "id": "related-memory-uuid",
        "organization_id": "org-id",
        "user_id": "user-id",
        "content": "Related memory content",
        "metadata": { "key1": "value1" },
        "memory_type": "OBSERVATION",
        "importance_score": 0.6,
        "created_at": "2023-07-04T07:11:32.000Z",
        "updated_at": "2023-07-04T07:11:32.000Z"
      },
      "relationship": {
        "id": "relationship-uuid",
        "source_memory_id": "memory-uuid",
        "target_memory_id": "related-memory-uuid",
        "relationship_type": "RELATED_TO",
        "strength": 0.8,
        "created_at": "2023-07-05T07:11:32.000Z"
      }
    }
  ]
}
```

**Error Codes:**

- `400`: Missing memory ID
- `401`: Unauthorized
- `500`: Server error

### 4. Connect Memories

Creates a relationship between two memories.

**Endpoint:** `POST /api/ai/memory/connect`

**Request Body:**

```json
{
  "source_memory_id": "source-memory-uuid",
  "target_memory_id": "target-memory-uuid",
  "relationship_type": "CAUSED",
  "strength": 0.9
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| source_memory_id | string | Yes | ID of the source memory |
| target_memory_id | string | Yes | ID of the target memory |
| relationship_type | string | Yes | Type of relationship (CAUSED, RELATED_TO, CONTRADICTS, SUPPORTS, FOLLOWS, PRECEDES) |
| strength | number | No | Strength of the relationship (0-1), defaults to 0.5 |

**Response:**

```json
{
  "relationship": {
    "id": "relationship-uuid",
    "organization_id": "org-id",
    "source_memory_id": "source-memory-uuid",
    "target_memory_id": "target-memory-uuid",
    "relationship_type": "CAUSED",
    "strength": 0.9,
    "created_at": "2023-07-05T07:11:32.000Z"
  }
}
```

**Error Codes:**

- `400`: Missing required fields
- `401`: Unauthorized
- `500`: Server error

### 5. Record Memory Outcome

Records the outcome of a memory access.

**Endpoint:** `POST /api/ai/memory/record-outcome`

**Request Body:**

```json
{
  "access_id": "access-uuid",
  "outcome": "Positive outcome description",
  "outcome_score": 0.8
}
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| access_id | string | Yes | ID of the memory access record |
| outcome | string | Yes | Description of the outcome |
| outcome_score | number | No | Score of the outcome (0-1), defaults to 0.5 |

**Response:**

```json
{
  "access": {
    "id": "access-uuid",
    "organization_id": "org-id",
    "memory_id": "memory-uuid",
    "user_id": "user-id",
    "access_type": "APPLY",
    "context": "Context of access",
    "outcome": "Positive outcome description",
    "outcome_score": 0.8,
    "created_at": "2023-07-05T07:11:32.000Z",
    "updated_at": "2023-07-05T07:11:32.000Z"
  }
}
```

**Error Codes:**

- `400`: Missing required fields
- `401`: Unauthorized
- `500`: Server error

## Error Handling

All API endpoints return standard HTTP status codes:

- `200`: Success
- `400`: Bad request (missing or invalid parameters)
- `401`: Unauthorized (missing or invalid authentication)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

Error responses include a JSON body with error details:

```json
{
  "error": "Error message",
  "details": "Additional error details"
}
```

## Rate Limiting

API endpoints are subject to rate limiting to prevent abuse. The current limits are:

- 100 requests per minute per user
- 1000 requests per hour per organization

When rate limits are exceeded, the API returns a `429 Too Many Requests` status code.
