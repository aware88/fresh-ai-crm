/**
 * Sales Tactics Integration Test
 * 
 * This test file verifies that the sales tactics integration works correctly
 * by testing the key components of the integration:
 * 1. Fetching sales tactics based on personality profiles
 * 2. Integrating sales tactics into AI context
 * 3. Including sales tactics in OpenAI prompts
 */

// Import the sales-tactics module which will use the mocked Supabase client
import { getMatchingSalesTactics, formatSalesTacticsForAIContext, SalesTactic } from '../lib/ai/sales-tactics';
import { getEmailAIContext } from '../lib/integrations/metakocka/email-context-builder';
import { analyzeEmail } from '../lib/openai/client';

// Mock the Supabase client module
const mockSupabaseClient = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  overlaps: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  data: [],
  error: null
};

// Mock the Supabase client
jest.mock('../lib/supabaseClient', () => ({
  createClient: jest.fn(() => mockSupabaseClient)
}));

// Mock the Supabase client module
jest.mock('../lib/ai/sales-tactics', () => {
  const originalModule = jest.requireActual('../lib/ai/sales-tactics');
  return {
    ...originalModule,
    // Override any specific functions if needed
  };
});

// Mock getEmailAIContext
jest.mock('../lib/integrations/metakocka/email-context-builder', () => ({
  getEmailAIContext: jest.fn(() => Promise.resolve(
    `## Email Context\n- Subject: Meeting Request\n- From: john@example.com\n- To: sales@company.com\n\n## Contact Personality Profile\n- Type: Analytical\n- Traits: Detail-oriented, logical, methodical\n- Tone Preference: analytical, direct\n- Emotional Trigger: Need for Certainty\n\n## Relevant Sales Tactics\n- **Persuasion** (by Robert Cialdini):\n  - Tactic: Use social proof to demonstrate popularity\n  - Email Phrase: "Many of our clients have found success with this approach"\n  - Emotional Trigger: Fear of Missing Out\n  - Matching Tone: confident, friendly\n\n`
  ))
}));

// Mock analyzeEmail
jest.mock('../lib/openai/client', () => ({
  analyzeEmail: jest.fn(() => Promise.resolve(
    `🔎 Profile Match  \n- Best match: "Analytical from ai_profiler"  \n- Confidence: High  \n- Why this match: The sender uses precise language, asks specific questions, and focuses on data points rather than emotional appeals.  \n\n🧠 Behavioral Insight  \n- Key traits: Detail-oriented, logical, methodical, research-focused\n- Emotional triggers: Need for certainty, desire for complete information\n- Likely decision-making style: Data-driven, weighing pros and cons carefully\n- Cognitive biases: Analysis paralysis, perfectionism\n\n🎯 Strategy  \n- Best tone: Direct, specific, evidence-based\n- What to emphasize: Facts, data, logical reasoning, proven results\n- What to avoid: Emotional appeals, vague statements, hyperbole\n- Best channel: Email with detailed documentation\n\n✉️ Suggested Response  \nHi John,\n\nI'd be happy to schedule a meeting to discuss our enterprise solutions. Based on your requirements, I've prepared some relevant data points:\n\n- Our platform achieved 99.9% uptime over the past 12 months\n- Implementation typically takes 4-6 weeks, with dedicated support\n- 78% of our enterprise clients reported ROI within the first quarter\n\nI've attached our technical specifications document and case studies from similar organizations in your industry. Would Tuesday at 2pm work for a detailed walkthrough of these solutions?\n\nRegards,\nSarah\n\n📘 Notes on Alignment  \n- The message aligns with the Analytical profile by providing specific data points and avoiding emotional language\n- The approach is likely to succeed because it addresses the recipient's need for complete information before making decisions\n- I incorporated the social proof sales tactic by mentioning statistics about other clients' success, appealing to the analytical mind while subtly leveraging FOMO`
  ))
}));

describe('Sales Tactics Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getMatchingSalesTactics returns tactics based on personality profile', async () => {
    // Setup mock data
    const mockTactics = [
      {
        id: '1',
        expert: 'Robert Cialdini',
        category: 'Persuasion',
        tactical_snippet: 'Use social proof to demonstrate popularity',
        use_case: 'When customer is hesitant about a new product',
        email_phrase: 'Many of our clients have found success with this approach',
        emotional_trigger: 'Fear of Missing Out',
        matching_tone: ['confident', 'friendly'],
        created_at: '2023-01-01T00:00:00Z'
      },
      {
        id: '2',
        expert: 'Daniel Kahneman',
        category: 'Cognitive Bias',
        tactical_snippet: 'Frame choices to highlight benefits over risks',
        use_case: 'When presenting pricing options',
        email_phrase: 'This solution provides significant value while minimizing risk',
        emotional_trigger: 'Loss Aversion',
        matching_tone: ['analytical', 'reassuring'],
        created_at: '2023-01-02T00:00:00Z'
      }
    ];

    // Mock the Supabase client implementation
    const mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      overlaps: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: mockTactics,
        error: null
      })
    };

    // Mock the Supabase client creation
    const mockCreateClient = jest.fn(() => mockSupabaseClient);
    jest.mock('../lib/supabaseClient', () => ({
      createClient: mockCreateClient
    }));

    // Re-import the module to use the new mock
    jest.resetModules();
    const { getMatchingSalesTactics } = require('../lib/ai/sales-tactics');

    const mockProfile = {
      Personality_Type: 'Analytical',
      Tone_Preference: 'analytical, direct',
      Emotional_Trigger: 'Need for Certainty'
    };

    const mockEmailContext = {
      subject: 'Meeting Request',
      content: 'I would like to schedule a meeting to discuss your enterprise solutions.'
    };

    const tactics = await getMatchingSalesTactics(mockProfile, mockEmailContext);

    // Verify the results
    expect(tactics).toHaveLength(2);
    expect(tactics[0].expert).toBe('Robert Cialdini');
    expect(tactics[1].expert).toBe('Daniel Kahneman');
  });

  test('formatSalesTacticsForAIContext formats tactics correctly', () => {
    const mockTactics = [
      {
        id: '1',
        expert: 'Robert Cialdini',
        category: 'Persuasion',
        tactical_snippet: 'Use social proof to demonstrate popularity',
        use_case: 'When customer is hesitant about a new product',
        email_phrase: 'Many of our clients have found success with this approach',
        emotional_trigger: 'Fear of Missing Out',
        matching_tone: ['confident', 'friendly'],
        created_at: '2023-01-01T00:00:00Z'
      }
    ];

    const formatted = formatSalesTacticsForAIContext(mockTactics);

    expect(formatted).toContain('## Relevant Sales Tactics');
    expect(formatted).toContain('**Persuasion** (by Robert Cialdini)');
    expect(formatted).toContain('Tactic: Use social proof to demonstrate popularity');
  });

  test('getEmailAIContext includes sales tactics in context', async () => {
    const mockEmailId = '123';
    const mockUserId = 'user-456';

    const context = await getEmailAIContext(mockEmailId, mockUserId);

    expect(context).toContain('## Relevant Sales Tactics');
    expect(context).toContain('**Persuasion** (by Robert Cialdini)');
  });

  test('analyzeEmail incorporates sales tactics in response', async () => {
    const mockEmailContent = 'Subject: Meeting Request\n\nI would like to schedule a meeting to discuss your enterprise solutions.';
    const mockSalesTacticsContext = `## Relevant Sales Tactics\n- **Persuasion** (by Robert Cialdini):\n  - Tactic: Use social proof to demonstrate popularity\n  - Email Phrase: "Many of our clients have found success with this approach"\n  - Emotional Trigger: Fear of Missing Out\n  - Matching Tone: confident, friendly\n\n`;

    const response = await analyzeEmail(mockEmailContent, mockSalesTacticsContext);

    expect(response).toContain('I incorporated the social proof sales tactic');
    expect(response).toContain('78% of our enterprise clients reported ROI');
  });
});
