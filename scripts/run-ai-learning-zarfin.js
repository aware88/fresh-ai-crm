#!/usr/bin/env node

/**
 * Run AI Learning on Zarfin's Emails
 * This script triggers AI learning for all of zarfin's existing emails
 */

require('dotenv').config({ path: '.env.local' });

async function runAILearning() {
  console.log('🤖 Starting AI Learning for Zarfin\'s emails...');
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';
  
  try {
    // Call the AI learning API endpoint
    const response = await fetch(`${baseUrl}/api/email/learning/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Internal-AI-Learning'
      },
      body: JSON.stringify({
        accountId: '0d91ab34-e7b8-4d09-9351-7f22fca4a975', // Zarfin's account ID
        userId: '01904d49-cff1-7006-8000-e6e6fa955501', // Zarfin's user ID
        forceRelearn: false, // Only process emails that haven't been analyzed
        batchSize: 50 // Process 50 emails at a time
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API error: ${response.status} - ${error}`);
    }

    const result = await response.json();
    console.log('✅ AI Learning initiated:', result);
    
    // Poll for status
    if (result.jobId) {
      console.log('📊 Job ID:', result.jobId);
      await pollJobStatus(baseUrl, result.jobId);
    }
    
  } catch (error) {
    console.error('❌ Error running AI learning:', error);
  }
}

async function pollJobStatus(baseUrl, jobId) {
  console.log('⏳ Checking job status...');
  
  let attempts = 0;
  const maxAttempts = 60; // Check for up to 5 minutes
  
  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${baseUrl}/api/email/learning/jobs?jobId=${jobId}`, {
        headers: {
          'User-Agent': 'Internal-AI-Learning'
        }
      });
      
      if (response.ok) {
        const status = await response.json();
        console.log(`📊 Job Status: ${status.status} (${status.processed}/${status.total} emails processed)`);
        
        if (status.status === 'completed') {
          console.log('✅ AI Learning completed successfully!');
          console.log('📈 Results:', {
            processed: status.processed,
            failed: status.failed,
            skipped: status.skipped,
            duration: status.duration
          });
          break;
        } else if (status.status === 'failed') {
          console.error('❌ Job failed:', status.error);
          break;
        }
      }
    } catch (error) {
      console.error('Error checking status:', error);
    }
    
    // Wait 5 seconds before next check
    await new Promise(resolve => setTimeout(resolve, 5000));
    attempts++;
  }
  
  if (attempts >= maxAttempts) {
    console.log('⏱️ Job is still running after 5 minutes. Check the dashboard for updates.');
  }
}

// Run the script
runAILearning();