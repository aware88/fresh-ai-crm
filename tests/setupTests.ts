import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to the global scope
// This is needed for some dependencies that expect these to be available in the global scope
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock the Supabase client
jest.mock('@/lib/supabase/client', () => ({
  createClient: jest.fn().mockImplementation(() => ({
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
    data: [],
    error: null,
  })),
}));

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

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

// Mock the fetch API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;
