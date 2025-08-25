#!/usr/bin/env node

/**
 * Update Organization Name Script
 * 
 * This script helps update the organization name in the database
 * Run this in the browser console as an admin user
 */

console.log('🏢 Organization Name Update Helper');
console.log('');

// Function to update organization name
async function updateOrganizationName(organizationId, newName, newSlug) {
  try {
    console.log(`🔄 Updating organization ${organizationId} to "${newName}" (${newSlug})`);
    
    const response = await fetch(`/api/admin/organizations/${organizationId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        name: newName, 
        slug: newSlug 
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update organization');
    }

    const data = await response.json();
    console.log('✅ Organization updated successfully:', data);
    
    // Clear localStorage to remove cached data
    localStorage.removeItem('organization-branding');
    localStorage.removeItem('companyName');
    localStorage.removeItem('user-preferences');
    
    console.log('🔄 Cleared cached data. Please refresh the page.');
    return data;
    
  } catch (error) {
    console.error('❌ Error updating organization:', error);
    throw error;
  }
}

// Function to get current organization info
async function getCurrentOrganization() {
  try {
    // Get user preferences to find current organization ID
    const prefsResponse = await fetch('/api/user/preferences');
    const prefs = await prefsResponse.json();
    
    if (prefs.current_organization_id) {
      const orgResponse = await fetch(`/api/admin/organizations/${prefs.current_organization_id}`);
      const orgData = await orgResponse.json();
      
      console.log('📋 Current Organization:', {
        id: orgData.organization.id,
        name: orgData.organization.name,
        slug: orgData.organization.slug
      });
      
      return orgData.organization;
    } else {
      console.log('❌ No current organization found in user preferences');
      return null;
    }
  } catch (error) {
    console.error('❌ Error fetching current organization:', error);
    return null;
  }
}

// Instructions
console.log(`
📋 To update the organization name:

1. First, check current organization:
   getCurrentOrganization()

2. Then update it (example):
   updateOrganizationName('577485fb-50b4-4bb2-a4c6-54b97e1545ad', 'Your Company Name', 'your-company-slug')

3. Or to remove the name entirely (use ARIS default):
   updateOrganizationName('577485fb-50b4-4bb2-a4c6-54b97e1545ad', '', 'your-company-slug')

Note: You must be logged in as an admin user to use these functions.
`);

// Make functions globally available
window.updateOrganizationName = updateOrganizationName;
window.getCurrentOrganization = getCurrentOrganization;
