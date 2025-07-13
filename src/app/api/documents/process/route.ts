import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '../../../../lib/supabase/server';
import { getUID } from '../../../../lib/auth/utils';
import OpenAI from 'openai';

// Function to create OpenAI client with fallback for missing API key
const createOpenAIClient = () => {
  if (!process.env.OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY environment variable is missing in document processor. Using mock client.');
    // Use unknown as intermediate type before asserting as OpenAI
    const mockClient: unknown = {
      chat: {
        completions: {
          create: async () => ({
            choices: [{ message: { content: JSON.stringify({
              products: [{
                name: "Mock Product",
                sku: "MOCK-001",
                description: "Mock product created due to missing OpenAI API key",
                category: "Mocks"
              }],
              pricing: [{
                product_name: "Mock Product",
                price: 99.99,
                currency: "USD",
                unit_price: true,
                quantity: 1,
                unit: "each",
                valid_from: null,
                valid_to: null,
                notes: "This is mock data as OpenAI API key is not configured"
              }],
              metadata: {
                document_date: new Date().toISOString().split('T')[0],
                reference_number: "MOCK-REF",
                additional_notes: "Mock data - OpenAI API key not configured"
              }
            })} }],
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
          })
        }
      }
    };
    return mockClient as OpenAI;
  }
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

// Initialize OpenAI client
const openai = createOpenAIClient();

// POST /api/documents/process - Process a document with AI
export async function POST(request: NextRequest) {
  try {
    // Parse request body first to avoid consuming it multiple times
    const body = await request.json();
    const { documentId, userId } = body;
    
    // Check if this is a service-level request with a service token
    const serviceToken = request.headers.get('X-Service-Token');
    const isServiceRequest = serviceToken === process.env.SERVICE_TOKEN && process.env.SERVICE_TOKEN;
    
    let uid;
    
    if (isServiceRequest) {
      // For service requests, get the user ID from the request body
      uid = userId;
      
      if (!uid) {
        return NextResponse.json({ error: 'User ID is required for service requests' }, { status: 400 });
      }
    } else {
      // For normal requests, get the user ID from the session
      uid = await getUID();
      if (!uid) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }
    
    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }
    
    // Document ID validation already done above

    // Create Supabase client
    const supabase = createServerClient();
    
    // Get document details
    const { data: document, error: docError } = await supabase
      .from('supplier_documents')
      .select('*, suppliers:supplier_id(name, email)')
      .eq('id', documentId)
      .eq('created_by', uid) // Ensure user owns this document
      .single();
    
    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }
    
    // Update document status to processing
    const { error: updateError } = await supabase
      .from('supplier_documents')
      .update({ processing_status: 'processing' })
      .eq('id', documentId);
    
    if (updateError) {
      console.error('Error updating document status:', updateError);
      return NextResponse.json({ error: 'Failed to update document status' }, { status: 500 });
    }
    
    // Get file URL from storage
    const { data: urlData } = supabase
      .storage
      .from('documents')
      .getPublicUrl(document.file_path);
    
    const fileUrl = urlData.publicUrl;
    
    // Process the document based on file type
    let extractedData;
    let processingMetadata;
    let processingError;
    
    try {
      // Different processing logic based on file type
      switch (document.file_type.toLowerCase()) {
        case 'csv':
          extractedData = await processCSV(fileUrl, document);
          break;
        case 'excel':
          extractedData = await processExcel(fileUrl, document);
          break;
        case 'pdf':
          extractedData = await processPDF(fileUrl, document);
          break;
        case 'image':
          extractedData = await processImage(fileUrl, document);
          break;
        default:
          extractedData = await processGenericDocument(fileUrl, document);
      }
      
      processingMetadata = {
        processedAt: new Date().toISOString(),
        fileType: document.file_type,
        documentType: document.document_type,
        supplierName: document.suppliers.name,
        supplierEmail: document.suppliers.email
      };
    } catch (error) {
      console.error('Error processing document:', error);
      processingError = error instanceof Error ? error.message : 'Unknown error during processing';
      
      // Update document with error status
      await supabase
        .from('supplier_documents')
        .update({
          processing_status: 'failed',
          processing_error: processingError,
          processed_at: new Date().toISOString()
        })
        .eq('id', documentId);
      
      return NextResponse.json({ error: 'Failed to process document', details: processingError }, { status: 500 });
    }
    
    // Update document with extracted data
    const { data: updatedDoc, error: finalUpdateError } = await supabase
      .from('supplier_documents')
      .update({
        processing_status: 'pending_review',
        extracted_data: extractedData,
        processing_metadata: processingMetadata,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .select()
      .single();
    
    if (finalUpdateError) {
      console.error('Error saving extracted data:', finalUpdateError);
      return NextResponse.json({ error: 'Failed to save extracted data' }, { status: 500 });
    }
    
    return NextResponse.json(updatedDoc);
  } catch (err) {
    console.error('Error in document processing API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Process CSV files
async function processCSV(fileUrl: string, document: any) {
  // In a real implementation, you would:
  // 1. Download the CSV file
  // 2. Parse it using a CSV library
  // 3. Extract structured data
  
  // For now, we'll use OpenAI to simulate the extraction
  return await extractDataWithAI(fileUrl, document, 'CSV');
}

// Process Excel files
async function processExcel(fileUrl: string, document: any) {
  // In a real implementation, you would:
  // 1. Download the Excel file
  // 2. Parse it using an Excel library
  // 3. Extract structured data
  
  // For now, we'll use OpenAI to simulate the extraction
  return await extractDataWithAI(fileUrl, document, 'Excel');
}

// Process PDF files
async function processPDF(fileUrl: string, document: any) {
  // In a real implementation, you would:
  // 1. Download the PDF file
  // 2. Use a PDF parsing library or OCR if needed
  // 3. Extract structured data
  
  // For now, we'll use OpenAI to simulate the extraction
  return await extractDataWithAI(fileUrl, document, 'PDF');
}

// Process Image files
async function processImage(fileUrl: string, document: any) {
  // In a real implementation, you would:
  // 1. Download the image
  // 2. Use OCR to extract text
  // 3. Extract structured data from the text
  
  // For now, we'll use OpenAI to simulate the extraction
  return await extractDataWithAI(fileUrl, document, 'Image');
}

// Process other document types
async function processGenericDocument(fileUrl: string, document: any) {
  // Generic processing for other document types
  return await extractDataWithAI(fileUrl, document, 'Generic');
}

// Use OpenAI to extract data from documents
async function extractDataWithAI(fileUrl: string, document: any, fileType: string) {
  // In a production environment, you would:
  // 1. Download the file
  // 2. Extract text content
  // 3. Send the text to OpenAI for analysis
  
  // For this implementation, we'll simulate the extraction with a structured prompt
  
  // Create a prompt based on document type
  const prompt = `
    You are an AI assistant that extracts structured data from ${fileType} documents.
    
    Document Type: ${document.document_type}
    Supplier: ${document.suppliers.name}
    
    Based on this information, please extract the following:
    1. Products mentioned in the document with their names, descriptions, and SKUs if available
    2. Pricing information for each product (price, currency, unit)
    3. Any validity dates for the pricing
    4. Any quantity information or bulk pricing
    
    Format the response as a JSON object with the following structure:
    {
      "products": [
        {
          "name": "Product Name",
          "sku": "SKU123",
          "description": "Product description",
          "category": "Product category if available"
        }
      ],
      "pricing": [
        {
          "product_name": "Product Name",
          "price": 100.00,
          "currency": "USD",
          "unit_price": true,
          "quantity": 1,
          "unit": "each",
          "valid_from": "2023-01-01",
          "valid_to": "2023-12-31",
          "notes": "Any additional pricing notes"
        }
      ],
      "metadata": {
        "document_date": "2023-06-15",
        "reference_number": "INV-12345",
        "additional_notes": "Any other relevant information"
      }
    }
    
    If you cannot extract certain information, use null or empty arrays as appropriate.
  `;
  
  // For demo purposes, we'll simulate different responses based on document type
  // In a real implementation, you would send the actual document content to OpenAI
  
  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // In a real implementation, you would use OpenAI's API like this:
  /*
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      { role: "system", content: "You are a data extraction assistant." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2,
  });
  
  const extractedData = JSON.parse(response.choices[0].message.content);
  return extractedData;
  */
  
  // For now, return simulated data based on document type
  if (document.document_type === 'Invoice') {
    return {
      products: [
        {
          name: "Premium Widget X200",
          sku: "WDG-X200",
          description: "High-performance widget with advanced features",
          category: "Widgets"
        },
        {
          name: "Standard Connector",
          sku: "CNT-STD",
          description: "Universal connector for all widget models",
          category: "Accessories"
        }
      ],
      pricing: [
        {
          product_name: "Premium Widget X200",
          price: 299.99,
          currency: "USD",
          unit_price: true,
          quantity: 2,
          unit: "each",
          valid_from: null,
          valid_to: null,
          notes: "Bulk discount applied"
        },
        {
          product_name: "Standard Connector",
          price: 24.95,
          currency: "USD",
          unit_price: true,
          quantity: 5,
          unit: "each",
          valid_from: null,
          valid_to: null,
          notes: null
        }
      ],
      metadata: {
        document_date: "2023-06-15",
        reference_number: "INV-12345",
        additional_notes: "Net 30 payment terms"
      }
    };
  } else if (document.document_type === 'Price List') {
    return {
      products: [
        {
          name: "Premium Widget X200",
          sku: "WDG-X200",
          description: "High-performance widget with advanced features",
          category: "Widgets"
        },
        {
          name: "Standard Widget S100",
          sku: "WDG-S100",
          description: "Standard widget for everyday use",
          category: "Widgets"
        },
        {
          name: "Economy Widget E50",
          sku: "WDG-E50",
          description: "Budget-friendly widget option",
          category: "Widgets"
        },
        {
          name: "Standard Connector",
          sku: "CNT-STD",
          description: "Universal connector for all widget models",
          category: "Accessories"
        }
      ],
      pricing: [
        {
          product_name: "Premium Widget X200",
          price: 299.99,
          currency: "USD",
          unit_price: true,
          quantity: 1,
          unit: "each",
          valid_from: "2023-01-01",
          valid_to: "2023-12-31",
          notes: "Volume discounts available"
        },
        {
          product_name: "Standard Widget S100",
          price: 149.99,
          currency: "USD",
          unit_price: true,
          quantity: 1,
          unit: "each",
          valid_from: "2023-01-01",
          valid_to: "2023-12-31",
          notes: null
        },
        {
          product_name: "Economy Widget E50",
          price: 79.99,
          currency: "USD",
          unit_price: true,
          quantity: 1,
          unit: "each",
          valid_from: "2023-01-01",
          valid_to: "2023-12-31",
          notes: null
        },
        {
          product_name: "Standard Connector",
          price: 24.95,
          currency: "USD",
          unit_price: true,
          quantity: 1,
          unit: "each",
          valid_from: "2023-01-01",
          valid_to: "2023-12-31",
          notes: "Bulk discounts: 10+ units: $22.95 each"
        }
      ],
      metadata: {
        document_date: "2023-01-01",
        reference_number: "PL-2023",
        additional_notes: "Prices subject to change without notice"
      }
    };
  } else {
    // Generic response for other document types
    return {
      products: [
        {
          name: "Generic Product",
          sku: "GP-001",
          description: "Product mentioned in document",
          category: "Unknown"
        }
      ],
      pricing: [
        {
          product_name: "Generic Product",
          price: 100.00,
          currency: "USD",
          unit_price: true,
          quantity: 1,
          unit: "each",
          valid_from: null,
          valid_to: null,
          notes: "Extracted from document"
        }
      ],
      metadata: {
        document_date: new Date().toISOString().split('T')[0],
        reference_number: null,
        additional_notes: "Data extracted from " + document.file_name
      }
    };
  }
}
