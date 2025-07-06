# AI Memory System Tests

This directory contains the test suite for the AI Memory System, which provides vector-based memory storage and retrieval capabilities using Supabase and OpenAI embeddings.

## Test Structure

The test suite includes the following components:

- `test-memory-service.js`: Main test file that exercises the MemoryService class
- `test.config.js`: Configuration for the test environment
- `test-helpers.js`: Utility functions for testing
- `test.env.sample`: Example environment file (copy to `.env` and fill in your values)
- `run-tests.js`: Test runner script

## Prerequisites

Before running the tests, you'll need:

1. Node.js (v14 or later)
2. A Supabase project with the AI Memory schema applied
3. An OpenAI API key

## Setup

1. Copy the example environment file:
   ```bash
   cp test.env.sample .env
   ```

2. Edit the `.env` file and fill in your configuration:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ORGANIZATION_ID=your_organization_id
   OPENAI_API_KEY=your_openai_api_key
   ```

3. Install dependencies:
   ```bash
   npm install @supabase/supabase-js dotenv
   ```

## Running Tests

To run the entire test suite:

```bash
node run-tests.js
```

Or make the script executable and run it directly:

```bash
chmod +x run-tests.js
./run-tests.js
```

## Test Coverage

The test suite covers the following functionality:

1. **Memory Creation**
   - Creating a new memory with content and metadata
   - Automatic embedding generation
   - Proper organization and user association

2. **Memory Retrieval**
   - Fetching a memory by ID
   - Verifying all required fields are present

3. **Memory Updates**
   - Updating memory content
   - Automatic re-embedding of updated content
   - Metadata and importance score updates

4. **Memory Search**
   - Semantic search using vector similarity
   - Filtering by memory type and organization
   - Result ranking by relevance

5. **Memory Deletion**
   - Removing memories
   - Verifying deletion

## Debugging

To enable debug logging, set the `DEBUG` environment variable:

```bash
DEBUG=* node run-tests.js
```

## Troubleshooting

- **Missing environment variables**: Ensure all required variables are set in your `.env` file
- **Authentication errors**: Verify your Supabase credentials and organization ID
- **Embedding generation failures**: Check your OpenAI API key and quota

## License

This project is part of the Fresh AI CRM and is licensed under the terms of the MIT license.
