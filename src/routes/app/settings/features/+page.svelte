<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { FEATURES, hasFeature } from '$lib/utils/feature-flags';
  import { getOrganizationSubscription } from '$lib/api/subscription-api';
  
  let organizationId = null;
  let subscription = null;
  let loading = true;
  let error = null;
  
  // Feature access status
  let featureStatus = {};
  
  // Group features by category
  const featureGroups = [
    {
      name: 'Core Features',
      features: [
        { key: FEATURES.CONTACTS_BASIC, name: 'Contact Management', description: 'Basic contact management capabilities' },
        { key: FEATURES.SALES_DOCUMENTS_BASIC, name: 'Sales Documents', description: 'Basic sales document management' },
        { key: FEATURES.PRODUCTS_BASIC, name: 'Product Management', description: 'Basic product catalog management' }
      ]
    },
    {
      name: 'Integration Features',
      features: [
        { key: FEATURES.METAKOCKA_INTEGRATION, name: 'Metakocka Integration', description: 'Sync data with Metakocka ERP system' },
        { key: FEATURES.BULK_OPERATIONS, name: 'Bulk Operations', description: 'Perform actions on multiple items at once' },
        { key: FEATURES.ADVANCED_REPORTING, name: 'Advanced Reporting', description: 'Generate detailed reports and analytics' }
      ]
    },
    {
      name: 'Premium Features',
      features: [
        { key: FEATURES.AI_AUTOMATION, name: 'AI Automation', description: 'AI-powered workflow automation' },
        { key: FEATURES.EMAIL_MARKETING, name: 'Email Marketing', description: 'Advanced email marketing campaigns' },
        { key: FEATURES.WHITE_LABEL, name: 'White Labeling', description: 'Custom branding options' },
        { key: FEATURES.API_ACCESS, name: 'API Access', description: 'Access to the CRM API for custom integrations' }
      ]
    }
  ];
  
  onMount(async () => {
    // Get organization ID from URL or user context
    organizationId = $page.params.organizationId || $page.data?.organization?.id;
    
    if (organizationId) {
      await loadSubscriptionAndFeatures();
    } else {
      loading = false;
      error = 'No organization selected';
    }
  });
  
  async function loadSubscriptionAndFeatures() {
    try {
      loading = true;
      error = null;
      
      // Load subscription details
      subscription = await getOrganizationSubscription(organizationId);
      
      // Check feature access for all features
      await Promise.all(
        featureGroups.flatMap(group => 
          group.features.map(async feature => {
            featureStatus[feature.key] = await hasFeature(organizationId, feature.key, true);
          })
        )
      );
      
      loading = false;
    } catch (err) {
      error = err.message || 'Failed to load feature information';
      loading = false;
    }
  }
  
  function handleUpgrade() {
    goto('/app/settings/subscription');
  }
</script>

<div class="features-page">
  <div class="page-header">
    <h1>Feature Access</h1>
    <p>View the features available in your current subscription plan</p>
  </div>
  
  {#if loading}
    <div class="loading">
      <div class="spinner"></div>
      <p>Loading feature information...</p>
    </div>
  {:else if error}
    <div class="error">
      <p>{error}</p>
      <button on:click={loadSubscriptionAndFeatures}>Retry</button>
    </div>
  {:else}
    <div class="subscription-info">
      <h2>Current Subscription</h2>
      {#if subscription}
        <div class="subscription-details">
          <p><strong>Plan:</strong> {subscription.subscription_plan?.name || 'No plan'}</p>
          <p><strong>Status:</strong> {subscription.status}</p>
          <button class="upgrade-btn" on:click={handleUpgrade}>Manage Subscription</button>
        </div>
      {:else}
        <div class="no-subscription">
          <p>You don't have an active subscription.</p>
          <button class="upgrade-btn" on:click={handleUpgrade}>Subscribe Now</button>
        </div>
      {/if}
    </div>
    
    <div class="features-container">
      {#each featureGroups as group}
        <div class="feature-group">
          <h3>{group.name}</h3>
          <div class="features-grid">
            {#each group.features as feature}
              <div class="feature-card {featureStatus[feature.key] ? 'available' : 'unavailable'}">
                <div class="feature-header">
                  <h4>{feature.name}</h4>
                  {#if featureStatus[feature.key]}
                    <span class="status available">Available</span>
                  {:else}
                    <span class="status unavailable">Upgrade Required</span>
                  {/if}
                </div>
                <p class="feature-description">{feature.description}</p>
                {#if !featureStatus[feature.key]}
                  <button class="upgrade-feature-btn" on:click={handleUpgrade}>Upgrade</button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .features-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .page-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .page-header h1 {
    font-size: 2.5rem;
    margin-bottom: 0.5rem;
    color: #333;
  }
  
  .page-header p {
    color: #666;
    font-size: 1.1rem;
  }
  
  .loading, .error {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }
  
  .spinner {
    border: 4px solid rgba(0, 0, 0, 0.1);
    border-radius: 50%;
    border-top: 4px solid #2196f3;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
    margin-bottom: 1rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  .error {
    color: #d32f2f;
  }
  
  .error button {
    margin-top: 1rem;
    padding: 0.5rem 1rem;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .subscription-info {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background-color: #f5f5f5;
    border-radius: 8px;
  }
  
  .subscription-info h2 {
    margin-top: 0;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  .subscription-details, .no-subscription {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  
  .subscription-details p {
    margin: 0;
    flex: 1;
    min-width: 200px;
  }
  
  .upgrade-btn {
    padding: 0.75rem 1.5rem;
    background-color: #2196f3;
    color: white;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .upgrade-btn:hover {
    background-color: #1976d2;
  }
  
  .features-container {
    display: flex;
    flex-direction: column;
    gap: 2rem;
  }
  
  .feature-group h3 {
    margin-top: 0;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #e0e0e0;
    font-size: 1.3rem;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .feature-card {
    border-radius: 8px;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    transition: transform 0.3s, box-shadow 0.3s;
  }
  
  .feature-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
  
  .feature-card.available {
    background-color: #e8f5e9;
    border-left: 4px solid #4caf50;
  }
  
  .feature-card.unavailable {
    background-color: #f5f5f5;
    border-left: 4px solid #9e9e9e;
  }
  
  .feature-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }
  
  .feature-header h4 {
    margin: 0;
    font-size: 1.1rem;
  }
  
  .status {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .status.available {
    background-color: #4caf50;
    color: white;
  }
  
  .status.unavailable {
    background-color: #9e9e9e;
    color: white;
  }
  
  .feature-description {
    margin-bottom: 1rem;
    color: #555;
  }
  
  .upgrade-feature-btn {
    padding: 0.5rem 1rem;
    background-color: #ff9800;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.3s;
  }
  
  .upgrade-feature-btn:hover {
    background-color: #f57c00;
  }
</style>
