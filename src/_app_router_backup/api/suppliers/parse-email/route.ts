import { NextRequest, NextResponse } from 'next/server';
import { initializeSupplierData } from '@/lib/suppliers/init';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { SupplierEmail } from '@/types/supplier';

// Path to store supplier emails data
const emailsPath = path.join(process.cwd(), 'src/data/supplier_emails.json');
const dataDir = path.join(process.cwd(), 'src/data');

// Initialize emails file if it doesn't exist
const initEmailsFile = () => {
  // Ensure data directory exists
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  
  if (!fs.existsSync(emailsPath)) {
    fs.writeFileSync(emailsPath, JSON.stringify([]));
  }
};

// Helper function to extract email details
const extractEmailDetails = (emailContent: string) => {
  const lines = emailContent.split('\n');
  let senderEmail = '';
  let senderName = '';
  let subject = '';
  let receivedDate = new Date();
  let body = '';
  
  // Try to extract email headers
  const fromRegex = /^From:\s*"?([^"<]+)"?\s*<?([^>]+)>?/i;
  const subjectRegex = /^Subject:\s*(.+)/i;
  const dateRegex = /^Date:\s*(.+)/i;
  
  let headerSection = true;
  
  for (const line of lines) {
    if (headerSection) {
      // Check for From header
      const fromMatch = line.match(fromRegex);
      if (fromMatch) {
        senderName = fromMatch[1].trim();
        senderEmail = fromMatch[2].trim();
        continue;
      }
      
      // Check for Subject header
      const subjectMatch = line.match(subjectRegex);
      if (subjectMatch) {
        subject = subjectMatch[1].trim();
        continue;
      }
      
      // Check for Date header
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        try {
          receivedDate = new Date(dateMatch[1].trim());
        } catch (e) {
          // If date parsing fails, use current date
          receivedDate = new Date();
        }
        continue;
      }
      
      // If we hit an empty line after seeing some headers, we're entering the body
      if (line.trim() === '' && (senderEmail || subject)) {
        headerSection = false;
        continue;
      }
    } else {
      // We're in the body section
      body += line + '\n';
    }
  }
  
  // If we couldn't extract structured headers, try a simpler approach
  if (!senderEmail) {
    // Look for email addresses in the content
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
    const emails = emailContent.match(emailRegex);
    if (emails && emails.length > 0) {
      senderEmail = emails[0];
    }
  }
  
  return {
    senderEmail: senderEmail || 'unknown@example.com',
    senderName: senderName || 'Unknown Sender',
    subject: subject || 'No Subject',
    receivedDate,
    body: body.trim() || emailContent
  };
};

// Save an email from a supplier
export async function POST(request: NextRequest) {
  // Ensure data files are initialized
  await initializeSupplierData();
  try {
    const { emailContent, productTags = [], supplierId } = await request.json();
    
    if (!emailContent) {
      return NextResponse.json(
        { error: 'Email content is required' },
        { status: 400 }
      );
    }
    
    initEmailsFile();
    
    // Extract email details
    const { senderEmail, senderName, subject, receivedDate, body } = extractEmailDetails(emailContent);
    
    // Read existing emails
    const emailsData = fs.readFileSync(emailsPath, 'utf8');
    const emails: SupplierEmail[] = JSON.parse(emailsData);
    
    // Create new email entry
    const newEmail: SupplierEmail = {
      id: uuidv4(),
      supplierId: supplierId || '', // May be empty if supplier not yet identified
      senderEmail,
      senderName,
      subject,
      body,
      receivedDate,
      productTags,
      metadata: {
        extractedFromRawEmail: true,
      }
    };
    
    emails.push(newEmail);
    fs.writeFileSync(emailsPath, JSON.stringify(emails, null, 2));
    
    // If no supplier ID was provided, try to find a matching supplier
    let suggestedSupplierId = '';
    if (!supplierId) {
      const suppliersPath = path.join(process.cwd(), 'src/data/suppliers.json');
      if (fs.existsSync(suppliersPath)) {
        const suppliersData = fs.readFileSync(suppliersPath, 'utf8');
        const suppliers = JSON.parse(suppliersData);
        
        // Look for a supplier with matching email
        const matchingSupplier = suppliers.find((s: any) => s.email.toLowerCase() === senderEmail.toLowerCase());
        if (matchingSupplier) {
          suggestedSupplierId = matchingSupplier.id;
          
          // Update the email with the supplier ID
          newEmail.supplierId = suggestedSupplierId;
          fs.writeFileSync(emailsPath, JSON.stringify(emails, null, 2));
        }
      }
    }
    
    return NextResponse.json({
      ...newEmail,
      suggestedSupplierId
    });
  } catch (error) {
    console.error('Error parsing email:', error);
    return NextResponse.json(
      { error: 'Failed to parse email' },
      { status: 500 }
    );
  }
}

// Get emails for a specific supplier
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get('supplierId');
    
    initEmailsFile();
    const emailsData = fs.readFileSync(emailsPath, 'utf8');
    const emails: SupplierEmail[] = JSON.parse(emailsData);
    
    // Filter emails by supplier ID if provided
    const filteredEmails = supplierId 
      ? emails.filter(email => email.supplierId === supplierId)
      : emails;
    
    return NextResponse.json(filteredEmails);
  } catch (error) {
    console.error('Error fetching emails:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}
