/**
 * Test script for Metakocka Order Management UI components
 */

import { test, expect } from '@playwright/test';
import { loginAsTestUser } from '../helpers/auth';

// Test the order dashboard page
test.describe('Metakocka Order Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsTestUser(page);
  });

  test('should display the order dashboard', async ({ page }) => {
    // Navigate to the orders page
    await page.goto('/orders');
    
    // Check that the page loads correctly
    await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
    
    // Check that the tabs are visible
    await expect(page.getByRole('tab', { name: 'All' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Draft' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Confirmed' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Fulfilled' })).toBeVisible();
    
    // Check that the order list is visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should search for orders', async ({ page }) => {
    // Navigate to the orders page
    await page.goto('/orders');
    
    // Enter a search term
    await page.getByPlaceholder('Search orders...').fill('Test Order');
    
    // Wait for search results
    await page.waitForTimeout(500); // Allow time for search to complete
    
    // Check that the search results update
    // Note: This is a basic check, actual implementation would verify specific results
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should sync an order with Metakocka', async ({ page }) => {
    // Navigate to the orders page
    await page.goto('/orders');
    
    // Find the first sync button and click it
    const syncButton = page.getByRole('button', { name: 'Sync' }).first();
    await expect(syncButton).toBeVisible();
    
    // Click the sync button
    await syncButton.click();
    
    // Check for success toast
    await expect(page.getByText('Order synced successfully')).toBeVisible({ timeout: 5000 });
  });
});

// Test the order detail page
test.describe('Metakocka Order Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsTestUser(page);
  });

  test('should display order details', async ({ page }) => {
    // Navigate to a specific order detail page
    // Note: You would need to replace 'order-123' with a real order ID
    await page.goto('/orders/order-123');
    
    // Check that the order details are displayed
    await expect(page.getByText('Order Details')).toBeVisible();
    
    // Check that the tabs are visible
    await expect(page.getByRole('tab', { name: 'Details' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Fulfillment' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'History' })).toBeVisible();
    
    // Check that the order items table is visible
    await expect(page.getByRole('table')).toBeVisible();
  });

  test('should fulfill an order', async ({ page }) => {
    // Navigate to a specific order detail page
    await page.goto('/orders/order-123');
    
    // Click the fulfill button
    await page.getByRole('button', { name: 'Fulfill Order' }).click();
    
    // Fill in the fulfillment form
    await page.getByLabel('Tracking Number').fill('TRK123456789');
    await page.getByLabel('Shipping Carrier').fill('Test Carrier');
    await page.getByLabel('Notes').fill('Test fulfillment notes');
    
    // Submit the form
    await page.getByRole('button', { name: 'Fulfill' }).click();
    
    // Check for success toast
    await expect(page.getByText('Order fulfilled successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should cancel an order', async ({ page }) => {
    // Navigate to a specific order detail page
    await page.goto('/orders/order-123');
    
    // Click the cancel button
    await page.getByRole('button', { name: 'Cancel Order' }).click();
    
    // Fill in the cancellation reason
    await page.getByLabel('Cancellation Reason').fill('Test cancellation reason');
    
    // Submit the form
    await page.getByRole('button', { name: 'Cancel Order' }).click();
    
    // Check for success toast
    await expect(page.getByText('Order cancelled successfully')).toBeVisible({ timeout: 5000 });
  });

  test('should view inventory allocations', async ({ page }) => {
    // Navigate to a specific order detail page
    await page.goto('/orders/order-123');
    
    // Click the fulfillment tab
    await page.getByRole('tab', { name: 'Fulfillment' }).click();
    
    // Check that the inventory allocations are displayed
    await expect(page.getByText('Inventory Allocations')).toBeVisible();
    
    // Check that the allocations table is visible
    await expect(page.getByRole('table')).toBeVisible();
  });
});

// Test the sync from Metakocka functionality
test.describe('Sync Orders from Metakocka', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsTestUser(page);
  });

  test('should check for unsynced orders', async ({ page }) => {
    // Navigate to the orders page
    await page.goto('/orders');
    
    // Find the sync from Metakocka button and click it
    const syncButton = page.getByRole('button', { name: 'Check Metakocka Orders' });
    await expect(syncButton).toBeVisible();
    
    // Click the sync button
    await syncButton.click();
    
    // Check for appropriate toast message
    // This could be either 'Found X unsynced orders' or 'All orders are synced'
    await expect(
      page.getByText(/Found \d+ unsynced orders|All orders are synced/)
    ).toBeVisible({ timeout: 5000 });
  });

  test('should sync orders from Metakocka', async ({ page }) => {
    // Navigate to the orders page
    await page.goto('/orders');
    
    // Find the sync from Metakocka button and click it to check for unsynced orders
    const checkButton = page.getByRole('button', { name: 'Check Metakocka Orders' });
    await checkButton.click();
    
    // Wait for the check to complete
    await page.waitForTimeout(1000);
    
    // If there are unsynced orders, click to sync them
    const syncButton = page.getByRole('button', { name: /Sync \d+ Orders from Metakocka/ });
    if (await syncButton.isVisible()) {
      await syncButton.click();
      
      // Check for success toast
      await expect(page.getByText('Orders synced successfully')).toBeVisible({ timeout: 5000 });
    }
  });
});
