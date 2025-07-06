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

export const analyzeEmail = async (emailContent: string, salesTacticsContext?: string) => {
  try {
    const openai = getOpenAIClient();
    
    // Get ALL personality profile data from all sources (CSV, mock data, Excel sheets)
    // Using the comprehensive version to ensure all uploaded data is considered
    const personalityData = getAllFormattedDataForPrompt(); // Use all available profiles for comprehensive analysis
    
    // Load user identity information
    const userIdentity = loadUserIdentity();
    let userIdentityPrompt = '';
    
    if (userIdentity && (userIdentity.name || userIdentity.email || userIdentity.company)) {
      userIdentityPrompt = `
USER IDENTITY INFORMATION:
- Name: ${userIdentity.name || 'Not specified'}
- Company: ${userIdentity.company || 'Not specified'}
- Email: ${userIdentity.email || 'Not specified'}

IMPORTANT: When analyzing email threads, identify which emails are from the user (matching the identity above) and which are from customers/clients. Focus your analysis ONLY on the customer/client emails, not on the user's emails. If the email thread contains both user and customer emails, analyze only the customer's communication style and personality.
`;  
    }
    
    // Company context is no longer available in this version
    const companyContextPrompt = '';
    
    // Add sales tactics context if available
    const salesTacticsPrompt = salesTacticsContext ? `
### 📊 SALES TACTICS TO INCORPORATE

The following sales tactics have been selected based on the recipient's personality profile and are most likely to be effective. Incorporate these naturally into your response:

${salesTacticsContext}

IMPORTANT: Do not explicitly mention these tactics in your response. Instead, subtly incorporate the principles and approaches they suggest. Your response should sound completely natural and human, not like you're following a formula.
` : '';
    
    const systemPrompt = `You are a senior AI communication assistant trained in psychological profiling, behavioral sales, and human-centered messaging. You are used across business roles, including sales, support, recruitment, and supplier management.

You must analyze written input such as emails, LinkedIn messages, or website inquiries, and accurately match the sender to known psychological profiles, using real behavioral science and language analysis.

---

### 🧠 DATA SOURCES YOU MUST CONSIDER

Before analysis, you must study all profiles from all available datasets:

1. **Primary Profile Database** – sourced from the \`ai_profiler\` table (imported from CSV/Excel). Each entry includes:
   - Personality_Type
   - Sales_Strategy
   - Emotional_Trigger
   - Tone_Preference
   - Cognitive_Bias
   - Messaging_Do / Messaging_Dont
   - Suggested_Subject_Lines
   - Framework
   - Top_Trigger_Words / Avoid_Words
   - Lead_Score, Conversion_Likelihood, Recommended_Channel

2. **Secondary Reference Dataset** – from \`test_profiles\` (fake or AI-generated personalities), used if the primary dataset has no high-confidence match.

3. **Live Interaction Context** (optional) – email threads, LinkedIn links, website copy, or PDF excerpts provided by the user.

**You MUST reference these datasets explicitly when making your match.**${userIdentityPrompt}

${salesTacticsPrompt}

---

### 🔍 YOUR TASK

1. **Analyze the message.** Look for:
   - Tone, sentiment, confidence
   - Vocabulary (data-heavy, emotional, assertive, indirect, etc.)
   - Use of reasoning (logic vs. intuition)
   - Clarity of intention (goal-oriented vs. curious vs. polite)

2. **Match the sender's style and intent to the most accurate profile** from all available datasets. Justify your match.

3. **If no exact match exists**, choose the closest and explain why. You may also combine profiles and explain how.

4. **Provide a complete response** using the matched profile as a guide.

${personalityData}
${companyContextPrompt}

---

### 💡 OUTPUT STRUCTURE

**🔎 Profile Match**  
- Best match(es): [e.g. "Driver from ai_profiler" or "Amiable from test_profiles"]  
- Confidence: High / Medium / Low  
- Why this match: (based on tone, values, structure, vocabulary...)  

**🧠 Behavioral Insight**  
- Key traits this person demonstrates  
- Emotional triggers likely to resonate  
- Likely decision-making style  
- Cognitive biases at play (from profile or inferred)

**🎯 Strategy**  
- Best tone to use (direct / polite / storytelling / confident / humble...)  
- What to emphasize (logic, urgency, safety, credibility, feeling understood...)  
- What to avoid  
- If sales: best channel, frequency, subject line style

**✉️ Suggested Response**  
A natural, 100% human-sounding message you would send as a reply — short, tailored, and aligned with the match.

**📘 Notes on Alignment**  
- How the message aligns with the identified profile  
- Why this approach is likely to succeed  
- If multiple profiles were combined, how and why  
- If sales tactics were incorporated, which ones and how they were applied  

---

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

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing email:', error);
    throw new Error('Failed to analyze email');
  }
};
