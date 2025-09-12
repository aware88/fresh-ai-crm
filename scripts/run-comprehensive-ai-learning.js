const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runComprehensiveLearning() {
  console.log('🚀 Starting comprehensive AI learning on all emails...');
  
  try {
    // Get all users with emails
    const { data: users, error: usersError } = await supabase
      .from('email_accounts')
      .select('user_id, email')
      .eq('is_active', true);
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }
    
    console.log('👥 Found', users.length, 'active email accounts');
    
    let totalProcessed = 0;
    let totalPatterns = 0;
    
    // Process emails for each user
    for (const account of users) {
      console.log('\n📧 Processing emails for:', account.email);
      
      // Get all emails for this user
      const { data: emails, error: emailsError } = await supabase
        .from('email_index')
        .select('*')
        .eq('user_id', account.user_id)
        .order('received_at', { ascending: false })
        .limit(200); // Process latest 200 emails per account
      
      if (emailsError) {
        console.error('Error fetching emails for', account.email, ':', emailsError);
        continue;
      }
      
      console.log('  📨 Found', emails.length, 'emails to analyze');
      
      if (emails.length === 0) continue;
      
      // Analyze communication patterns
      const patterns = await analyzeEmailPatterns(emails, account.user_id);
      totalPatterns += patterns.length;
      totalProcessed += emails.length;
      
      console.log('  ✅ Extracted', patterns.length, 'communication patterns');
    }
    
    console.log('\n🎉 Comprehensive AI learning completed!');
    console.log('📈 Total emails processed:', totalProcessed);
    console.log('🎯 Total patterns extracted:', totalPatterns);
    
  } catch (error) {
    console.error('❌ Error in comprehensive learning:', error);
  }
}

async function analyzeEmailPatterns(emails, userId) {
  const patterns = [];
  
  try {
    // Analyze different types of communication patterns
    const senders = {};
    const subjects = {};
    const languages = {};
    
    emails.forEach(email => {
      // Group by sender for frequent contacts
      if (email.sender_email && email.email_type === 'received') {
        if (!senders[email.sender_email]) {
          senders[email.sender_email] = [];
        }
        senders[email.sender_email].push(email);
      }
      
      // Analyze subject patterns
      if (email.subject) {
        const subjectKey = email.subject.toLowerCase().substring(0, 30);
        if (!subjects[subjectKey]) {
          subjects[subjectKey] = [];
        }
        subjects[subjectKey].push(email);
      }
      
      // Language patterns
      if (email.language_code) {
        if (!languages[email.language_code]) {
          languages[email.language_code] = 0;
        }
        languages[email.language_code]++;
      }
    });
    
    // Create communication frequency patterns
    const frequentSenders = Object.keys(senders).filter(email => senders[email].length >= 3);
    console.log('    📊 Frequent senders:', frequentSenders.length);
    
    for (const senderEmail of frequentSenders.slice(0, 5)) {
      const emailsFromSender = senders[senderEmail];
      const pattern = {
        id: crypto.randomUUID(),
        user_id: userId,
        pattern_type: 'frequent_contact',
        email_category: 'business',
        pattern_text: `Frequent communication with ${senderEmail}`,
        context: `Regular correspondence (${emailsFromSender.length} emails)`,
        confidence: Math.min(0.9, emailsFromSender.length / 10),
        frequency_count: emailsFromSender.length,
        extracted_from_email_ids: emailsFromSender.map(e => e.id).slice(0, 10),
        tags: ['frequent_sender', 'business_contact'],
        is_active: true,
        metadata: {
          contact_email: senderEmail,
          last_email_date: emailsFromSender[0].received_at,
          subjects: emailsFromSender.slice(0, 3).map(e => e.subject).filter(Boolean)
        },
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('email_patterns')
        .insert(pattern);
      
      if (!error) {
        patterns.push(pattern);
        console.log('    📝 Contact pattern created for:', senderEmail, '(', emailsFromSender.length, 'emails)');
      } else if (error.code !== '23505') { // Ignore duplicate errors
        console.error('    ❌ Error creating contact pattern:', error);
      }
    }
    
    // Create subject line patterns
    const commonSubjects = Object.keys(subjects).filter(subject => subjects[subject].length >= 2);
    console.log('    📊 Common subject patterns:', commonSubjects.length);
    
    for (const subjectKey of commonSubjects.slice(0, 3)) {
      const emailsWithSubject = subjects[subjectKey];
      const pattern = {
        id: crypto.randomUUID(),
        user_id: userId,
        pattern_type: 'subject_pattern',
        email_category: 'recurring',
        pattern_text: `Recurring subject: ${subjectKey}`,
        context: `Similar subject lines appearing ${emailsWithSubject.length} times`,
        confidence: Math.min(0.8, emailsWithSubject.length / 5),
        frequency_count: emailsWithSubject.length,
        extracted_from_email_ids: emailsWithSubject.map(e => e.id).slice(0, 5),
        tags: ['recurring_subject', 'pattern'],
        is_active: true,
        metadata: {
          subject_pattern: subjectKey,
          full_subjects: emailsWithSubject.slice(0, 3).map(e => e.subject)
        },
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('email_patterns')
        .insert(pattern);
      
      if (!error) {
        patterns.push(pattern);
        console.log('    📝 Subject pattern created:', subjectKey);
      } else if (error.code !== '23505') {
        console.error('    ❌ Error creating subject pattern:', error);
      }
    }
    
    // Create language patterns
    const primaryLanguages = Object.keys(languages).filter(lang => languages[lang] >= 5);
    console.log('    📊 Primary languages:', primaryLanguages);
    
    for (const language of primaryLanguages) {
      const pattern = {
        id: crypto.randomUUID(),
        user_id: userId,
        pattern_type: 'language_preference',
        email_category: 'communication',
        language: language,
        pattern_text: `Primary communication language: ${language}`,
        context: `${languages[language]} emails in ${language}`,
        confidence: Math.min(0.95, languages[language] / emails.length),
        frequency_count: languages[language],
        tags: ['language', 'preference'],
        is_active: true,
        metadata: {
          language_code: language,
          email_count: languages[language],
          percentage: Math.round((languages[language] / emails.length) * 100)
        },
        created_at: new Date().toISOString()
      };
      
      const { error } = await supabase
        .from('email_patterns')
        .insert(pattern);
      
      if (!error) {
        patterns.push(pattern);
        console.log('    📝 Language pattern created:', language, '(', languages[language], 'emails)');
      } else if (error.code !== '23505') {
        console.error('    ❌ Error creating language pattern:', error);
      }
    }
    
  } catch (error) {
    console.error('Error analyzing patterns:', error);
  }
  
  return patterns;
}

runComprehensiveLearning();