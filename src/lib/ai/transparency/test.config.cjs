/**
 * Test configuration for AI Transparency System tests
 */

module.exports = {
  // Default environment variables for tests
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co',
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key',
  openaiApiKey: process.env.OPENAI_API_KEY || 'test-key',
  organizationId: process.env.ORGANIZATION_ID || '123e4567-e89b-12d3-a456-426614174000',
  
  // Test data
  testAgentId: '123e4567-e89b-12d3-a456-426614174001',
  testActivityId: '123e4567-e89b-12d3-a456-426614174002',
  testContactId: '123e4567-e89b-12d3-a456-426614174003',
  testUserId: '123e4567-e89b-12d3-a456-426614174004',
  testMemoryId: '123e4567-e89b-12d3-a456-426614174005',
  
  // Test settings
  defaultSettings: {
    activity_logging_enabled: true,
    thought_logging_enabled: true,
    memory_access_level: 'full',
    personality_tone: 'professional',
    assertiveness_level: 50,
    empathy_level: 70,
    response_detail_level: 'balanced'
  }
};
