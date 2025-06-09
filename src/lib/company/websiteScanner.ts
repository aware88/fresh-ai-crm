import { getOpenAIClient } from '../openai/client';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface CompanyInfo {
  name: string;
  description: string;
  industry: string;
  products: string[];
  services: string[];
  values: string[];
  targetAudience: string;
  uniqueSellingPoints: string[];
  competitors?: string[];
  foundedYear?: number;
  headquarters?: string;
  websiteUrl: string;
  lastScanned: Date;
}

/**
 * Scans a company website and extracts relevant information using AI
 */
export async function scanCompanyWebsite(url: string): Promise<CompanyInfo | null> {
  try {
    // Normalize URL
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    // Fetch website content
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-CRM-Bot/1.0)',
      },
      timeout: 10000, // 10 seconds timeout
    });

    // Parse HTML
    const $ = cheerio.load(response.data);

    // Extract text content from important elements
    const title = $('title').text().trim();
    const metaDescription = $('meta[name="description"]').attr('content') || '';
    
    // Extract main content text
    let mainContent = '';
    
    // Get text from main content areas
    $('main, article, section, .content, #content, .main, #main').each((_, element) => {
      mainContent += $(element).text().trim() + ' ';
    });
    
    // If no main content found, get text from body
    if (!mainContent) {
      $('body p, body h1, body h2, body h3, body h4, body h5, body h6, body li').each((_, element) => {
        mainContent += $(element).text().trim() + ' ';
      });
    }

    // Clean and truncate content
    mainContent = mainContent
      .replace(/\\s+/g, ' ')
      .replace(/\\n/g, ' ')
      .trim()
      .substring(0, 10000); // Limit to 10,000 characters

    // Combine extracted content
    const websiteContent = `
      Title: ${title}
      Meta Description: ${metaDescription}
      Main Content: ${mainContent}
    `;

    // Use OpenAI to analyze the website content
    const openai = getOpenAIClient();
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant specialized in extracting company information from website content.
          Analyze the provided website content and extract the following information about the company:
          - Company name
          - Brief description (1-2 sentences)
          - Industry/sector
          - Products (list)
          - Services (list)
          - Company values or mission
          - Target audience
          - Unique selling points
          - Competitors (if mentioned)
          - Founded year (if available)
          - Headquarters location (if available)
          
          Format your response as a valid JSON object with these fields. If information is not available, use null or empty arrays.`
        },
        {
          role: 'user',
          content: `Extract company information from this website content: ${websiteContent}`
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    });

    // Parse the response
    const analysisContent = analysis.choices[0].message.content;
    if (!analysisContent) {
      throw new Error('Empty response from OpenAI');
    }

    const companyInfo = JSON.parse(analysisContent) as Omit<CompanyInfo, 'websiteUrl' | 'lastScanned'>;

    // Add the URL and scan timestamp
    return {
      ...companyInfo,
      websiteUrl: url,
      lastScanned: new Date()
    };
  } catch (error) {
    console.error('Error scanning website:', error);
    return null;
  }
}

/**
 * Saves company information to the database/file system
 */
export async function saveCompanyInfo(companyInfo: CompanyInfo): Promise<boolean> {
  try {
    const fs = require('fs');
    const path = require('path');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'src', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Save to company-info.json
    const filePath = path.join(dataDir, 'company-info.json');
    fs.writeFileSync(filePath, JSON.stringify(companyInfo, null, 2));
    
    return true;
  } catch (error) {
    console.error('Error saving company info:', error);
    return false;
  }
}

/**
 * Gets the saved company information
 */
export function getCompanyInfo(): CompanyInfo | null {
  try {
    const fs = require('fs');
    const path = require('path');
    
    const filePath = path.join(process.cwd(), 'src', 'data', 'company-info.json');
    
    if (!fs.existsSync(filePath)) {
      return null;
    }
    
    const data = fs.readFileSync(filePath, 'utf8');
    const companyInfo = JSON.parse(data) as CompanyInfo;
    
    // Convert string date back to Date object
    companyInfo.lastScanned = new Date(companyInfo.lastScanned);
    
    return companyInfo;
  } catch (error) {
    console.error('Error getting company info:', error);
    return null;
  }
}

/**
 * Generates a prompt enhancement based on company information
 */
export function generateCompanyContextPrompt(companyInfo: CompanyInfo): string {
  if (!companyInfo) return '';
  
  const products = companyInfo.products?.length 
    ? `Products: ${companyInfo.products.join(', ')}` 
    : '';
    
  const services = companyInfo.services?.length 
    ? `Services: ${companyInfo.services.join(', ')}` 
    : '';
    
  const usp = companyInfo.uniqueSellingPoints?.length 
    ? `Unique selling points: ${companyInfo.uniqueSellingPoints.join(', ')}` 
    : '';
  
  return `
    Company Context:
    ${companyInfo.name} is a ${companyInfo.industry} company.
    ${companyInfo.description}
    ${products}
    ${services}
    ${usp}
    Target audience: ${companyInfo.targetAudience}
    Company values: ${companyInfo.values?.join(', ') || 'Not specified'}
  `.trim();
}
