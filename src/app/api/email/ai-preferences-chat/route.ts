import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { createClient } from '@/lib/supabase/server';
import { getOpenAIClient } from '@/lib/openai/client';
import { aiPreferencesService } from '@/lib/ai/ai-preferences-service';
import { v4 as uuidv4 } from 'uuid';

interface EmailPreferenceSuggestion {
  type: 'email_filter' | 'response_rule' | 'exclusion_rule' | 'content_rule' | 'style_preference';
  name: string;
  description: string;
  rule: any;
  preview?: string;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { message, conversationHistory } = await request.json();
    
    const openai = getOpenAIClient();
    const supabase = createClient();

    // Get user's current preferences for context
    const currentPrefs = await aiPreferencesService.getUserPreferences(session.user.id);

    // Check if user is asking about their current settings
    if (isCurrentSettingsQuery(message)) {
      const settingsResponse = formatCurrentSettingsResponse(currentPrefs);
      return NextResponse.json({
        response: settingsResponse,
        preferences: [],
        applied: false,
        messageId: uuidv4(),
        isSettingsQuery: true
      });
    }

    // Build system prompt for AI
    const systemPrompt = buildEmailPreferencesSystemPrompt(currentPrefs);
    
    // Process with OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        ...conversationHistory.map((msg: any) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content
        })).slice(-8), // Keep last 8 messages for context
        { role: "user", content: message }
      ],
      functions: [
        {
          name: "create_email_preferences",
          description: "Create or update email preferences based on user request",
          parameters: {
            type: "object",
            properties: {
              email_filters: {
                type: "array",
                description: "Email filtering rules to determine which emails to process",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Human readable name for the filter" },
                    condition: { type: "string", description: "Condition to match emails against" },
                    action: { 
                      type: "string", 
                      enum: ["skip_ai_processing", "flag_for_manual_review", "high_priority", "low_priority"],
                      description: "Action to take when condition matches"
                    },
                    description: { type: "string", description: "User-friendly description of what this filter does" }
                  },
                  required: ["name", "condition", "action", "description"]
                }
              },
              response_rules: {
                type: "array",
                description: "Rules defining how AI should behave in different scenarios",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Human readable name for the rule" },
                    trigger: { type: "string", description: "Condition that triggers this rule" },
                    behavior: { type: "string", description: "How AI should behave when triggered" },
                    custom_instructions: { type: "string", description: "Custom instructions for AI" },
                    escalate_to_human: { type: "boolean", description: "Whether to escalate to human review" },
                    description: { type: "string", description: "User-friendly description" }
                  },
                  required: ["name", "trigger", "behavior", "description"]
                }
              },
              exclusion_rules: {
                type: "array",
                description: "Rules for emails that should be excluded from AI processing",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Human readable name" },
                    condition: { type: "string", description: "Condition to match emails" },
                    action: { 
                      type: "string",
                      enum: ["skip_ai_processing", "flag_for_manual_review"],
                      description: "Action to take for excluded emails"
                    },
                    reason: { type: "string", description: "Reason for exclusion" }
                  },
                  required: ["name", "condition", "action", "reason"]
                }
              },
              content_rules: {
                type: "array",
                description: "Rules for customizing email response content",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string", description: "Human readable name" },
                    trigger: { type: "string", description: "When to apply this rule" },
                    action: { type: "string", description: "What content action to take" },
                    template_additions: { type: "string", description: "Additional content to include" }
                  },
                  required: ["name", "trigger", "action"]
                }
              },
              style_preferences: {
                type: "object",
                description: "Overall style preferences for AI responses",
                properties: {
                  response_style: { 
                    type: "string", 
                    enum: ["professional", "friendly", "formal", "casual", "technical"] 
                  },
                  response_tone: { 
                    type: "string", 
                    enum: ["helpful", "direct", "empathetic", "enthusiastic", "cautious"] 
                  },
                  response_length: { 
                    type: "string", 
                    enum: ["brief", "optimal", "detailed", "comprehensive"] 
                  }
                }
              },
              global_instructions: {
                type: "string",
                description: "Global instructions that apply to all AI interactions"
              }
            }
          }
        }
      ],
      function_call: "auto",
      temperature: 0.7,
      max_tokens: 1500
    });

    const aiMessage = response.choices[0].message;
    let preferences: EmailPreferenceSuggestion[] = [];
    let applied = false;
    let responseText = aiMessage.content || '';

    // Handle function calls
    if (aiMessage.function_call?.name === 'create_email_preferences') {
      try {
        const functionArgs = JSON.parse(aiMessage.function_call.arguments);
        preferences = parsePreferencesToSuggestions(functionArgs);
        
        // Auto-apply simple, safe preferences
        if (shouldAutoApply(functionArgs)) {
          const success = await applyPreferences(session.user.id, functionArgs, currentPrefs);
          applied = success;
          
          if (success) {
            responseText = `I've applied those settings for you! Here's what I configured:\n\n${preferences.map(p => `• ${p.description}`).join('\n')}\n\nYour email AI will now follow these preferences. You can always ask me to modify or add more rules.`;
          } else {
            responseText = `I've prepared those settings for you to review. Please check the suggestions below and apply them if they look correct.`;
          }
        } else {
          responseText = `I've prepared some email preference settings based on your request. Please review them below and let me know if you'd like me to apply them or make any changes.`;
        }
      } catch (error) {
        console.error('Error parsing function arguments:', error);
        responseText = "I understand your request, but I had trouble creating the specific rules. Could you try rephrasing what you'd like me to configure?";
      }
    }

    // If no function was called, provide helpful response
    if (!responseText) {
      responseText = generateDefaultResponse(message, preferences);
    }

    return NextResponse.json({
      response: responseText,
      preferences,
      applied,
      messageId: uuidv4()
    });

  } catch (error) {
    console.error('AI preferences chat error:', error);
    return NextResponse.json(
      { 
        response: 'I apologize, but I encountered an issue processing your request. Please try again in a moment, or contact support if this problem continues.',
        preferences: [],
        applied: false,
        messageId: uuidv4(),
        error: 'processing_error'
      },
      { status: 200 } // Return 200 so frontend gets the user-friendly message
    );
  }
}

function buildEmailPreferencesSystemPrompt(currentPrefs: any) {
  return `You are a SPECIALIZED AI assistant EXCLUSIVELY for configuring email preferences. You ONLY help with email preference settings and REFUSE all other requests.

STRICT SCOPE LIMITATIONS:
- ONLY discuss email preferences, filters, rules, and AI email behavior
- REFUSE to answer general questions, provide code help, explain other topics, or act like ChatGPT
- If asked about ANYTHING else, respond: "I'm specialized only in email preferences. Please use the main chat or contact support for other questions."

Your ONLY role is to:
1. Understand user requests for EMAIL HANDLING preferences
2. Convert natural language into structured email rules using the create_email_preferences function
3. Suggest email-specific configurations based on their needs
4. Explain what each EMAIL setting will do in plain language
5. SHOW CURRENT SETTINGS when users ask what they have configured

CURRENT USER PREFERENCES: ${currentPrefs ? JSON.stringify(currentPrefs, null, 2) : 'No preferences set yet'}

EMAIL PREFERENCE TYPES YOU CAN CREATE AND SHOW:

EMAIL FILTERS:
- Skip AI processing for certain emails (promotional, spam, etc.)
- Flag emails for manual review (competitor emails, sensitive topics)
- Set priority levels (urgent keywords, VIP senders)

RESPONSE RULES:
- Behavioral changes based on email type or content
- Custom instructions for specific scenarios
- Escalation triggers for human review

EXCLUSION RULES:
- Completely exclude certain emails from AI (legal, HR, personal)
- Domain-based exclusions (competitors, internal systems)

CONTENT RULES:
- Include specific information (pricing, availability, contact details)
- Customize responses based on email type
- Add template text for certain scenarios

STYLE PREFERENCES:
- Overall tone and style (professional, friendly, formal, casual, technical)
- Response length preferences
- Communication approach

HANDLING CURRENT SETTINGS REQUESTS:
When users ask about their current settings (e.g., "What are my current preferences?", "Show me my settings", "What do I have configured?"), provide a clear, user-friendly summary of their current configuration WITHOUT using the create_email_preferences function. Instead, directly explain what they have set up in plain language.

Examples of conditions you can create:
- subject_contains(['urgent', 'ASAP', 'emergency'])
- sender_domain_in(['competitor.com', 'rival.co'])
- email_type = 'product_inquiry'
- subject_contains_any(['promotional', 'sale', 'discount', 'offer'])

When users make requests:
1. Ask clarifying questions if needed
2. Use the create_email_preferences function to structure their requirements (ONLY for new/changed settings)
3. Explain what each rule will do
4. Suggest related settings they might want
5. For current settings queries, provide a friendly summary without function calls

Always be conversational, helpful, and make sure users understand what their settings will do.

REMEMBER: You are STRICTLY LIMITED to email preferences only. Refuse any requests outside this scope immediately.`;
}

function isEmailPreferencesRelated(message: string): boolean {
  const emailKeywords = [
    'email', 'emails', 'inbox', 'message', 'messages', 'response', 'respond', 'reply', 'replies',
    'filter', 'filters', 'rule', 'rules', 'preference', 'preferences', 'setting', 'settings',
    'promotional', 'marketing', 'spam', 'urgent', 'priority', 'sender', 'subject', 'content',
    'ai response', 'automatic', 'processing', 'analysis', 'tone', 'style', 'professional', 'friendly',
    'exclude', 'include', 'skip', 'escalate', 'manual review', 'customer', 'support', 'sales',
    'competitor', 'domain', 'address', 'notification', 'alert'
  ];

  const unrelatedKeywords = [
    'weather', 'recipe', 'joke', 'story', 'news', 'sports', 'game', 'movie', 'music', 
    'travel', 'restaurant', 'shopping', 'code', 'programming', 'javascript', 'python',
    'math', 'calculation', 'translate', 'definition', 'meaning', 'history', 'science',
    'health', 'medical', 'advice', 'recommendation', 'suggest', 'book', 'article'
  ];

  const lowerMessage = message.toLowerCase();
  
  // Check for unrelated content first
  const hasUnrelatedContent = unrelatedKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );
  
  if (hasUnrelatedContent) {
    return false;
  }

  // Check for email-related content
  const hasEmailContent = emailKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  );

  // If no email keywords found but also no unrelated keywords, 
  // allow it through (might be context-dependent)
  return hasEmailContent || lowerMessage.length < 50; // Short messages might be contextual
}

function isCurrentSettingsQuery(message: string): boolean {
  const settingsQueries = [
    'current settings', 'current preferences', 'my settings', 'my preferences',
    'what do i have', 'what are my', 'show me my', 'what settings', 'what preferences',
    'what rules', 'what filters', 'what style', 'configured', 'set up', 'saved'
  ];
  
  const lowerMessage = message.toLowerCase();
  return settingsQueries.some(query => lowerMessage.includes(query));
}

function formatCurrentSettingsResponse(preferences: any): string {
  if (!preferences || !preferences.ai_enabled) {
    return `You don't have any AI email preferences set up yet! 

Here's what you can configure:
• Email filtering rules (skip promotional emails, flag urgent ones, etc.)
• Response style and tone (professional, friendly, casual)
• Content rules (include pricing info, add disclaimers, etc.)
• Escalation rules (route complaints to manual review)

Just tell me what you'd like to set up, like:
"Don't process promotional emails automatically" or "Use a friendly tone for customer emails"`;
  }

  let response = "Here are your current AI email preferences:\n\n";

  // Overall status
  response += `🤖 **AI Processing**: ${preferences.ai_enabled ? 'Enabled' : 'Disabled'}\n`;
  
  // Style preferences
  if (preferences.response_style || preferences.response_tone || preferences.response_length) {
    response += `\n📝 **Response Style**:\n`;
    if (preferences.response_style) {
      response += `• Style: ${preferences.response_style.charAt(0).toUpperCase() + preferences.response_style.slice(1)}\n`;
    }
    if (preferences.response_tone) {
      response += `• Tone: ${preferences.response_tone.charAt(0).toUpperCase() + preferences.response_tone.slice(1)}\n`;
    }
    if (preferences.response_length) {
      response += `• Length: ${preferences.response_length.charAt(0).toUpperCase() + preferences.response_length.slice(1)}\n`;
    }
  }

  // Email filters
  const activeFilters = preferences.email_filters?.filter((f: any) => f.active) || [];
  if (activeFilters.length > 0) {
    response += `\n📧 **Email Filters** (${activeFilters.length} active):\n`;
    activeFilters.forEach((filter: any) => {
      response += `• ${filter.name}: ${filter.description}\n`;
    });
  }

  // Response rules
  const activeRules = preferences.response_rules?.filter((r: any) => r.active) || [];
  if (activeRules.length > 0) {
    response += `\n⚙️ **Response Rules** (${activeRules.length} active):\n`;
    activeRules.forEach((rule: any) => {
      response += `• ${rule.name}: ${rule.description}\n`;
    });
  }

  // Exclusion rules
  const activeExclusions = preferences.exclusion_rules?.filter((r: any) => r.active) || [];
  if (activeExclusions.length > 0) {
    response += `\n🚫 **Exclusion Rules** (${activeExclusions.length} active):\n`;
    activeExclusions.forEach((rule: any) => {
      response += `• ${rule.name}: ${rule.reason}\n`;
    });
  }

  // Content rules
  const activeContentRules = preferences.content_rules?.filter((r: any) => r.active) || [];
  if (activeContentRules.length > 0) {
    response += `\n📄 **Content Rules** (${activeContentRules.length} active):\n`;
    activeContentRules.forEach((rule: any) => {
      response += `• ${rule.name}: ${rule.action}\n`;
    });
  }

  // Global instructions
  if (preferences.global_ai_instructions) {
    response += `\n🌐 **Global Instructions**: ${preferences.global_ai_instructions}\n`;
  }

  response += `\nYou can modify any of these settings by telling me what you'd like to change! For example:
"Change my tone to casual" or "Add a rule to skip newsletter emails"`;

  return response;
}

function parsePreferencesToSuggestions(functionArgs: any): EmailPreferenceSuggestion[] {
  const suggestions: EmailPreferenceSuggestion[] = [];
  
  if (functionArgs.email_filters) {
    functionArgs.email_filters.forEach((filter: any) => {
      // Generate user-friendly preview instead of technical conditions
      let previewText = '';
      if (filter.action === 'skip_ai_processing') {
        previewText = `AI won't automatically respond to these emails`;
      } else if (filter.action === 'flag_for_manual_review') {
        previewText = `These emails will be flagged for your review`;
      } else if (filter.action === 'high_priority') {
        previewText = `These emails will be marked as high priority`;
      } else if (filter.action === 'low_priority') {
        previewText = `These emails will be marked as low priority`;
      }

      suggestions.push({
        type: 'email_filter',
        name: filter.name,
        description: filter.description,
        rule: {
          id: uuidv4(),
          ...filter,
          active: true
        },
        preview: previewText
      });
    });
  }
  
  if (functionArgs.response_rules) {
    functionArgs.response_rules.forEach((rule: any) => {
      // Generate user-friendly preview for response rules
      let previewText = `AI will adjust its response behavior for these emails`;
      if (rule.escalate_to_human) {
        previewText = `These emails will be escalated to you for manual handling`;
      }

      suggestions.push({
        type: 'response_rule',
        name: rule.name,
        description: rule.description,
        rule: {
          id: uuidv4(),
          ...rule,
          active: true
        },
        preview: previewText
      });
    });
  }

  if (functionArgs.exclusion_rules) {
    functionArgs.exclusion_rules.forEach((rule: any) => {
      let previewText = '';
      if (rule.action === 'skip_ai_processing') {
        previewText = `These emails will be completely excluded from AI processing`;
      } else if (rule.action === 'flag_for_manual_review') {
        previewText = `These emails will be flagged for your manual review`;
      }

      suggestions.push({
        type: 'exclusion_rule',
        name: rule.name,
        description: `Exclude emails: ${rule.reason}`,
        rule: {
          id: uuidv4(),
          name: rule.name,
          condition: rule.condition,
          action: rule.action,
          reason: rule.reason,
          active: true
        },
        preview: previewText
      });
    });
  }

  if (functionArgs.content_rules) {
    functionArgs.content_rules.forEach((rule: any) => {
      suggestions.push({
        type: 'content_rule',
        name: rule.name,
        description: `Content customization: ${rule.action}`,
        rule: {
          id: uuidv4(),
          ...rule,
          active: true
        },
        preview: `AI will customize response content based on your preferences`
      });
    });
  }

  if (functionArgs.style_preferences) {
    suggestions.push({
      type: 'style_preference',
      name: 'Communication Style',
      description: `Set response style to ${functionArgs.style_preferences.response_style || 'professional'} with ${functionArgs.style_preferences.response_tone || 'helpful'} tone`,
      rule: functionArgs.style_preferences,
      preview: `AI will use ${functionArgs.style_preferences.response_style || 'professional'} style and ${functionArgs.style_preferences.response_tone || 'helpful'} tone`
    });
  }

  return suggestions;
}

async function applyPreferences(userId: string, preferences: any, currentPrefs: any): Promise<boolean> {
  try {
    // Build the preferences object to save
    const prefsToSave: any = {};

    if (preferences.email_filters) {
      const existingFilters = currentPrefs?.email_filters || [];
      prefsToSave.email_filters = [
        ...existingFilters,
        ...preferences.email_filters.map((f: any) => ({
          id: uuidv4(),
          ...f,
          active: true
        }))
      ];
    }

    if (preferences.response_rules) {
      const existingRules = currentPrefs?.response_rules || [];
      prefsToSave.response_rules = [
        ...existingRules,
        ...preferences.response_rules.map((r: any) => ({
          id: uuidv4(),
          ...r,
          active: true
        }))
      ];
    }

    if (preferences.exclusion_rules) {
      const existingExclusions = currentPrefs?.exclusion_rules || [];
      prefsToSave.exclusion_rules = [
        ...existingExclusions,
        ...preferences.exclusion_rules.map((r: any) => ({
          id: uuidv4(),
          ...r,
          active: true
        }))
      ];
    }

    if (preferences.content_rules) {
      const existingContent = currentPrefs?.content_rules || [];
      prefsToSave.content_rules = [
        ...existingContent,
        ...preferences.content_rules.map((r: any) => ({
          id: uuidv4(),
          ...r,
          active: true
        }))
      ];
    }

    if (preferences.style_preferences) {
      prefsToSave.response_style = preferences.style_preferences.response_style;
      prefsToSave.response_tone = preferences.style_preferences.response_tone;
      prefsToSave.response_length = preferences.style_preferences.response_length;
    }

    if (preferences.global_instructions) {
      prefsToSave.global_ai_instructions = preferences.global_instructions;
    }

    // Save to database
    const success = await aiPreferencesService.savePreferencesFromChat(
      userId, 
      prefsToSave,
      'Settings applied via AI chat'
    );

    return success;
  } catch (error) {
    console.error('Error applying preferences:', error);
    return false;
  }
}

function shouldAutoApply(preferences: any): boolean {
  // Auto-apply simple, non-destructive preferences
  const hasFilters = preferences.email_filters?.length > 0;
  const hasComplexRules = preferences.response_rules?.some((r: any) => r.escalate_to_human);
  const hasExclusions = preferences.exclusion_rules?.length > 0;
  
  // Only auto-apply if:
  // 1. Few rules (not overwhelming)
  // 2. No complex escalation rules
  // 3. No exclusions (which could be disruptive)
  const totalRules = (preferences.email_filters?.length || 0) + 
                    (preferences.response_rules?.length || 0) + 
                    (preferences.exclusion_rules?.length || 0);

  return totalRules <= 2 && !hasComplexRules && !hasExclusions;
}

function generateDefaultResponse(message: string, preferences: any[]): string {
  if (preferences.length === 0) {
    // Try to understand what they want and ask clarifying questions
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('promotional') || lowerMessage.includes('marketing')) {
      return "I can help you handle promotional emails! Would you like me to:\n\n• Skip AI processing for promotional emails entirely?\n• Flag them for manual review?\n• Process them with a specific template?\n\nJust let me know what you prefer!";
    }
    
    if (lowerMessage.includes('urgent') || lowerMessage.includes('priority')) {
      return "I can set up urgency handling for you! Would you like me to:\n\n• Mark emails with urgent keywords as high priority?\n• Escalate urgent emails to human review?\n• Set up faster processing for urgent emails?\n\nWhat specific urgent keywords should I watch for?";
    }

    if (lowerMessage.includes('competitor') || lowerMessage.includes('exclude')) {
      return "I can help exclude certain emails from AI processing. Could you tell me:\n\n• Which domains or senders should be excluded?\n• Should they be flagged for manual review or skipped entirely?\n• Are there specific keywords that indicate sensitive emails?\n\nThis helps ensure sensitive communications get proper human attention.";
    }

    if (lowerMessage.includes('tone') || lowerMessage.includes('style')) {
      return "I can customize the AI's communication style! Would you like:\n\n• Professional and formal tone?\n• Friendly and conversational approach?\n• Technical and detailed responses?\n• Brief and to-the-point communication?\n\nWhat style best matches your business needs?";
    }

    return "I understand you want to configure something, but could you be more specific? For example:\n\n• 'Don't process promotional emails with AI'\n• 'Use friendly tone for customer emails'\n• 'Mark urgent emails as high priority'\n• 'Exclude competitor emails from processing'\n\nWhat aspect of email handling would you like me to set up?";
  }
  
  return `I've prepared ${preferences.length} email preference${preferences.length > 1 ? 's' : ''} based on your request. Please review the suggestions below and let me know if you'd like me to apply them or make any changes.`;
} 