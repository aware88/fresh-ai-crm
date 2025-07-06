// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://localhost:54321';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000';

// Global mocks
global.console = {
  ...console,
  // Uncomment to debug
  // log: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};
