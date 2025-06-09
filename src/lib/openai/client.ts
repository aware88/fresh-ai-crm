import OpenAI from 'openai';
import { getLimitedFormattedDataForPrompt } from '../personality/flexible-data';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';

let openAIClient: OpenAI | null = null;

export const getOpenAIClient = () => {
  // Create a singleton instance
  if (!openAIClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('Missing OpenAI API key');
    }
    
    openAIClient = new OpenAI({
      apiKey,
    });
  }
  
  return openAIClient;
};

// We now use the flexible data handler from flexible-data.ts

// Function to load user identity if available
const loadUserIdentity = () => {
  try {
    const userIdentityPath = path.join(process.cwd(), 'src/data/user_identity.json');
    
    if (fs.existsSync(userIdentityPath)) {
      const fileContent = fs.readFileSync(userIdentityPath, 'utf8');
      return JSON.parse(fileContent);
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
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
      timeout: 10000, // 10 seconds timeout
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
    throw new Error(`Failed to fetch content from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeUrl = async (url: string) => {
  try {
    const openai = getOpenAIClient();
    
    // Get limited personality profile data to avoid token limit
    const personalityData = getLimitedFormattedDataForPrompt(3); // Limit to 3 profiles per source
    
    // Load user identity information
    const userIdentity = loadUserIdentity();
    const userIdentityPrompt = userIdentity ? `\n\nThe person analyzing this URL is ${userIdentity.name} from ${userIdentity.company}.` : '';
    
    // Fetch content from the URL
    const urlContent = await fetchUrlContent(url);
    
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
    throw new Error(`Failed to analyze URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const analyzeEmail = async (emailContent: string) => {
  try {
    const openai = getOpenAIClient();
    
    // Get limited personality profile data to avoid token limit
    // This now includes data from all sources (CSV, mock data, Excel sheets)
    const personalityData = getLimitedFormattedDataForPrompt(3); // Limit to 3 profiles per source
    
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
