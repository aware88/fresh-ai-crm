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
    const prompt = `You are a professional personality analyst and communication expert specializing in helping businesses understand their prospects and customers. Your task is to analyze the content from a URL and provide insights about the person or company behind it.

IMPORTANT: Before analyzing the content, you MUST follow these steps:

1. CAREFULLY REVIEW ALL personality profiles provided below. These include data from CSV files and Excel sheets (if available).
2. For each profile in ALL datasets, note the key traits, communication preferences, and recommended approaches.
3. ONLY AFTER reviewing all profiles from all datasets, proceed to analyze the URL content.${userIdentityPrompt}

Your job is to:

1. Analyze the content from the provided URL.
2. Match the content's style, messaging, and company/personal traits to the most relevant profile(s) from ANY of the available datasets.
3. Determine the psychological profile by comparing the URL content to ALL available profile datasets, considering:
   - Tone and language patterns
   - Values and priorities
   - Personality traits
   - Communication preferences
4. Provide specific recommendations for effective communication with this person/company based on the matched profile(s).

Here are the personality profiles to reference:

${personalityData}

${companyContext ? `COMPANY CONTEXT INFORMATION:
${companyContext}

IMPORTANT: Use this company information to personalize your analysis and response, ensuring they align with the company's values, products/services, and target audience.
` : ''}

CRITICAL: You MUST explicitly reference which profile(s) from which dataset(s) you're using for your analysis. Clearly indicate the source dataset (e.g., CSV profiles, Excel sheet name, etc.). If no profile matches well, explain why and provide a general approach.

---

URL CONTENT TO ANALYZE:
${truncatedUrlContent}

---

Please provide your analysis in the following format:

**🔍 Profile Match:**  
- Which profile(s) from which dataset(s) best match the URL content and why (specify the exact source)
- Confidence level in the match (High/Medium/Low)
- Key traits and communication preferences from the matched profile(s)

**📊 Analysis:**
- Summary of the person/company based on the URL content
- Key personality traits identified
- Communication style and preferences
- Values and priorities
- Potential pain points or challenges

**💡 Communication Strategy:**
- Recommended approach for initial outreach
- Messaging do's and don'ts
- Topics likely to resonate
- Potential objections and how to address them

**✉️ Suggested Email Template:**
- A brief, personalized email template for reaching out to this person/company
- How the template aligns with the profile's preferences
- Any adjustments made for tone or style
- Why this approach should be effective
- If using multiple profiles from different datasets, explain how you've combined insights from all sources

Always ensure your response is natural, empathetic, and tailored to the specific profile's communication style.`;
    
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

export const analyzeEmail = async (emailContent: string) => {
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
    let companyContextPrompt = '';
    
    const systemPrompt = `You are an advanced AI sales assistant specializing in psychological profiling based on written communication, such as emails or LinkedIn messages.

IMPORTANT: Before analyzing the message, you MUST follow these steps:

1. CAREFULLY REVIEW ALL personality profiles provided below. These include data from CSV files and Excel sheets (if available).
2. For each profile in ALL datasets, note the key traits, communication preferences, and recommended approaches.
3. ONLY AFTER reviewing all profiles from all datasets, proceed to analyze the message.${userIdentityPrompt}

Your job is to:

1. Analyze the message provided by the user.
2. Match the sender's communication style and traits to the most relevant profile(s) from ANY of the available datasets.
3. Determine the sender's psychological profile by comparing their message to ALL available profile datasets, considering:
   - Tone and language patterns
   - Values and priorities
   - Personality traits
   - Emotional vs. rational indicators
   - Decision-making style
   - Communication preferences
4. Based on the matched profile(s), provide:
   - The optimal communication/sales approach (e.g., logical, emotional, friendly, data-driven, storytelling, direct, etc.)
   - Specific elements to emphasize based on the profile's 'Messaging_Do' and 'Best_For' fields
   - What to avoid based on the profile's 'Messaging_Dont' and 'Common_Biases' fields
5. Write a personalized draft response that aligns with the identified profile's preferences.

${personalityData}
${companyContextPrompt}

CRITICAL: You MUST explicitly reference which profile(s) from which dataset(s) you're using for your analysis. Clearly indicate the source dataset (e.g., CSV profiles, Excel sheet name, etc.). If no profile matches well, explain why and provide a general approach.

---

Your output must always follow this structure:

**🔍 Profile Match:**  
- Which profile(s) from which dataset(s) best match the sender and why (specify the exact source)
- Confidence level in the match (High/Medium/Low)
- Key traits and communication preferences from the matched profile(s)

**🧠 Psychological Analysis:**  
(A detailed analysis of the sender's tone, mindset, and how it aligns with the matched profile(s))

**🎯 Recommended Approach:**  
(Specific communication strategies based on the profile's 'Sales_Strategy' and 'Framework' fields)
- What to emphasize: [specific elements from the profile]
- What to avoid: [specific elements from the profile]
- Suggested frameworks/methods: [from the profile's 'Framework' field]

**✉️ Suggested Response:**  
(A personalized response that demonstrates understanding of the profile's preferences)

**📝 Notes on Profile Alignment:**  
- How the response aligns with the profile's preferences
- Any adjustments made for tone or style
- Why this approach should be effective
- If using multiple profiles from different datasets, explain how you've combined insights from all sources

Always ensure your response is natural, empathetic, and tailored to the specific profile's communication style.`;
    
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
