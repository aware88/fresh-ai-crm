import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to the global scope
// This is needed for some dependencies that expect these to be available in the global scope
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock fetch API
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(''),
}) as any;

// Create comprehensive Supabase mock
const createMockSupabaseChain = () => {
  const mockChain = {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    rpc: jest.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    }
  };
  
  // Make all methods return the chain for fluent API
  Object.keys(mockChain).forEach(key => {
    if (typeof mockChain[key] === 'function' && !['single', 'maybeSingle', 'rpc'].includes(key)) {
      mockChain[key].mockReturnValue(mockChain);
    }
  });
  
  return mockChain;
};

const mockSupabaseClient = createMockSupabaseChain();

// Mock all Supabase imports
jest.mock('../src/lib/supabaseClient', () => ({
  supabase: mockSupabaseClient,
  getSupabaseWithAuth: jest.fn().mockReturnValue(mockSupabaseClient),
  isSupabaseConfigured: jest.fn().mockReturnValue(true),
  getUserId: jest.fn().mockResolvedValue('test-user-123'),
  getUser: jest.fn().mockResolvedValue({ id: 'test-user-123', email: 'test@example.com' }),
}));

jest.mock('../src/lib/supabase/server', () => ({
  createServerClient: jest.fn().mockReturnValue(mockSupabaseClient),
  createClient: jest.fn().mockReturnValue(mockSupabaseClient),
}));

jest.mock('../src/lib/supabase/service-role', () => ({
  createServiceRoleClient: jest.fn().mockReturnValue(mockSupabaseClient),
}));

// Mock the core @supabase/supabase-js module to prevent direct instantiation
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockImplementation(() => mockSupabaseClient)
}));

// Mock OpenAI (both old and new APIs)
jest.mock('openai', () => {
  const mockOpenAI = {
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Mocked response' } }]
        })
      }
    },
    embeddings: {
      create: jest.fn().mockResolvedValue({
        data: [{ embedding: [0.1, 0.2, 0.3] }]
      })
    }
  };
  
  return {
    default: jest.fn().mockImplementation(() => mockOpenAI),
    Configuration: jest.fn().mockImplementation(() => ({})),
    OpenAIApi: jest.fn().mockImplementation(() => ({
      createChatCompletion: jest.fn().mockResolvedValue({
        data: {
          choices: [{ message: { content: 'Mocked response' } }]
        }
      }),
      createCompletion: jest.fn().mockResolvedValue({
        data: {
          choices: [{ text: 'Mocked completion' }]
        }
      })
    }))
  };
});

// Export mock functions for tests to use
export const mockFrom = mockSupabaseClient.from;
export const mockSelect = mockSupabaseClient.select;
export const mockInsert = mockSupabaseClient.insert;
export const mockUpdate = mockSupabaseClient.update;
export const mockDelete = mockSupabaseClient.delete;
export const mockEq = mockSupabaseClient.eq;
export const mockSingle = mockSupabaseClient.single;
export const mockRpc = mockSupabaseClient.rpc;
export { mockSupabaseClient };

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_SERVICE_KEY = 'test-service-key';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.OPENAI_API_KEY = 'test-openai-key';

// Mock console methods to keep test output clean
const originalConsole = { ...console };

beforeAll(() => {
  // Suppress console output during tests
  global.console = {
    ...originalConsole,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
});

afterAll(() => {
  // Restore original console methods
  global.console = originalConsole;
});

// Mock the fetch API with proper response object
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () => Promise.resolve(new Blob()),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic',
    url: 'https://example.com',
  } as Response)
) as jest.Mock;
