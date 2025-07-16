/**
 * OpenAI API Client Module
 * 
 * This module provides a singleton OpenAI client and utility functions for interacting with
 * OpenAI's API, including content analysis for emails and URLs.
 * 
 * @module lib/openai/client
 */

import OpenAI from 'openai';
import { getLimitedFormattedDataForPrompt, getAllFormattedDataForPrompt } from '../personality/flexible-data';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Singleton instance of the OpenAI client
let openAIClient: OpenAI | null = null;

/**
 * Gets or creates a singleton instance of the OpenAI client
 * @returns {OpenAI} Configured OpenAI client instance
 * @throws {Error} If OPENAI_API_KEY is not set in environment variables
 */
export const getOpenAIClient = (): OpenAI => {
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    
    // Validate API key format
    if (!apiKey.startsWith('sk-') || apiKey.length < 20) {
      throw new Error('Invalid OPENAI_API_KEY format. API key should start with "sk-" and be properly formatted.');
    }
    
    openAIClient = new OpenAI({
      apiKey,
      // Add any default configuration here
    });
  }
  
  return openAIClient;
};

/**
 * Loads user identity information from environment variables
 * @returns {Object|null} User identity object or null if not available
 * @private
 */
const loadUserIdentity = (): Record<string, unknown> | null => {
  try {
    // In a production environment, this would typically fetch from a secure source
    // like a database or API endpoint. For now, we use environment variables.
    if (typeof window === 'undefined' && process.env.USER_IDENTITY) {
      return JSON.parse(process.env.USER_IDENTITY);
    }
    
    return null;
  } catch (error) {
    console.error('Error loading user identity:', error);
    return null;
  }
};

// Function to fetch and extract content from a URL
export const fetchUrlContent = async (url: string): Promise<string> => {
  try {
    // Validate URL format
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    // Use a more comprehensive set of headers to mimic a real browser
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Ch-Ua': '"Not A(Brand";v="99", "Google Chrome";v="120", "Chromium";v="120"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Platform': '"macOS"',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'Upgrade-Insecure-Requests': '1'
    };
    
    // Try to fetch the URL with a more realistic browser signature
    const response = await axios.get(url, {
      headers,
      timeout: 15000, // Increased timeout to 15 seconds
      maxRedirects: 5
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove script and style elements
    $('script, style, meta, link, noscript').remove();
    
    // Get page title
    const title = $('title').text().trim();
    
    // Get meta description
    const description = $('meta[name="description"]').attr('content') || '';
    
    // For LinkedIn profiles, try to extract specific information
    let content = '';
    
    if (url.includes('linkedin.com')) {
      // LinkedIn specific extraction
      content += 'LinkedIn Profile\n';
      content += `Title: ${title}\n\n`;
      
      // Try to extract profile information
      const name = $('.pv-top-card--list .text-heading-xlarge').text().trim();
      const headline = $('.pv-top-card--list .text-body-medium').text().trim();
      const location = $('.pv-top-card--list .text-body-small:contains("Location")').text().trim();
      
      if (name) content += `Name: ${name}\n`;
      if (headline) content += `Headline: ${headline}\n`;
      if (location) content += `Location: ${location}\n\n`;
      
      // Experience
      content += 'Experience:\n';
      $('.experience-section .pv-entity__summary-info').each((i, el) => {
        const role = $(el).find('h3').text().trim();
        const company = $(el).find('.pv-entity__secondary-title').text().trim();
        content += `- ${role} at ${company}\n`;
      });
      
      content += '\n';
    } else {
      // General website extraction
      content += `Website: ${title}\n`;
      content += `Description: ${description}\n\n`;
      
      // Extract main content text
      $('h1, h2, h3, h4, h5, p, li').each((i, el) => {
        const text = $(el).text().trim();
        if (text.length > 0) {
          content += text + '\n';
        }
      });
    }
    
    // Truncate content if it's too long (to avoid token limits)
    if (content.length > 4000) {
      content = content.substring(0, 4000) + '\n[Content truncated due to length...]';
    }
    
    return content;
  } catch (error) {
    console.error('Error fetching URL content:', error);
    
    // Provide a fallback with mock content for demo purposes
    // This allows the feature to be demonstrated even when sites block scraping
    if (url.includes('linkedin.com')) {
      console.log('Using fallback content for LinkedIn profile');
      return generateMockLinkedInContent(url);
    } else {
      console.log('Using fallback content for website');
      return generateMockWebsiteContent(url);
    }
  }
};

// Generate mock content for LinkedIn profiles when scraping fails
const generateMockLinkedInContent = (url: string): string => {
  const profileId = url.split('/in/')[1]?.split('/')[0] || 'profile';
  
  return `LinkedIn Profile (Demo Content - Actual scraping was blocked)
` +
    `Title: ${profileId}'s Professional Profile

` +
    `Name: ${profileId.charAt(0).toUpperCase() + profileId.slice(1).replace(/[\-\_\.]/g, ' ')} (Demo)
` +
    `Headline: Technology Professional | Innovation Leader | Strategic Thinker
` +
    `Location: San Francisco Bay Area

` +
    `Experience:
` +
    `- Senior Product Manager at Tech Innovations Inc.
` +
    `- Project Lead at Digital Solutions Group
` +
    `- Software Developer at Code Experts

` +
    `Education:
` +
    `- MBA, Business Administration
` +
    `- BS, Computer Science

` +
    `Skills:
` +
    `- Leadership
` +
    `- Product Strategy
` +
    `- Team Management
` +
    `- Technical Architecture

` +
    `Note: This is simulated content as the actual profile could not be accessed due to LinkedIn's security measures. For accurate analysis, consider using LinkedIn's official API or manually copying profile content.`;
};

// Generate mock content for websites when scraping fails
const generateMockWebsiteContent = (url: string): string => {
  // Extract domain for personalization
  const domain = url.replace(/^https?:\/\//, '').split('/')[0];
  
  return `Website: ${domain} (Demo Content - Actual scraping was blocked)
` +
    `Description: Professional website for ${domain}

` +
    `About Us:
` +
    `${domain} is a leading provider of innovative solutions in its industry. With a focus on quality and customer satisfaction, we strive to deliver exceptional products and services.

` +
    `Our Services:
` +
    `- Professional Consulting
` +
    `- Custom Solutions
` +
    `- Technical Support
` +
    `- Training and Development

` +
    `Our Team:
` +
    `Our team consists of experienced professionals dedicated to excellence in every aspect of our work.

` +
    `Contact Information:
` +
    `Email: info@${domain}
` +
    `Phone: (555) 123-4567

` +
    `Note: This is simulated content as the actual website could not be accessed. For accurate analysis, consider using the site's official API if available or manually copying relevant content.`;
};

export const analyzeUrl = async (url: string) => {
  try {
    const openai = getOpenAIClient();
    
    // Get limited personality profile data to avoid token limit
    const personalityData = getLimitedFormattedDataForPrompt(3); // Limit to 3 profiles per source
    
    // Load user identity information
    const userIdentity = loadUserIdentity();
    const userIdentityPrompt = userIdentity ? `

You are assisting ${userIdentity.name} who works at ${userIdentity.company}. Their email is ${userIdentity.email}. When analyzing email threads, focus only on the customer's communication style, not ${userIdentity.name}'s style.` : '';
    
    // Company context is no longer available in this version
    const companyContext = '';
    
    // Fetch content from the URL - this will return either real content or fallback content
    // The fetchUrlContent function now handles errors internally and provides fallback content
    const urlContent = await fetchUrlContent(url).catch(error => {
      console.log('Using fallback content due to error:', error.message);
      return url.includes('linkedin.com') ? 
        generateMockLinkedInContent(url) : 
        generateMockWebsiteContent(url);
    });
    
    // Truncate URL content if it's too long
    const truncatedUrlContent = urlContent.length > 3000 ? 
      urlContent.substring(0, 3000) + '\n[Content truncated due to length...]' : 
      urlContent;
    
    // Create the prompt for OpenAI
    const prompt = `You are a senior AI personality analyst and business intelligence assistant. Your role is to analyze content from a provided URL and uncover the **psychological profile, communication style, and persuasion strategy** for the person or company behind the page.

Your insights are used by professionals in:
- B2B sales and outreach
- Account-based marketing
- Talent acquisition and hiring
- Supplier management and sourcing
- Strategic partnerships and networking

---

### 🔍 BEFORE YOU BEGIN

You MUST first review all profiles from these sources:

1. **Primary Knowledgebase** – \`ai_profiler\` table (from CSV or Excel)  
   Each profile includes:  
   - Personality_Type, Tone_Preference  
   - Sales_Strategy, Framework, Messaging_Do/Don't  
   - Emotional_Trigger, Cognitive_Bias, Lead_Score, Conversion_Likelihood  

2. **Secondary Reference Data** – \`test_profiles\` (e.g., fake/generated profiles for fallback logic)

3. **Contextual Insight** – anything scraped from the URL, including:
   - Website structure, tone, headlines, layout
   - About us, product language, case studies, careers page
   - Any bio, founder quote, mission/vision/values${userIdentityPrompt}

---

### 🧠 YOUR TASK

Use behavioral language analysis, psychology, and communication theory to:

1. Analyze the language, tone, and messaging on the URL
2. Detect underlying personality traits and values
3. Match the content to the closest profile(s) from the available datasets
4. Generate a strategic communication recommendation and outreach message

⚠️ If multiple profiles are relevant, combine them logically and explain how.
⚠️ If no high-confidence match is found, fall back to generalized tone-based strategies.

Here are the personality profiles to reference:

${personalityData}

${companyContext ? `COMPANY CONTEXT INFORMATION:
${companyContext}

IMPORTANT: Use this company information to personalize your analysis and response, ensuring they align with the company's values, products/services, and target audience.
` : ''}

---

### 📋 OUTPUT STRUCTURE

**🔎 Profile Match**  
- Closest match(es): [e.g. "Visionary – ai_profiler" or "Strategist – test_profiles"]  
- Source: \`ai_profiler\`, \`test_profiles\`, or both  
- Confidence: High / Medium / Low  
- Why this profile matches the content (tone, structure, value emphasis, etc.)

**📊 Profile Analysis**  
- Summary of the person/company's psychological orientation  
- Detected traits: e.g. assertive, cautious, visionary, skeptical, relationship-driven...  
- Primary values: growth, safety, credibility, impact, speed, control, creativity, etc.  
- Communication style: e.g. storytelling, factual, minimalistic, people-first, etc.  
- Likely pain points or objections (based on detected values and site gaps)

**📈 Communication Strategy**  
- Best initial outreach tone (friendly, confident, informal, data-backed...)  
- What to emphasize (based on 'Messaging_Do' and 'Emotional_Triggers')  
- What to avoid (based on 'Messaging_Dont' and 'Cognitive_Biases')  
- Best contact channel and call-to-action style  
- Suggested email subject line (based on their tone & values)

**✉️ Suggested Outreach Message**  
A 100% natural, human-sounding email you would send as a first touch.  
Include:
- Personalization based on content
- Relevance to values or stated priorities
- Alignment with profile communication style
- Optional CTA (not pushy unless the profile prefers it)

**📘 Notes on Alignment**  
- How this message reflects their psychological profile  
- How you used \`ai_profiler\` or \`test_profiles\` data  
- Any insight into decision-maker hierarchy (if inferred)

---

⚠️ CRITICAL RULES

- Do NOT copy profile data word-for-word.  
- Write like a human — your job is to make the user's outreach easier, not robotic.  
- Always ensure your suggestions are tactful, strategic, and emotionally intelligent.

URL CONTENT TO ANALYZE:
${truncatedUrlContent}`;
    
    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 2000,
    });

    // Format the response with Markdown
    const formattedResponse = completion.choices[0].message.content || 'No analysis generated.';
    return formattedResponse;
  } catch (error) {
    console.error('Error analyzing URL:', error);
    // Instead of throwing an error, provide a more helpful response
    return `# Analysis Error

I apologize, but I encountered an issue while analyzing the URL: ${url}

Error details: ${error instanceof Error ? error.message : 'Unknown error'}

## Troubleshooting Suggestions:

1. **Check the URL format** - Make sure the URL is correctly formatted and accessible
2. **Try a different URL** - Some websites have strong anti-scraping measures that prevent analysis
3. **Consider using a different approach** - For LinkedIn profiles, you might need to manually copy the profile content

If you continue to experience issues, please contact support.`;
  }
};

/**
 * Analyzes email content using OpenAI's GPT model
 * @param {string} emailContent - The email content to analyze
 * @returns {Promise<string>} Analysis result
 */
export const analyzeEmail = async (emailContent: string): Promise<string> => {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured. Returning mock analysis.');
      return JSON.stringify({
        analysis: {
          personality: {
            traits: ['Professional', 'Friendly'],
            communication_style: 'Direct and clear',
            tone: 'Positive'
          },
          context: {
            relationship_type: 'Business',
            urgency_level: 'Medium',
            topic_category: 'General Business'
          },
          insights: {
            key_points: ['Welcome message', 'Introduction to system'],
            sentiment: 'Positive',
            intent: 'Informational'
          },
          recommendations: {
            response_suggestions: [
              'Thank you for the warm welcome!',
              'I look forward to using the system.'
            ],
            next_steps: ['Explore the system features', 'Set up preferences']
          }
        },
        note: 'This is a mock analysis as OpenAI API key is not configured.'
      });
    }

    const openai = getOpenAIClient();
    
    const systemPrompt = `You are an expert email analyst for a CRM system. Analyze the provided email and return a JSON response with the following structure:

{
  "analysis": {
    "personality": {
      "traits": ["trait1", "trait2"],
      "communication_style": "description",
      "tone": "tone_description"
    },
    "context": {
      "relationship_type": "type",
      "urgency_level": "high/medium/low",
      "topic_category": "category"
    },
    "insights": {
      "key_points": ["point1", "point2"],
      "sentiment": "positive/neutral/negative",
      "intent": "intent_description"
    },
    "recommendations": {
      "response_suggestions": ["suggestion1", "suggestion2"],
      "next_steps": ["step1", "step2"]
    }
  }
}

⚠️ IMPORTANT: NEVER copy-paste profile fields. Use them as inspiration to write natural human language. Your goal is to **guide the user to reply smarter**, not to sound like an AI.`;
    
    // Limit email content length if it's too long
    const maxEmailLength = 1500;
    const truncatedEmail = emailContent.length > maxEmailLength 
      ? emailContent.substring(0, maxEmailLength) + '... [content truncated for length]'
      : emailContent;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: truncatedEmail
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
    });

    const rawResponse = response.choices[0].message.content || 'No response generated';
    
    // Try to extract JSON from the response
    try {
      // Look for JSON content between ```json and ``` or just try to parse the whole response
      let jsonContent = rawResponse;
      
      // If the response is wrapped in code blocks, extract the JSON
      const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      // Try to parse the JSON to validate it
      const parsed = JSON.parse(jsonContent);
      
      // Return the validated JSON string
      return JSON.stringify(parsed);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response as JSON:', parseError);
      console.error('Raw OpenAI response:', rawResponse);
      
      // Return a structured fallback response
      return JSON.stringify({
        analysis: {
          personality: {
            traits: ['Analysis completed'],
            communication_style: 'Professional',
            tone: 'Neutral'
          },
          context: {
            relationship_type: 'Business',
            urgency_level: 'Medium',
            topic_category: 'General'
          },
          insights: {
            key_points: ['Email processed successfully'],
            sentiment: 'Neutral',
            intent: 'Communication'
          },
          recommendations: {
            response_suggestions: ['Thank you for your email'],
            next_steps: ['Review and respond appropriately']
          }
        },
        note: 'OpenAI response could not be parsed as JSON. Using fallback analysis.',
        raw_response: rawResponse.substring(0, 500) // Include first 500 chars for debugging
      });
    }
  } catch (error: any) {
    console.error('Error analyzing email:', error);
    
    // Provide a helpful fallback response based on the error type
    if (error.status === 401) {
      console.error('OpenAI API key is invalid. Please check your API key configuration.');
      return JSON.stringify({
        analysis: {
          personality: {
            traits: ['Unable to analyze - API key issue'],
            communication_style: 'Unknown',
            tone: 'Unknown'
          },
          context: {
            relationship_type: 'Unknown',
            urgency_level: 'Unknown',
            topic_category: 'Unknown'
          },
          insights: {
            key_points: ['API key configuration error'],
            sentiment: 'Unknown',
            intent: 'Unknown'
          },
          recommendations: {
            response_suggestions: ['Please configure a valid OpenAI API key'],
            next_steps: ['Visit OpenAI dashboard to generate a new API key']
          }
        },
        error: 'OpenAI API key is invalid or expired. Please update your API key in the environment variables.'
      });
    }
    
    // Generic fallback for other errors
    return JSON.stringify({
      analysis: {
        personality: {
          traits: ['Analysis unavailable'],
          communication_style: 'Unknown',
          tone: 'Unknown'
        },
        context: {
          relationship_type: 'Unknown',
          urgency_level: 'Medium',
          topic_category: 'General'
        },
        insights: {
          key_points: ['Unable to analyze at this time'],
          sentiment: 'Unknown',
          intent: 'Unknown'
        },
        recommendations: {
          response_suggestions: ['Please try again later'],
          next_steps: ['Check system configuration']
        }
      },
      error: 'Failed to analyze email. Please try again later.'
    });
  }
};

/**
 * Analyzes email content for sales opportunities using OpenAI's GPT model
 * @param {string} emailContent - The email content to analyze for sales
 * @returns {Promise<string>} Sales analysis result
 */
export const analyzeSalesOpportunity = async (emailContent: string): Promise<string> => {
  try {
    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not configured. Returning mock sales analysis.');
      return JSON.stringify({
        analysis: {
          lead_qualification: {
            score: 7,
            level: 'Qualified',
            reasoning: 'Mock analysis - appears to be a business inquiry'
          },
          opportunity_assessment: {
            potential_value: 'Medium',
            timeline: 'Short-term',
            decision_maker: 'Likely',
            budget_indicators: ['None detected']
          },
          sales_insights: {
            pain_points: ['General business needs'],
            buying_signals: ['Interest in product/service'],
            objection_likelihood: 'Low'
          },
          recommendations: {
            next_actions: ['Schedule discovery call', 'Send product information'],
            approach: 'Consultative',
            urgency: 'Medium'
          }
        },
        note: 'This is a mock sales analysis as OpenAI API key is not configured.'
      });
    }

    const openai = getOpenAIClient();
    
    const systemPrompt = `You are an expert sales analyst for a CRM system. Analyze the provided email for sales opportunities and return a JSON response with the following structure:

{
  "analysis": {
    "lead_qualification": {
      "score": 1-10,
      "level": "Hot/Warm/Cold/Qualified/Unqualified",
      "reasoning": "explanation"
    },
    "opportunity_assessment": {
      "potential_value": "High/Medium/Low",
      "timeline": "Immediate/Short-term/Long-term",
      "decision_maker": "Likely/Possible/Unlikely",
      "budget_indicators": ["indicator1", "indicator2"]
    },
    "sales_insights": {
      "pain_points": ["pain1", "pain2"],
      "buying_signals": ["signal1", "signal2"],
      "objection_likelihood": "High/Medium/Low"
    },
    "recommendations": {
      "next_actions": ["action1", "action2"],
      "approach": "Consultative/Direct/Educational",
      "urgency": "High/Medium/Low"
    }
  }
}

Focus on identifying sales opportunities, qualifying leads, and providing actionable sales recommendations.`;
    
    // Limit email content length if it's too long
    const maxEmailLength = 1500;
    const truncatedEmail = emailContent.length > maxEmailLength 
      ? emailContent.substring(0, maxEmailLength) + '... [content truncated for length]'
      : emailContent;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: truncatedEmail
        }
      ],
      temperature: 0.7,
      max_tokens: 1500,
      top_p: 1,
    });

    const rawResponse = response.choices[0].message.content || 'No response generated';
    
    // Try to extract JSON from the response
    try {
      // Look for JSON content between ```json and ``` or just try to parse the whole response
      let jsonContent = rawResponse;
      
      // If the response is wrapped in code blocks, extract the JSON
      const jsonMatch = rawResponse.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }
      
      // Try to parse the JSON to validate it
      const parsed = JSON.parse(jsonContent);
      
      // Return the validated JSON string
      return JSON.stringify(parsed);
    } catch (parseError) {
      console.error('Failed to parse OpenAI sales response as JSON:', parseError);
      console.error('Raw OpenAI sales response:', rawResponse);
      
      // Return a structured fallback response
      return JSON.stringify({
        analysis: {
          lead_qualification: {
            score: 5,
            level: 'Qualified',
            reasoning: 'Analysis completed'
          },
          opportunity_assessment: {
            potential_value: 'Medium',
            timeline: 'Short-term',
            decision_maker: 'Possible',
            budget_indicators: ['Standard inquiry']
          },
          sales_insights: {
            pain_points: ['Business needs identified'],
            buying_signals: ['Interest expressed'],
            objection_likelihood: 'Medium'
          },
          recommendations: {
            next_actions: ['Follow up with prospect'],
            approach: 'Consultative',
            urgency: 'Medium'
          }
        },
        note: 'OpenAI response could not be parsed as JSON. Using fallback sales analysis.',
        raw_response: rawResponse.substring(0, 500) // Include first 500 chars for debugging
      });
    }
  } catch (error: any) {
    console.error('Error analyzing sales opportunity:', error);
    
    // Provide a helpful fallback response based on the error type
    if (error.status === 401) {
      console.error('OpenAI API key is invalid. Please check your API key configuration.');
      return JSON.stringify({
        analysis: {
          lead_qualification: {
            score: 0,
            level: 'Unable to analyze - API key issue',
            reasoning: 'OpenAI API key is invalid or expired'
          },
          opportunity_assessment: {
            potential_value: 'Unknown',
            timeline: 'Unknown',
            decision_maker: 'Unknown',
            budget_indicators: ['API key configuration error']
          },
          sales_insights: {
            pain_points: ['API key configuration error'],
            buying_signals: ['Unable to analyze'],
            objection_likelihood: 'Unknown'
          },
          recommendations: {
            next_actions: ['Configure valid OpenAI API key'],
            approach: 'Technical',
            urgency: 'High'
          }
        },
        error: 'OpenAI API key is invalid or expired. Please update your API key in the environment variables.'
      });
    }
    
    // Generic fallback for other errors
    return JSON.stringify({
      analysis: {
        lead_qualification: {
          score: 0,
          level: 'Analysis unavailable',
          reasoning: 'Technical error occurred'
        },
        opportunity_assessment: {
          potential_value: 'Unknown',
          timeline: 'Unknown',
          decision_maker: 'Unknown',
          budget_indicators: ['Technical error']
        },
        sales_insights: {
          pain_points: ['Unable to analyze at this time'],
          buying_signals: ['Technical error'],
          objection_likelihood: 'Unknown'
        },
        recommendations: {
          next_actions: ['Try again later', 'Check system configuration'],
          approach: 'Technical',
          urgency: 'Medium'
        }
      },
      error: 'Failed to analyze sales opportunity. Please try again later.'
    });
  }
};
