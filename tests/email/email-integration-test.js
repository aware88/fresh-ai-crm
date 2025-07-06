/**
 * Email Integration Test Script
 * 
 * This script tests the integration of all email components implemented across the four sprints.
 * It verifies that components render correctly and interact with each other as expected.
 */

const { test, expect } = require('@playwright/test');

// Test the Email Client Enhancements (Sprint 1)
test.describe('Sprint 1: Email Client Enhancements', () => {
  test('Email Comments component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-email-comments');
    await expect(page.locator('.email-comments')).toBeVisible();
    await expect(page.locator('.comment-list')).toBeVisible();
    
    // Test adding a comment
    await page.fill('.comment-input', 'This is a test comment');
    await page.click('.add-comment-button');
    await expect(page.locator('.comment-list')).toContainText('This is a test comment');
  });

  test('Email Signatures component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-email-signatures');
    await expect(page.locator('.email-signature')).toBeVisible();
    
    // Test creating a signature
    await page.click('.add-signature-button');
    await page.fill('.signature-name-input', 'Test Signature');
    await page.fill('.signature-content-input', '<p>Test signature content</p>');
    await page.click('.save-signature-button');
    await expect(page.locator('.signature-list')).toContainText('Test Signature');
  });

  test('Email Attachments component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-email-attachments');
    await expect(page.locator('.email-attachments')).toBeVisible();
    
    // Test attachment list rendering
    await expect(page.locator('.attachment-list')).toBeVisible();
  });

  test('Email Language Detection component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-email-language-detection');
    await expect(page.locator('.email-language-detection')).toBeVisible();
    
    // Test language detection
    await page.fill('.email-content-input', 'This is a test email in English');
    await page.click('.detect-language-button');
    await expect(page.locator('.detected-language')).toContainText('English');
  });

  test('Email Compose component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-email-compose');
    await expect(page.locator('.email-compose')).toBeVisible();
    
    // Test email composition
    await page.fill('.email-to-input', 'test@example.com');
    await page.fill('.email-subject-input', 'Test Subject');
    await page.fill('.email-body-input', 'Test email body');
    await page.click('.send-email-button');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});

// Test the Email Organization (Sprint 2)
test.describe('Sprint 2: Email Organization', () => {
  test('Email Country Filter component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/organization');
    await page.click('text=Country Filters');
    await expect(page.locator('.email-country-filter')).toBeVisible();
    
    // Test country selection
    await page.click('.country-dropdown');
    await page.click('text=United States');
    await expect(page.locator('.selected-countries')).toContainText('United States');
  });

  test('Email Status Mapping component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/organization');
    await page.click('text=Status Mapping');
    await expect(page.locator('.email-status-mapping')).toBeVisible();
    
    // Test adding a mapping
    await page.click('.add-mapping-button');
    await page.fill('.pattern-input', 'urgent');
    await page.fill('.status-input', 'High Priority');
    await page.click('.save-mapping-button');
    await expect(page.locator('.mapping-list')).toContainText('High Priority');
  });

  test('Email Prompt Rules Editor component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/organization');
    await page.click('text=Prompt Rules');
    await expect(page.locator('.email-prompt-rules-editor')).toBeVisible();
    
    // Test adding a rule
    await page.click('text=Add Rule');
    await page.fill('input[placeholder="e.g., Customer Support Response"]', 'Test Rule');
    await page.fill('input[placeholder="support OR help OR issue"]', 'test OR example');
    await page.fill('textarea[placeholder="Instructions for the AI to generate a response"]', 'Generate a test response');
    await page.click('text=Save Rule');
    await expect(page.locator('.success')).toBeVisible();
  });
});

// Test the Advanced Logic (Sprint 3)
test.describe('Sprint 3: Advanced Logic', () => {
  test('Magento Integration component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-magento-integration');
    await expect(page.locator('.magento-integration')).toBeVisible();
    
    // Test order display
    await page.fill('.email-address-input', 'customer@example.com');
    await page.click('.fetch-orders-button');
    await expect(page.locator('.order-list')).toBeVisible();
  });

  test('Email RAG Processor component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-rag-processor');
    await expect(page.locator('.email-rag-processor')).toBeVisible();
    
    // Test RAG processing
    await page.fill('.email-content-input', 'I need help with my recent order');
    await page.click('.process-button');
    await expect(page.locator('.rag-results')).toBeVisible();
  });

  test('Email AI Fallback component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/test-ai-fallback');
    await expect(page.locator('.email-ai-fallback')).toBeVisible();
    
    // Test AI response generation
    await page.fill('.email-content-input', 'How do I return my order?');
    await page.fill('.email-subject-input', 'Return Request');
    await page.click('.generate-button');
    await expect(page.locator('.ai-response')).toBeVisible();
  });
});

// Test the External Channels (Sprint 4)
test.describe('Sprint 4: External Channels', () => {
  test('Facebook Inbox component renders and functions correctly', async ({ page }) => {
    await page.goto('/email/external/facebook');
    await expect(page.locator('.facebook-inbox')).toBeVisible();
    
    // Test conversation display
    await expect(page.locator('.conversation-list')).toBeVisible();
    
    // Test message sending
    await page.click('.conversation-item:first-child');
    await page.fill('input[placeholder="Type a message..."]', 'Test message');
    await page.click('.send-button');
    await expect(page.locator('.success')).toBeVisible();
  });
});

// Test the Integration between Components
test.describe('Component Integration Tests', () => {
  test('Email Compose integrates with Signatures and Attachments', async ({ page }) => {
    await page.goto('/email/test-integration');
    await expect(page.locator('.email-compose')).toBeVisible();
    
    // Test signature selection in compose
    await page.click('.signature-selector');
    await page.click('.signature-option:first-child');
    await expect(page.locator('.email-body-input')).toContainText('Best regards');
    
    // Test attachment addition in compose
    await page.click('.add-attachment-button');
    await page.setInputFiles('input[type="file"]', 'test-file.txt');
    await expect(page.locator('.attachment-list')).toContainText('test-file.txt');
  });

  test('Email Detail integrates with Comments and RAG', async ({ page }) => {
    await page.goto('/email/test-detail-integration');
    await expect(page.locator('.email-detail')).toBeVisible();
    
    // Test comments in email detail
    await page.fill('.comment-input', 'Integration test comment');
    await page.click('.add-comment-button');
    await expect(page.locator('.comment-list')).toContainText('Integration test comment');
    
    // Test RAG in email detail
    await page.click('.process-rag-button');
    await expect(page.locator('.rag-results')).toBeVisible();
  });
});

// Test the End-to-End Workflows
test.describe('End-to-End Workflows', () => {
  test('Complete email workflow: receive, process, respond', async ({ page }) => {
    await page.goto('/email');
    
    // Select an email
    await page.click('.email-list-item:first-child');
    await expect(page.locator('.email-detail')).toBeVisible();
    
    // Process with RAG
    await page.click('.process-rag-button');
    await expect(page.locator('.rag-results')).toBeVisible();
    
    // Generate AI response
    await page.click('.generate-ai-response-button');
    await expect(page.locator('.ai-response')).toBeVisible();
    
    // Reply with generated response
    await page.click('.reply-button');
    await expect(page.locator('.email-compose')).toBeVisible();
    await page.click('.use-ai-response-button');
    await page.click('.send-email-button');
    await expect(page.locator('.success-message')).toBeVisible();
  });
});
