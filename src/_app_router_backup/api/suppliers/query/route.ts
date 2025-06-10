import { NextRequest, NextResponse } from 'next/server';
import { initializeSupplierData } from '@/lib/suppliers/init';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SupplierQuery, SupplierQueryResult, Supplier, SupplierDocument, SupplierEmail } from '@/types/supplier';
import { getOpenAIClient } from '@/lib/openai/client';

// Paths to data files
const suppliersPath = path.join(process.cwd(), 'src/data/suppliers.json');
const documentsPath = path.join(process.cwd(), 'src/data/supplier_documents.json');
const emailsPath = path.join(process.cwd(), 'src/data/supplier_emails.json');
const queriesPath = path.join(process.cwd(), 'src/data/supplier_queries.json');
const dataDir = path.join(process.cwd(), 'src/data');

// Helper function to load data
const loadData = () => {
  const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
  const suppliers: Supplier[] = JSON.parse(suppliersData);
  
  const documentsData = fs.readFileSync(documentsPath, 'utf8');
  const documents: SupplierDocument[] = JSON.parse(documentsData);
  
  const emailsData = fs.readFileSync(emailsPath, 'utf8');
  const emails: SupplierEmail[] = JSON.parse(emailsData);
  
  return { suppliers, documents, emails };
};

// Process a supplier query using AI
export async function POST(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const { query } = await request.json();
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }
    
    // Load all data
    const { suppliers, documents, emails } = loadData();
    
    // Create a context for the AI with relevant information
    let context = '';
    
    // Add supplier information
    context += '## Supplier Information\n\n';
    suppliers.forEach(supplier => {
      context += `- Supplier ID: ${supplier.id}\n`;
      context += `  Name: ${supplier.name}\n`;
      context += `  Email: ${supplier.email}\n`;
      context += `  Reliability Score: ${supplier.reliabilityScore || 'Not rated'}\n`;
      if (supplier.website) context += `  Website: ${supplier.website}\n`;
      if (supplier.notes) context += `  Notes: ${supplier.notes}\n`;
      context += '\n';
    });
    
    // Add document information
    context += '## Document Information\n\n';
    documents.forEach(doc => {
      const supplier = suppliers.find(s => s.id === doc.supplierId);
      context += `- Document ID: ${doc.id}\n`;
      context += `  File Name: ${doc.fileName}\n`;
      context += `  Document Type: ${doc.documentType}\n`;
      context += `  Supplier: ${supplier ? supplier.name : 'Unknown'} (ID: ${doc.supplierId})\n`;
      context += `  Upload Date: ${new Date(doc.uploadDate).toLocaleDateString()}\n`;
      context += '\n';
    });
    
    // Add email information
    context += '## Email Information\n\n';
    emails.forEach(email => {
      const supplier = suppliers.find(s => s.id === email.supplierId);
      context += `- Email ID: ${email.id}\n`;
      context += `  From: ${email.senderName} <${email.senderEmail}>\n`;
      context += `  Subject: ${email.subject}\n`;
      context += `  Date: ${new Date(email.receivedDate).toLocaleDateString()}\n`;
      context += `  Supplier: ${supplier ? supplier.name : 'Unknown'} (ID: ${email.supplierId || 'Not linked'})\n`;
      context += `  Product Tags: ${email.productTags.join(', ') || 'None'}\n`;
      context += `  Body Preview: ${email.body.substring(0, 100)}...\n`;
      context += '\n';
    });
    
    // Truncate context if it's too long
    if (context.length > 10000) {
      context = context.substring(0, 10000) + '\n[Content truncated due to length...]';
    }
    
    // Call OpenAI API
    const openai = getOpenAIClient();
    
    const prompt = `You are an AI sourcing assistant. The user is looking for ingredients or raw materials.
You have access to:
- PDF and Excel files from suppliers
- Past email conversations
- Supplier information

Your job is to:
- Identify suppliers who offer the requested product
- Check if price/quantity/spec is acceptable
- Rank the best options
- Show their email
- Suggest a short professional email I can send them, in English

If nothing matches perfectly, suggest a near match.

Here is the context information about suppliers, documents, and emails:

${context}

USER QUERY: ${query}

Please provide your response in the following format:

**🔍 Matching Suppliers:**
- List of suppliers who likely offer the product, ranked by relevance
- Include supplier name, email, and reliability score
- Note any specific documents or emails that mention this product

**📊 Product Analysis:**
- Best match for the requested product
- Price information if available
- Quantity/MOQ if available
- Quality specifications if available

**💡 Recommendation:**
- Your top recommendation with reasoning
- Any concerns or considerations

**✉️ Suggested Email Template:**
- A brief, professional email template for contacting the supplier
- Personalized to the specific product request
- Clear and concise language

Remember to only include suppliers that are likely to offer the requested product based on the available information.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'gpt-4-turbo',
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0].message.content || 'No results found.';
    
    // Extract supplier results from AI response
    const results: SupplierQueryResult[] = [];
    
    // Simple extraction of supplier mentions
    suppliers.forEach(supplier => {
      if (aiResponse.includes(supplier.name) || aiResponse.includes(supplier.email)) {
        // Calculate a simple match score based on mentions
        const nameMatches = (aiResponse.match(new RegExp(supplier.name, 'gi')) || []).length;
        const emailMatches = (aiResponse.match(new RegExp(supplier.email, 'gi')) || []).length;
        const matchScore = Math.min(100, (nameMatches + emailMatches) * 20);
        
        // Find document references
        const documentReferences = documents
          .filter(doc => doc.supplierId === supplier.id)
          .map(doc => doc.id);
          
        // Find email references
        const emailReferences = emails
          .filter(email => email.supplierId === supplier.id)
          .map(email => email.id);
        
        // Extract suggested email if present
        const emailTemplateMatch = aiResponse.match(/\*\*✉️ Suggested Email Template:\*\*([\s\S]*?)(?=\*\*|$)/);
        const suggestedEmail = emailTemplateMatch ? emailTemplateMatch[1].trim() : undefined;
        
        // Extract product match if present
        const productMatch = query;
        
        const supplierResult: SupplierQueryResult = {
          id: uuidv4(),
          supplierId: supplier.id,
          supplier: supplier,
          relevanceScore: matchScore,
          productMatch: productMatch,
          documentReferences: documentReferences,
          emailReferences: emailReferences,
          suggestedEmail: suggestedEmail
        };
        
        results.push(supplierResult);
      }
    });
    
    // Sort results by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Save query to history
    const queriesData = fs.readFileSync(queriesPath, 'utf8');
    const queries: SupplierQuery[] = JSON.parse(queriesData);
    
    const newQuery: SupplierQuery = {
      id: uuidv4(),
      query,
      results,
      timestamp: new Date().toISOString(),
      aiResponse
    };
    
    queries.push(newQuery);
    fs.writeFileSync(queriesPath, JSON.stringify(queries, null, 2));
    
    return NextResponse.json({
      queryId: newQuery.id,
      results,
      aiResponse
    });
  } catch (error) {
    console.error('Error processing supplier query:', error);
    return NextResponse.json(
      { error: 'Failed to process query', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Get query history
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const queryId = searchParams.get('id');
    
    await initializeSupplierData();
    const queriesData = fs.readFileSync(queriesPath, 'utf8');
    const queries: SupplierQuery[] = JSON.parse(queriesData);
    
    if (queryId) {
      // Return a specific query by ID
      const query = queries.find(q => q.id === queryId);
      if (!query) {
        return NextResponse.json(
          { error: 'Query not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(query);
    } else {
      // Return all queries, sorted by timestamp (newest first)
      const sortedQueries = [...queries].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      return NextResponse.json(sortedQueries);
    }
  } catch (error) {
    console.error('Error fetching query history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    );
  }
}
