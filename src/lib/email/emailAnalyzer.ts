import { fetchUnreadEmails } from './imapClient';
import openai from './openaiClient';
import { supabase } from '@/lib/supabaseClient';
import { v4 as uuidv4 } from 'uuid';

/**
 * Main function to read inbox, analyze emails, and store results
 * @param authToken Supabase authentication token to use for database operations
 */
export async function readInboxAndProfile(authToken?: string) {
  console.log('Starting email processing...');
  const results = {
    processed: 0,
    errors: 0,
    details: [] as any[],
    message: '',
  };

  try {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log('Email credentials not configured');
      results.message = 'Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.';
      return results;
    }
    
    console.log('Fetching unread emails...');
    // Fetch unread emails - now with better error handling
    const emails = await fetchUnreadEmails();
    console.log(`Processing ${emails.length} unread emails`);

    // Process each email
    for (const email of emails) {
      try {
        // Extract sender name from the from field if possible
        const senderEmail = email.from;
        const senderName = senderEmail.split('@')[0]; // Simple extraction of name from email
        
        // Step 1: Analyze the email with OpenAI
        const analysis = await analyzeEmailWithAI(email.body);
        console.log(`Analyzed email from ${senderEmail}`);

        // Step 2: Get user data for enrichment
        let contactId: string;
        
        // Get the current user's ID
        const { data: userData, error: userError } = authToken
          ? await supabase.auth.getUser(authToken)
          : await supabase.auth.getUser();
        
        if (userError || !userData.user?.id) {
          console.warn('Could not get user ID, falling back to basic upsert');
          contactId = await upsertContact({
            email: senderEmail,
            name: senderName,
            authToken
          });
        } else {
          // Step 2.1: Try to enrich contact with Metakocka data (NEW FLOW)
          try {
            const { enrichContactFromEmail } = await import('@/lib/integrations/metakocka/contact-enricher');
            const enrichmentResult = await enrichContactFromEmail(
              email.id || email.subject || 'temp-id',
              senderEmail,
              senderName,
              userData.user.id,
              undefined // organizationId - could be extracted from user context
            );
            
            console.log(`Contact enrichment completed:`, enrichmentResult.actions);
            if (enrichmentResult.error) {
              console.warn(`Contact enrichment warning: ${enrichmentResult.error}`);
            }
            
            // Use enriched contact ID if available, otherwise fallback to basic upsert
            contactId = enrichmentResult.crmContact?.id || await upsertContact({
              email: senderEmail,
              name: senderName,
              authToken
            });
            console.log(`Contact ID: ${contactId}`);
          } catch (enrichmentError) {
            console.warn(`Contact enrichment failed, falling back to basic upsert:`, enrichmentError);
            
            // Fallback to original upsert method
            contactId = await upsertContact({
              email: senderEmail,
              name: senderName,
              authToken
            });
            console.log(`Upserted contact with ID: ${contactId}`);
          }
        }

        // Step 3: Store the email and analysis
        const emailId = await storeEmail({
          sender: senderEmail,
          subject: email.subject,
          raw_content: email.body,
          analysis,
          contact_id: contactId,
          authToken
        });
        console.log(`Stored email with ID: ${emailId}`);

        // Track successful processing
        results.processed++;
        results.details.push({
          id: emailId,
          sender: senderEmail,
          subject: email.subject,
          success: true,
        });
      } catch (error) {
        const senderEmail = email.from || 'unknown';
        console.error(`Error processing email from ${senderEmail}:`, error);
        results.errors++;
        results.details.push({
          sender: senderEmail,
          subject: email.subject,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  } catch (error) {
    console.error('Error in readInboxAndProfile:', error);
    throw error;
  }

  return results;
}

/**
 * Analyze email content using OpenAI
 */
async function analyzeEmailWithAI(emailBody: string) {
  try {
    // Truncate long emails to avoid token limit issues
    // GPT-4 has a limit of ~8000 input tokens, we'll limit to ~6000 chars to be safe
    // (approximately 1500-2000 tokens depending on the content)
    const MAX_EMAIL_LENGTH = 6000;
    const truncatedEmail = emailBody.length > MAX_EMAIL_LENGTH 
      ? emailBody.substring(0, MAX_EMAIL_LENGTH) + "\n\n[Email truncated due to length]" 
      : emailBody;
    
    console.log(`Original email length: ${emailBody.length} chars, truncated to: ${truncatedEmail.length} chars`);
    
    const prompt = `Analyze this email and profile the sender:\n\n${truncatedEmail}`;
    
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // Using GPT-3.5 Turbo which has lower cost and higher limits than GPT-4
      messages: [
        { role: "system", content: "You are an expert at analyzing emails and profiling senders. Provide insights about the sender's personality, communication style, and potential relationship to the recipient." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });

    return response.choices[0]?.message?.content || 'No analysis available';
  } catch (error) {
    console.error('Error analyzing email with AI:', error);
    throw error;
  }
}

/**
 * Upsert a contact based on email address
 * @param email Contact's email address
 * @param name Contact's name (optional)
 * @param authToken Supabase auth token (optional)
 */
async function upsertContact({ 
  email, 
  name, 
  authToken 
}: { 
  email: string; 
  name?: string; 
  authToken?: string 
}) {
  try {
    // First, check if the contact exists
    const { data: existingContacts, error: fetchError } = await supabase
      .from('contacts')
      .select('id')
      .eq('email', email)
      .limit(1);

    if (fetchError) {
      console.error('Error fetching contact:', fetchError);
      throw fetchError;
    }

    // If contact exists, return the ID
    if (existingContacts && existingContacts.length > 0) {
      return existingContacts[0].id;
    }

    // Otherwise, create a new contact
    // Get the current user's ID
    const { data: userData, error: userError } = authToken
      ? await supabase.auth.getUser(authToken)
      : await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }

    // Use the authenticated user's ID directly since profiles table doesn't exist yet
    const userId = userData.user?.id;
    if (!userId) {
      throw new Error('Could not determine user ID');
    }
    
    console.log(`Using user ID ${userId} as created_by value for contact`);
    
    // Create the contact
    // Derive default first and last name if name is provided
    let firstName = "";
    let lastName = "";
    
    if (name) {
      const nameParts = name.trim().split(' ');
      firstName = nameParts[0] || '';
      lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
    } else {
      // Use email username as firstName if no name provided
      firstName = email.split('@')[0];
      lastName = "";
    }
    
    console.log(`Creating contact with firstName: ${firstName}, lastName: ${lastName}, email: ${email}`);
    
    // Create contact with lowercase column names to match database schema
    // Generate UUID for id since it's required and not auto-generated
    const { data: newContact, error: insertError } = await supabase
      .from('contacts')
      .insert({
        id: uuidv4(), // Using uuid package or a similar function
        firstname: firstName, // lowercase column name
        lastname: lastName, // lowercase column name
        email,
        status: 'lead' // Default status for email contacts
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('Error creating contact:', insertError);
      throw insertError;
    }

    return newContact.id;
  } catch (error) {
    console.error('Error upserting contact:', error);
    throw error;
  }
}

/**
 * Store email in database
 */
/**
 * Extracts personality type from AI analysis
 */
async function extractPersonalityType(analysis: string): Promise<{type: string, summary: string}> {
  try {
    // Use AI to extract a concise personality type and summary
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { 
          role: "system", 
          content: `Extract a brief personality type (1-3 words) and a 1-2 sentence summary from the analysis. 
          Format as JSON: {"type": "Type", "summary": "Brief summary"}` 
        },
        { role: "user", content: analysis }
      ],
      temperature: 0.3,
      max_tokens: 150,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error('No content in response');
    
    // Try to parse the JSON response
    try {
      const result = JSON.parse(content);
      return {
        type: result.type || 'Unknown',
        summary: result.summary || analysis.slice(0, 200) // Fallback to first 200 chars if no summary
      };
    } catch (e) {
      // If JSON parsing fails, use the raw content
      return {
        type: 'Analyzed',
        summary: content.slice(0, 200)
      };
    }
  } catch (error) {
    console.error('Error extracting personality type:', error);
    return {
      type: 'Unknown',
      summary: 'Personality analysis not available'
    };
  }
}

/**
 * Store email and update contact's personality profile
 */
async function storeEmail({ sender, subject, raw_content, analysis, contact_id, authToken }: { 
  sender: string; 
  subject: string; 
  raw_content: string; 
  analysis: string; 
  contact_id: string;
  authToken?: string;
}) {
  try {
    console.log(`Storing email for contact: ${contact_id}`);
    
    // Initialize Supabase client with auth token if provided
    if (authToken) {
      supabase.auth.setSession({
        access_token: authToken,
        refresh_token: '',
      });
    }
    
    // Get the current user's ID
    const { data: userData, error: userError } = authToken
      ? await supabase.auth.getUser(authToken)
      : await supabase.auth.getUser();
      
    if (userError) {
      console.error('Error getting user:', userError);
      throw userError;
    }
    
    const userId = userData.user?.id;
    if (!userId) {
      throw new Error('Could not determine user ID');
    }
    
    // First, check if the emails table exists
    const { error: tableCheckError } = await supabase
      .from('emails')
      .select('id')
      .limit(1)
      .maybeSingle();
    
    // If the emails table exists, store the email there
    if (!tableCheckError) {
      console.log('Emails table exists, storing email in table');
      
      // Prepare email data with required fields
      const emailData = {
        subject: subject || '(No subject)',
        sender: sender || 'unknown@example.com',
        recipient: userData.user?.email || '',
        raw_content: raw_content || '',
        analysis: analysis || '',
        contact_id: contact_id || null,
        user_id: userId, // Ensure user_id is set for RLS
        read: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      // Store email in the emails table using RPC for better error handling
      const { data: email, error: emailError } = await supabase.rpc('store_email', {
        p_subject: emailData.subject,
        p_sender: emailData.sender,
        p_recipient: emailData.recipient,
        p_raw_content: emailData.raw_content,
        p_analysis: emailData.analysis,
        p_contact_id: emailData.contact_id,
        p_user_id: emailData.user_id,
        p_read: emailData.read
      }).select('id').single();
      
      if (emailError) {
        console.error('Error storing email in emails table:', emailError);
        // Fall back to storing as a note if there's an error
        return await storeEmailAsNote({ sender, subject, raw_content, analysis, contact_id });
      }
      
      if (contact_id) {
        try {
          // Extract personality type from analysis
          const { type: personalityType, summary: analysisSummary } = await extractPersonalityType(analysis);
          
          // Prepare the personality analysis data
          const personalityAnalysis = {
            type: personalityType,
            summary: analysisSummary,
            fullAnalysis: analysis,
            sourceEmailId: email?.id,
            analyzedAt: new Date().toISOString()
          };
          
          // Update contact with personality information
          const { error: updateError } = await supabase
            .from('contacts')
            .update({ 
              lastinteraction: new Date().toISOString(),
              personalitytype: personalityType,
              personalityanalysis: personalityAnalysis,
              updatedat: new Date().toISOString()
            })
            .eq('id', contact_id);
            
          if (updateError) {
            console.error('Error updating contact with personality analysis:', updateError);
            throw updateError;
          }
          
          // Store the analysis in history (using the new approach with JSONB column)
          // The trigger will handle adding to the history when personalityType changes
            
          console.log(`Updated contact ${contact_id} with personality type: ${personalityType}`);
          
        } catch (error) {
          console.error('Error updating contact personality:', error);
          // Don't fail the whole operation if personality update fails
        }
      }
      
      console.log('Successfully stored email in emails table:', email?.id);
      return email?.id;
    } else {
      // Fall back to storing as a note if the emails table doesn't exist
      console.log('Emails table not found, storing as note instead');
      return await storeEmailAsNote({ sender, subject, raw_content, analysis, contact_id });
    }
  } catch (error) {
    console.error('Error in storeEmail:', error);
    throw error;
  }
}

/**
 * Fallback function to store email as a note on the contact
 */
async function storeEmailAsNote({ sender, subject, raw_content, analysis, contact_id }: { 
  sender: string; 
  subject: string; 
  raw_content: string; 
  analysis: string; 
  contact_id: string;
}) {
  try {
    console.log(`Storing email as a note for contact: ${contact_id}`);
    
    // First, get the current contact to append to their notes
    const { data: contact, error: contactError } = await supabase
      .from('contacts')
      .select('notes')
      .eq('id', contact_id)
      .single();
    
    if (contactError) {
      console.error('Error fetching contact for email storage:', contactError);
      throw contactError;
    }
    
    // Format email data as a note
    const emailNote = `\n\n---\nEmail from: ${sender}\nSubject: ${subject}\nDate: ${new Date().toISOString()}\n\nAnalysis:\n${analysis}\n\nContent:\n${truncateText(raw_content, 1000)}\n\n---\n`;
    
    // Append to existing notes or create new notes
    const updatedNotes = (contact?.notes || '') + emailNote;
    
    // Update the contact with the email data in notes
    // Use lowercase column names to match database schema
    const { data: updated, error: updateError } = await supabase
      .from('contacts')
      .update({ 
        notes: updatedNotes,
        lastcontact: new Date().toISOString() // lowercase column name
      })
      .eq('id', contact_id)
      .single();
    
    if (updateError) {
      console.error('Error storing email as note:', updateError);
      throw updateError;
    }
    
    console.log('Successfully stored email as note for contact:', contact_id);
    return contact_id; // Return the contact ID as the email ID for now
  } catch (error) {
    console.error('Error in storeEmailAsNote:', error);
    throw error;
  }
}

/**
 * Helper function to truncate text
 */
function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
}

/**
 * Analyze an email's content to determine the sender's personality
 * This is a public function used by the API routes
 */
export async function analyzeEmailPersonality(emailContent: string): Promise<string> {
  try {
    return await analyzeEmailWithAI(emailContent);
  } catch (error) {
    console.error('Error in analyzeEmailPersonality:', error);
    throw error;
  }
}
