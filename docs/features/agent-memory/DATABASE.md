# Database Integration Guide

## Overview
This document explains how the Agent Memory System integrates with the database, including setup, migrations, and best practices.

## Database Requirements

### PostgreSQL Version
- Minimum: 13.0
- Recommended: 14.0 or higher

### Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
-- Optional: For vector similarity search
CREATE EXTENSION IF NOT EXISTS "vector";
```

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in your project root with:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: For local development
DATABASE_URL=postgresql://user:password@localhost:5432/your_database
```

### 2. Applying Migrations

#### Using the Script (Recommended)
```bash
node scripts/apply-memory-migrations.js
```

#### Manual Application
Run the SQL files in this order:
1. `src/lib/ai/memory/migrations/20230901_memory_context_management.sql`
2. `src/lib/ai/memory/migrations/20250706_agent_memory_config.sql`
3. `src/lib/ai/memory/migrations/20250707_agent_memory_stats.sql`

## Database Schema

### agent_memory_config
Stores per-agent memory configuration.

### ai_memory_contexts
Manages conversation contexts for memory retrieval.

### ai_memories
Stores individual memory entries.

## Security Model

### Row Level Security (RLS)
- Enabled on all tables
- Policies restrict access based on organization membership
- Service role bypasses RLS for migrations

### Authentication
- Uses Supabase Auth for user authentication
- JWT tokens contain organization context for access control

## Backup and Recovery

### Automated Backups
1. Configure in Supabase dashboard
2. Set up regular backup schedule
3. Enable point-in-time recovery

### Manual Backup
```bash
pg_dump -h your-db-host -U your-username -d your-database > backup.sql
```

## Performance Tuning

### Indexes
- Created on frequently queried columns
- Includes composite indexes for common access patterns

### Monitoring
- Set up monitoring for:
  - Query performance
  - Connection pool usage
  - Index utilization

## Troubleshooting

### Common Issues

#### Migration Failures
1. Verify database user has necessary permissions
2. Check for existing objects with conflicting names
3. Ensure all required extensions are installed

#### Performance Issues
1. Check for missing indexes
2. Review query execution plans
3. Monitor connection pool usage

## Maintenance

### Regular Maintenance Tasks
1. Update statistics: `ANALYZE;`
2. Rebuild indexes during maintenance windows
3. Monitor and adjust connection pool settings

## Support
For database-related issues, contact your database administrator or refer to the [Supabase documentation](https://supabase.com/docs).
