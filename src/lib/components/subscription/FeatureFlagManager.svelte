<script>
  import { onMount } from 'svelte';
  import { FEATURES, hasFeature, clearFeatureCache } from '$lib/utils/feature-flags';
  
  export let organizationId;
  export let isAdmin = false; // Only admins can override features
  
  let features = [];
  let loading = true;
  let error = null;
  let overrides = {};
  let saving = false;
  let saveSuccess = false;
  let saveError = null;
  
  // Group features by tier
  const featureGroups = {
    basic: [
      { key: FEATURES.CONTACTS_BASIC, name: 'Contacts Basic', description: 'Basic contact management' },
      { key: FEATURES.SALES_DOCUMENTS_BASIC, name: 'Sales Documents Basic', description: 'Basic sales document management' },
      { key: FEATURES.PRODUCTS_BASIC, name: 'Products Basic', description: 'Basic product management' }
    ],
    standard: [
      { key: FEATURES.METAKOCKA_INTEGRATION, name: 'Metakocka Integration', description: 'Integration with Metakocka ERP' },
      { key: FEATURES.BULK_OPERATIONS, name: 'Bulk Operations', description: 'Perform operations on multiple items at once' },
      { key: FEATURES.ADVANCED_REPORTING, name: 'Advanced Reporting', description: 'Access to advanced reports and analytics' }
    ],
    premium: [
      { key: FEATURES.AI_AUTOMATION, name: 'AI Automation', description: 'AI-powered automation features' },
      { key: FEATURES.EMAIL_MARKETING, name: 'Email Marketing', description: 'Advanced email marketing capabilities' },
      { key: FEATURES.WHITE_LABEL, name: 'White Label', description: 'Remove Fresh AI CRM branding' },
      { key: FEATURES.API_ACCESS, name: 'API Access', description: 'Access to the Fresh AI CRM API' }
    ]
  };
  
  // Flatten all features for easier access
  const allFeatures = [
    ...featureGroups.basic,
    ...featureGroups.standard,
    ...featureGroups.premium
  ];
  
  onMount(async () => {
    await loadFeatureAccess();
  });
  
  async function loadFeatureAccess() {
    try {
      loading = true;
      error = null;
      
      // Check access for all features
      const featurePromises = allFeatures.map(async (feature) => {
        const hasAccess = await hasFeature(organizationId, feature.key, true);
        return {
          ...feature,
          hasAccess
        };
      });
      
      features = await Promise.all(featurePromises);
      loading = false;
    } catch (err) {
      console.error('Error loading feature access:', err);
      error = 'Failed to load feature access. Please try again.';
      loading = false;
    }
  }
  
  async function saveOverrides() {
    if (!isAdmin || Object.keys(overrides).length === 0) return;
    
    try {
      saving = true;
      saveError = null;
      saveSuccess = false;
      
      // Call API to save overrides
      const response = await fetch(`/api/organizations/${organizationId}/subscription/features/override`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ overrides })
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save feature overrides');
      }
      
      // Clear cache and reload features
      clearFeatureCache(organizationId);
      await loadFeatureAccess();
      
      // Reset overrides and show success
      overrides = {};
      saveSuccess = true;
      saving = false;
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        saveSuccess = false;
      }, 3000);
    } catch (err) {
      console.error('Error saving feature overrides:', err);
      saveError = err.message;
      saving = false;
    }
  }
  
  function toggleOverride(feature) {
    if (!isAdmin) return;
    
    // Toggle the override for this feature
    overrides[feature.key] = !feature.hasAccess;
    
    // If we're setting it back to the default, remove the override
    if (overrides[feature.key] === feature.hasAccess) {
      delete overrides[feature.key];
    }
  }
</script>

<div class="feature-flag-manager">
  <h3>Feature Access</h3>
  
  {#if loading}
    <div class="loading">Loading feature access...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else}
    <div class="feature-groups">
      <!-- Basic Features -->
      <div class="feature-group">
        <h4>Basic Features</h4>
        <div class="features-list">
          {#each featureGroups.basic as featureConfig}
            {@const feature = features.find(f => f.key === featureConfig.key)}
            {#if feature}
              <div class="feature-item">
                <div class="feature-info">
                  <span class="feature-name">{feature.name}</span>
                  <span class="feature-description">{feature.description}</span>
                </div>
                <div class="feature-status">
                  <span class="status-indicator {feature.hasAccess ? 'enabled' : 'disabled'}">
                    {feature.hasAccess ? 'Enabled' : 'Disabled'}
                  </span>
                  
                  {#if isAdmin}
                    <button 
                      class="override-button {overrides[feature.key] !== undefined ? 'active' : ''}"
                      on:click={() => toggleOverride(feature)}
                    >
                      {overrides[feature.key] ? 'Enable' : overrides[feature.key] === false ? 'Disable' : 'Override'}
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
      
      <!-- Standard Features -->
      <div class="feature-group">
        <h4>Standard Features</h4>
        <div class="features-list">
          {#each featureGroups.standard as featureConfig}
            {@const feature = features.find(f => f.key === featureConfig.key)}
            {#if feature}
              <div class="feature-item">
                <div class="feature-info">
                  <span class="feature-name">{feature.name}</span>
                  <span class="feature-description">{feature.description}</span>
                </div>
                <div class="feature-status">
                  <span class="status-indicator {feature.hasAccess ? 'enabled' : 'disabled'}">
                    {feature.hasAccess ? 'Enabled' : 'Disabled'}
                  </span>
                  
                  {#if isAdmin}
                    <button 
                      class="override-button {overrides[feature.key] !== undefined ? 'active' : ''}"
                      on:click={() => toggleOverride(feature)}
                    >
                      {overrides[feature.key] ? 'Enable' : overrides[feature.key] === false ? 'Disable' : 'Override'}
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
      
      <!-- Premium Features -->
      <div class="feature-group">
        <h4>Premium Features</h4>
        <div class="features-list">
          {#each featureGroups.premium as featureConfig}
            {@const feature = features.find(f => f.key === featureConfig.key)}
            {#if feature}
              <div class="feature-item">
                <div class="feature-info">
                  <span class="feature-name">{feature.name}</span>
                  <span class="feature-description">{feature.description}</span>
                </div>
                <div class="feature-status">
                  <span class="status-indicator {feature.hasAccess ? 'enabled' : 'disabled'}">
                    {feature.hasAccess ? 'Enabled' : 'Disabled'}
                  </span>
                  
                  {#if isAdmin}
                    <button 
                      class="override-button {overrides[feature.key] !== undefined ? 'active' : ''}"
                      on:click={() => toggleOverride(feature)}
                    >
                      {overrides[feature.key] ? 'Enable' : overrides[feature.key] === false ? 'Disable' : 'Override'}
                    </button>
                  {/if}
                </div>
              </div>
            {/if}
          {/each}
        </div>
      </div>
    </div>
    
    {#if isAdmin && Object.keys(overrides).length > 0}
      <div class="override-actions">
        <button class="save-button" on:click={saveOverrides} disabled={saving}>
          {saving ? 'Saving...' : 'Save Overrides'}
        </button>
        <button class="cancel-button" on:click={() => overrides = {}} disabled={saving}>
          Cancel
        </button>
      </div>
    {/if}
    
    {#if saveSuccess}
      <div class="success-message">Feature overrides saved successfully!</div>
    {/if}
    
    {#if saveError}
      <div class="error-message">{saveError}</div>
    {/if}
  {/if}
</div>

<style>
  .feature-flag-manager {
    width: 100%;
    margin-top: 2rem;
  }
  
  h3 {
    margin-bottom: 1.5rem;
    font-size: 1.3rem;
    color: #333;
  }
  
  h4 {
    margin-bottom: 1rem;
    font-size: 1.1rem;
    color: #555;
  }
  
  .loading, .error {
    text-align: center;
    padding: 1.5rem;
    background: #f9f9f9;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .error {
    color: #d32f2f;
    background: #ffebee;
  }
  
  .feature-groups {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .feature-group {
    background: #f9f9f9;
    border-radius: 8px;
    padding: 1.5rem;
  }
  
  .features-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .feature-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: white;
    border-radius: 6px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .feature-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .feature-name {
    font-weight: bold;
    color: #333;
  }
  
  .feature-description {
    font-size: 0.9rem;
    color: #666;
  }
  
  .feature-status {
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .status-indicator {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .status-indicator.enabled {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .status-indicator.disabled {
    background-color: #f5f5f5;
    color: #616161;
  }
  
  .override-button {
    padding: 0.25rem 0.75rem;
    border-radius: 4px;
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
    cursor: pointer;
    font-size: 0.8rem;
    transition: all 0.2s;
  }
  
  .override-button:hover {
    background-color: #e0e0e0;
  }
  
  .override-button.active {
    background-color: #bbdefb;
    border-color: #64b5f6;
    color: #1565c0;
  }
  
  .override-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .save-button, .cancel-button {
    padding: 0.5rem 1rem;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
    transition: all 0.2s;
  }
  
  .save-button {
    background-color: #1976d2;
    color: white;
    border: none;
  }
  
  .save-button:hover:not(:disabled) {
    background-color: #1565c0;
  }
  
  .cancel-button {
    background-color: #f5f5f5;
    color: #333;
    border: 1px solid #ddd;
  }
  
  .cancel-button:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
  
  button:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .success-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #e8f5e9;
    color: #2e7d32;
    border-radius: 4px;
    text-align: center;
  }
  
  .error-message {
    margin-top: 1rem;
    padding: 0.75rem;
    background-color: #ffebee;
    color: #c62828;
    border-radius: 4px;
    text-align: center;
  }
</style>
