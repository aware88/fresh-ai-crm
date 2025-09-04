// Test script for email learning with GPT-4o-mini
require('dotenv').config();

// Mock the imports needed by EmailLearningService
const OpenAI = require('openai');
const { createClient } = require('@supabase/supabase-js');

// Mock the ModelRouterService
class ModelRouterService {
  async analyzeTaskComplexity() {
    return { 
      suggestedModel: 'gpt-4o-mini', 
      reasoning: ['Using GPT-4o-mini for cost-effective learning']
    };
  }
}

// Create a simplified version of the EmailLearningService for testing
class EmailLearningTester {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  async testPatternExtraction(email) {
    console.log('Extracting patterns using GPT-4o-mini...');
    
    const prompt = `EMAIL PATTERN EXTRACTION

Extract key communication patterns from this email to learn the user's style.

EMAIL:
Subject: ${email.subject}
From: ${email.sender}
To: ${email.recipient || 'N/A'}
Content: ${email.content.substring(0, 1500)}${email.content.length > 1500 ? '...' : ''}
Type: ${email.is_sent ? 'SENT by user' : 'RECEIVED by user'}

${email.is_sent ? `
ANALYZE SENT EMAIL:
1. Writing style (tone, formality, structure)
2. Response patterns (how user answers questions, handles requests)
3. Opening/closing styles
4. Key phrases and expressions
` : `
ANALYZE RECEIVED EMAIL:
1. Question types and request patterns
2. Sender relationship indicators
3. Context and urgency markers
4. Industry terminology
`}

REQUIRED OUTPUT FORMAT (JSON ARRAY):
[
  {
    "pattern_type": "question_response|greeting_style|closing_style",
    "context_category": "customer_inquiry|technical_support|general",
    "language": "en|sl", 
    "trigger_keywords": ["keyword1", "keyword2"],
    "trigger_phrases": ["phrase1", "phrase2"],
    "response_template": "Template response with [placeholders]",
    "confidence_score": 0.8,
    "metadata": {
      "writing_style": "concise|detailed",
      "formality": "formal|casual",
      "relationship_context": "customer|vendor|internal"
    }
  }
]

INSTRUCTIONS:
- Extract 3-7 clear patterns
- Focus on patterns that appear in the email
- Include only essential metadata
- Ensure valid JSON format
- Prioritize quality over quantity`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini', // Using GPT-4o-mini for cost-effective analysis
      messages: [
        {
          role: 'system',
          content: 'You are an email pattern analyzer. Extract clear, specific communication patterns from emails that can be used to generate responses. Return only valid JSON with no additional text or explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 1000
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return [];
    }

    // Parse JSON response
    let patterns = [];
    try {
      // Extract JSON from response (handle potential markdown formatting)
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        patterns = JSON.parse(jsonMatch[0]);
      } else {
        patterns = JSON.parse(content);
      }
      
      // Log token usage and cost
      const tokensUsed = response.usage?.total_tokens || 0;
      const costPer1k = 0.00015; // GPT-4o-mini cost per 1K tokens
      const cost = (tokensUsed / 1000) * costPer1k;
      
      console.log(`Token usage: ${tokensUsed} tokens`);
      console.log(`Estimated cost: $${cost.toFixed(6)}`);
      
      return patterns;
    } catch (parseError) {
      console.log('Could not parse pattern extraction response as JSON');
      console.log('Response content:', content.substring(0, 500));
      return [];
    }
  }
}

async function testEmailLearning() {
  console.log('Testing email learning with GPT-4o-mini...');
  
  const tester = new EmailLearningTester();
  
  // Test email content
  const testEmail = {
    subject: 'Meeting Request for Project Discussion',
    sender: 'client@example.com',
    recipient: 'user@company.com',
    content: `Dear Team,

I hope this email finds you well. I'm reaching out to schedule a meeting to discuss the progress of our ongoing project. We have some concerns about the timeline and would like to review the milestones.

Could we arrange a video call sometime next week, preferably on Tuesday or Wednesday afternoon? Please let me know your availability.

Additionally, I'd like to discuss the budget adjustments we talked about during our last meeting. I've prepared some figures that I believe will help us stay within our constraints while still achieving our objectives.

Looking forward to your response.

Best regards,
John Smith
Project Manager
Client Company Inc.`,
    is_sent: false,
    date: new Date().toISOString()
  };
  
  try {
    console.log('Extracting patterns from email...');
    console.time('patternExtraction');
    
    const patterns = await tester.testPatternExtraction(testEmail);
    
    console.timeEnd('patternExtraction');
    console.log(`Extracted ${patterns.length} patterns`);
    
    // Display the patterns
    console.log('\nExtracted Patterns:');
    patterns.forEach((pattern, index) => {
      console.log(`\nPattern ${index + 1}:`);
      console.log(`- Type: ${pattern.pattern_type}`);
      console.log(`- Category: ${pattern.context_category}`);
      console.log(`- Confidence: ${pattern.confidence_score}`);
      console.log(`- Keywords: ${pattern.trigger_keywords.join(', ')}`);
      console.log(`- Template: ${pattern.response_template.substring(0, 100)}...`);
    });
    
    console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('Error during test:', error);
  }
}

testEmailLearning();