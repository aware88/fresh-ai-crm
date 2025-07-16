const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

async function fetchGoogleEmails() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    console.log('🔍 Fetching Google email accounts...\n');
    
    // Get Google email accounts with valid tokens
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('*')
      .eq('provider_type', 'google')
      .eq('is_active', true)
      .not('access_token', 'is', null);
    
    if (accountsError) {
      console.error('❌ Error fetching email accounts:', accountsError);
      return;
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('❌ No active Google email accounts found with access tokens');
      return;
    }
    
    console.log(`✅ Found ${accounts.length} Google email account(s)`);
    
    for (const account of accounts) {
      console.log(`\n📧 Fetching emails for ${account.email}...`);
      
      try {
        // Check if token is expired
        const now = new Date();
        const tokenExpiry = new Date(account.token_expires_at);
        
        if (tokenExpiry <= now) {
          console.log(`⚠️  Access token expired for ${account.email}, skipping...`);
          continue;
        }
        
        // Fetch emails from Gmail API
        const gmailResponse = await fetch(
          'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=in:inbox',
          {
            headers: {
              'Authorization': `Bearer ${account.access_token}`,
              'Accept': 'application/json'
            }
          }
        );
        
        if (!gmailResponse.ok) {
          console.error(`❌ Failed to fetch emails from Gmail API: ${gmailResponse.status}`);
          continue;
        }
        
        const gmailData = await gmailResponse.json();
        
        if (!gmailData.messages || gmailData.messages.length === 0) {
          console.log(`📭 No messages found for ${account.email}`);
          continue;
        }
        
        console.log(`📬 Found ${gmailData.messages.length} messages, fetching details...`);
        
        // Fetch details for each message
        const emailsToInsert = [];
        
        for (const message of gmailData.messages.slice(0, 5)) { // Limit to 5 emails for testing
          try {
            const messageResponse = await fetch(
              `https://gmail.googleapis.com/gmail/v1/users/me/messages/${message.id}`,
              {
                headers: {
                  'Authorization': `Bearer ${account.access_token}`,
                  'Accept': 'application/json'
                }
              }
            );
            
            if (!messageResponse.ok) {
              console.error(`❌ Failed to fetch message ${message.id}`);
              continue;
            }
            
            const messageData = await messageResponse.json();
            
            // Extract email details
            const headers = messageData.payload.headers;
            const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
            const from = headers.find(h => h.name === 'From')?.value || 'Unknown Sender';
            const to = headers.find(h => h.name === 'To')?.value || account.email;
            const date = headers.find(h => h.name === 'Date')?.value;
            
            // Get email body
            let body = '';
            if (messageData.payload.body && messageData.payload.body.data) {
              body = Buffer.from(messageData.payload.body.data, 'base64').toString('utf-8');
            } else if (messageData.payload.parts) {
              // Handle multipart messages
              const textPart = messageData.payload.parts.find(part => 
                part.mimeType === 'text/plain' || part.mimeType === 'text/html'
              );
              if (textPart && textPart.body && textPart.body.data) {
                body = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
              }
            }
            
            // Create email record
            const emailRecord = {
              user_id: account.user_id,
              email_account_id: account.id,
              message_id: messageData.id,
              subject: subject,
              sender: from,
              recipient: to,
              raw_content: body,
              text_content: body,
              received_date: date ? new Date(date).toISOString() : new Date().toISOString(),
              read: !messageData.labelIds?.includes('UNREAD'),
              is_processed: false,
              is_archived: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
            
            emailsToInsert.push(emailRecord);
            
          } catch (messageError) {
            console.error(`❌ Error processing message ${message.id}:`, messageError);
          }
        }
        
        // Insert emails into database
        if (emailsToInsert.length > 0) {
          console.log(`💾 Inserting ${emailsToInsert.length} emails into database...`);
          
          const { data: insertedEmails, error: insertError } = await supabase
            .from('emails')
            .upsert(emailsToInsert, { 
              onConflict: 'message_id',
              ignoreDuplicates: true 
            })
            .select('id');
          
          if (insertError) {
            console.error('❌ Error inserting emails:', insertError);
          } else {
            console.log(`✅ Successfully inserted ${insertedEmails?.length || 0} emails for ${account.email}`);
          }
        }
        
      } catch (accountError) {
        console.error(`❌ Error processing account ${account.email}:`, accountError);
      }
    }
    
    console.log('\n🎉 Email fetching complete!');
    console.log('💡 You can now refresh your email dashboard to see the imported emails.');
    
  } catch (error) {
    console.error('💥 Exception during email fetching:', error);
  }
}

fetchGoogleEmails(); 