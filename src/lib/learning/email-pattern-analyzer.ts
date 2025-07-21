import OpenAI from 'openai';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface EmailPattern {
  patternType: 'greeting' | 'closing' | 'tone' | 'structure' | 'phrase' | 'transition';
  emailCategory: 'sales' | 'support' | 'dispute' | 'billing' | 'general';
  patternText: string;
  context: string;
  confidence: number;
  tags: string[];
}

export interface ToneAnalysis {
  primaryTone: string;
  secondaryTone?: string;
  formalityLevel: number; // 1-10
  enthusiasmLevel: number; // 1-10
  empathyLevel: number; // 1-10
  confidenceLevel: number; // 1-10
  characteristics: string[];
}

export interface StructureAnalysis {
  emailStructure: string;
  paragraphCount: number;
  avgSentenceLength: number;
  usesLists: boolean;
  includesCTA: boolean; // Call to action
  greetingStyle: string;
  closingStyle: string;
}

export interface WithcarEmailAnalysis {
  patterns: EmailPattern[];
  toneAnalysis: ToneAnalysis;
  structureAnalysis: StructureAnalysis;
  keyPhrases: string[];
  language: string;
}

/**
 * Analyze a Withcar email to extract patterns, tone, and structure
 */
export async function analyzeWithcarEmail(
  emailContent: string,
  emailType: string = 'customer_response'
): Promise<WithcarEmailAnalysis> {
  
  const systemPrompt = `You are an expert email pattern analyzer for Withcar, an Italian car accessories company. 
  
Your job is to analyze sent emails from Withcar and extract:
1. Reusable patterns (greetings, closings, phrases, transitions)
2. Tone characteristics (formal/informal, enthusiastic, empathetic)
3. Email structure (paragraphs, sentence patterns, organization)
4. Key phrases that represent the brand voice

Focus on identifying patterns that can be reused for similar customer interactions.

Return analysis in this exact JSON format:
{
  "patterns": [
    {
      "patternType": "greeting|closing|tone|structure|phrase|transition",
      "emailCategory": "sales|support|dispute|billing|general",
      "patternText": "exact text or description of pattern",
      "context": "when/where this pattern is typically used",
      "confidence": 0.8,
      "tags": ["polite", "professional", "withcar-style"]
    }
  ],
  "toneAnalysis": {
    "primaryTone": "professional|friendly|formal|casual|apologetic|enthusiastic",
    "secondaryTone": "helpful|empathetic|confident",
    "formalityLevel": 7,
    "enthusiasmLevel": 6,
    "empathyLevel": 8,
    "confidenceLevel": 7,
    "characteristics": ["clear", "helpful", "solution-focused"]
  },
  "structureAnalysis": {
    "emailStructure": "greeting-problem_acknowledgment-solution-closing",
    "paragraphCount": 4,
    "avgSentenceLength": 15,
    "usesLists": false,
    "includesCTA": true,
    "greetingStyle": "formal_with_name",
    "closingStyle": "professional_signature"
  },
  "keyPhrases": ["thank you for contacting", "we understand your concern", "best regards"],
  "language": "en|it|de"
}`;

  const userPrompt = `Analyze this Withcar email (type: ${emailType}):

EMAIL CONTENT:
${emailContent}

Extract patterns, analyze tone, and identify the structure. Focus on elements that represent Withcar's communication style that could be reused in similar situations.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 2000
    }, {
      timeout: 30000 // 30 second timeout
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No analysis result from AI');
    }

    const analysis = JSON.parse(result) as WithcarEmailAnalysis;
    return analysis;

  } catch (error) {
    console.error('Error analyzing Withcar email:', error);
    throw new Error('Failed to analyze email patterns');
  }
}

/**
 * Store email patterns in the database
 */
export async function storeEmailPatterns(
  userId: string,
  emailId: string,
  analysis: WithcarEmailAnalysis
): Promise<boolean> {
  try {
    const supabase = createServiceRoleClient();

    // Store individual patterns
    for (const pattern of analysis.patterns) {
      const { error } = await supabase
        .from('email_patterns')
        .insert({
          user_id: userId,
          pattern_type: pattern.patternType,
          email_category: pattern.emailCategory,
          pattern_text: pattern.patternText,
          context: pattern.context,
          confidence: pattern.confidence,
          frequency_count: 1,
          extracted_from_email_ids: [emailId],
          tags: pattern.tags,
          is_active: true
        });

      if (error) {
        console.error('Error storing pattern:', error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error storing email patterns:', error);
    return false;
  }
}

/**
 * Get learned patterns for a user and category (optional - gets all if not specified)
 */
export async function getLearnedPatterns(
  userId: string,
  category?: string,
  patternType?: string
): Promise<EmailPattern[]> {
  try {
    const supabase = createServiceRoleClient();
    
    let query = supabase
      .from('email_patterns')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('confidence', { ascending: false })
      .order('frequency_count', { ascending: false });

    // Only filter by category if specified
    if (category) {
      query = query.eq('email_category', category);
    }

    if (patternType) {
      query = query.eq('pattern_type', patternType);
    }

    const { data, error } = await query.limit(10);

    if (error) {
      console.error('Error fetching learned patterns:', error);
      return [];
    }

    return data.map(row => ({
      patternType: row.pattern_type,
      emailCategory: row.email_category,
      patternText: row.pattern_text,
      context: row.context,
      confidence: row.confidence,
      tags: row.tags || []
    }));

  } catch (error) {
    console.error('Error getting learned patterns:', error);
    return [];
  }
}

/**
 * Update pattern frequency when used
 */
export async function updatePatternUsage(
  userId: string,
  patternText: string,
  success: boolean
): Promise<void> {
  try {
    const supabase = createServiceRoleClient();

    const { error } = await supabase.rpc('increment_pattern_usage', {
      p_user_id: userId,
      p_pattern_text: patternText,
      p_success: success
    });

    if (error) {
      console.error('Error updating pattern usage:', error);
    }
  } catch (error) {
    console.error('Error updating pattern usage:', error);
  }
}

/**
 * Analyze multiple Withcar emails in batch
 */
export async function batchAnalyzeWithcarEmails(
  userId: string,
  emails: Array<{
    id: string;
    content: string;
    type: string;
    subject?: string;
    date?: string;
  }>
): Promise<{ processed: number; errors: number }> {
  let processed = 0;
  let errors = 0;

  const supabase = createServiceRoleClient();

  for (const email of emails) {
    try {
      // Store the raw email first
      const { data: sampleData, error: sampleError } = await supabase
        .from('withcar_email_samples')
        .insert({
          user_id: userId,
          original_subject: email.subject,
          email_body: email.content,
          email_type: email.type,
          processing_status: 'processing'
        })
        .select('id')
        .single();

      if (sampleError || !sampleData) {
        console.error('Error storing email sample:', sampleError);
        errors++;
        continue;
      }

      // Analyze the email
      const analysis = await analyzeWithcarEmail(email.content, email.type);

      // Store the analysis results
      const { error: updateError } = await supabase
        .from('withcar_email_samples')
        .update({
          extracted_patterns: analysis.patterns,
          tone_analysis: analysis.toneAnalysis,
          key_phrases: analysis.keyPhrases,
          structure_analysis: analysis.structureAnalysis,
          processing_status: 'completed',
          analysis_completed_at: new Date().toISOString()
        })
        .eq('id', sampleData.id);

      if (updateError) {
        console.error('Error updating analysis:', updateError);
      }

      // Store individual patterns
      await storeEmailPatterns(userId, sampleData.id, analysis);

      processed++;

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error processing email ${email.id}:`, error);
      errors++;
    }
  }

  return { processed, errors };
}

/**
 * Get user's learned email style summary
 */
export async function getUserEmailStyleSummary(userId: string): Promise<{
  totalPatterns: number;
  commonTones: string[];
  frequentPhrases: string[];
  preferredStructure: string;
  languageDistribution: Record<string, number>;
}> {
  try {
    const supabase = createServiceRoleClient();

    // Get pattern counts
    const { data: patterns, error } = await supabase
      .from('email_patterns')
      .select('pattern_type, pattern_text, confidence, frequency_count, tags')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error || !patterns) {
      return {
        totalPatterns: 0,
        commonTones: [],
        frequentPhrases: [],
        preferredStructure: 'standard',
        languageDistribution: { 'en': 1 }
      };
    }

    // Analyze the patterns
    const tonePatterns = patterns.filter(p => p.pattern_type === 'tone');
    const phrasePatterns = patterns.filter(p => p.pattern_type === 'phrase')
      .sort((a, b) => b.frequency_count - a.frequency_count)
      .slice(0, 5);

    const commonTones = tonePatterns.map(p => p.pattern_text);
    const frequentPhrases = phrasePatterns.map(p => p.pattern_text);

    return {
      totalPatterns: patterns.length,
      commonTones,
      frequentPhrases,
      preferredStructure: 'learned_from_samples',
      languageDistribution: { 'en': patterns.length }
    };

  } catch (error) {
    console.error('Error getting user email style summary:', error);
    return {
      totalPatterns: 0,
      commonTones: ['professional'],
      frequentPhrases: [],
      preferredStructure: 'standard',
      languageDistribution: { 'en': 1 }
    };
  }
} 