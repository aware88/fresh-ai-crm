/**
 * Organization Branding Test Script
 * 
 * This script tests the organization branding functionality, including:
 * - Creating/updating branding settings via API
 * - Retrieving branding settings
 * - Verifying theme application
 */

const { test, expect } = require('@playwright/test');
require('dotenv').config();

// Configuration
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = process.env.TEST_ADMIN_EMAIL;
const TEST_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!TEST_EMAIL || !TEST_PASSWORD) {
  console.error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD environment variables must be set');
  process.exit(1);
}

// Test data
const testBranding = {
  primary_color: '#1e40af', // blue-800
  secondary_color: '#475569', // slate-600
  accent_color: '#f59e0b', // amber-500
  font_family: 'Roboto, sans-serif',
  logo_url: 'https://example.com/test-logo.png',
  custom_domain: 'test.example.com',
};

test.describe('Organization Branding', () => {
  let organizationId;
  let page;
  
  test.beforeAll(async ({ browser }) => {
    // Set up a new page
    page = await browser.newPage();
    
    // Login
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL(`${BASE_URL}/app/dashboard`);
    
    // Get organization ID from local storage
    organizationId = await page.evaluate(() => {
      const userDataStr = localStorage.getItem('user-data');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        return userData.current_organization_id;
      }
      return null;
    });
    
    if (!organizationId) {
      throw new Error('Could not determine organization ID');
    }
  });
  
  test('Admin can update organization branding', async () => {
    // Navigate to admin organization page
    await page.goto(`${BASE_URL}/admin/organizations`);
    
    // Find and click on the first organization (should be the test organization)
    await page.click('table tbody tr:first-child a');
    
    // Click on the branding tab
    await page.click('button:has-text("Branding")');
    
    // Update branding settings
    await page.fill('input#primary_color', testBranding.primary_color);
    await page.fill('input#secondary_color', testBranding.secondary_color);
    await page.fill('input#accent_color', testBranding.accent_color);
    await page.fill('input#font_family', testBranding.font_family);
    await page.fill('input#logo_url', testBranding.logo_url);
    await page.fill('input#custom_domain', testBranding.custom_domain);
    
    // Save branding settings
    await page.click('button:has-text("Save Branding Settings")');
    
    // Wait for success message
    await page.waitForSelector('text=Branding settings saved successfully');
  });
  
  test('API returns correct branding settings', async () => {
    // Get API token
    const token = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });
    
    // Make API request to get branding settings
    const response = await fetch(`${BASE_URL}/api/admin/organizations/${organizationId}/branding`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data.branding).toBeDefined();
    expect(data.branding.primary_color).toBe(testBranding.primary_color);
    expect(data.branding.secondary_color).toBe(testBranding.secondary_color);
    expect(data.branding.accent_color).toBe(testBranding.accent_color);
    expect(data.branding.font_family).toBe(testBranding.font_family);
    expect(data.branding.logo_url).toBe(testBranding.logo_url);
    expect(data.branding.custom_domain).toBe(testBranding.custom_domain);
  });
  
  test('Theme is applied correctly in the UI', async () => {
    // Navigate to the dashboard
    await page.goto(`${BASE_URL}/app/dashboard`);
    
    // Check if CSS variables are applied correctly
    const primaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--primary-color').trim();
    });
    
    const secondaryColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--secondary-color').trim();
    });
    
    const accentColor = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--accent-color').trim();
    });
    
    // Convert hex to lowercase for comparison
    expect(primaryColor.toLowerCase()).toBe(testBranding.primary_color.toLowerCase());
    expect(secondaryColor.toLowerCase()).toBe(testBranding.secondary_color.toLowerCase());
    expect(accentColor.toLowerCase()).toBe(testBranding.accent_color.toLowerCase());
    
    // Check if logo is applied
    const logoSrc = await page.evaluate(() => {
      const logo = document.querySelector('img.organization-logo');
      return logo ? logo.src : null;
    });
    
    expect(logoSrc).toBe(testBranding.logo_url);
  });
  
  test.afterAll(async () => {
    // Clean up - reset branding to defaults
    await page.goto(`${BASE_URL}/admin/organizations/${organizationId}`);
    await page.click('button:has-text("Branding")');
    
    await page.fill('input#primary_color', '#0f172a');
    await page.fill('input#secondary_color', '#64748b');
    await page.fill('input#accent_color', '#2563eb');
    await page.fill('input#font_family', 'Inter, system-ui, sans-serif');
    await page.fill('input#logo_url', '');
    await page.fill('input#custom_domain', '');
    
    await page.click('button:has-text("Save Branding Settings")');
    await page.waitForSelector('text=Branding settings saved successfully');
    
    await page.close();
  });
});
