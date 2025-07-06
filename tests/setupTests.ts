import { TextEncoder, TextDecoder } from 'util';

// Add TextEncoder and TextDecoder to the global scope
// This is needed for some dependencies that expect these to be available in the global scope
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

// Mock the Supabase client
export const mockFrom = jest.fn().mockReturnThis();
export const mockSelect = jest.fn().mockReturnThis();
export const mockInsert = jest.fn().mockReturnThis();
export const mockUpdate = jest.fn().mockReturnThis();
export const mockDelete = jest.fn().mockReturnThis();
export const mockEq = jest.fn().mockReturnThis();
export const mockSingle = jest.fn().mockResolvedValue({ data: null, error: null });

jest.mock('../src/lib/supabaseClient', () => ({
  supabase: {
    from: mockFrom,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
    rpc: jest.fn().mockReturnThis(),
  },
  getSupabaseWithAuth: jest.fn().mockImplementation(() => ({
    from: mockFrom,
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    single: mockSingle,
  })),
  isSupabaseConfigured: jest.fn().mockReturnValue(true),
  getUserId: jest.fn().mockResolvedValue('test-user-123'),
  getUser: jest.fn().mockResolvedValue({ id: 'test-user-123', email: 'test@example.com' }),
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
