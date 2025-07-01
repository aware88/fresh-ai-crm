<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { redirectToCheckout } from '$lib/api/stripe-api';
  import SubscriptionPlans from '$lib/components/subscription/SubscriptionPlans.svelte';
  import SubscriptionDetails from '$lib/components/subscription/SubscriptionDetails.svelte';
  import { clearFeatureCache } from '$lib/utils/feature-flags';
  
  let organizationId = null;
  let selectedPlanId = null;
  let stripePriceId = null;
  let showPlans = false;
  let processing = false;
  let error = null;
  let success = null;
  
  // Check for success or cancel query params from Stripe redirect
  let isSuccess = false;
  let isCancel = false;
  
  onMount(() => {
    // Get organization ID from URL or user context
    organizationId = $page.params.organizationId || $page.data?.organization?.id;
    
    // Check for success or cancel query params
    const url = new URL(window.location.href);
    isSuccess = url.searchParams.has('success');
    isCancel = url.searchParams.has('cancel');
    
    if (isSuccess) {
      success = 'Subscription updated successfully!';
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (isCancel) {
      error = 'Subscription process was canceled.';
      // Clear the URL params
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  });
  
  function togglePlans() {
    showPlans = !showPlans;
    if (!showPlans) {
      selectedPlanId = null;
      stripePriceId = null;
    }
  }
  
  function handleSelectPlan(planId, priceId) {
    selectedPlanId = planId;
    stripePriceId = priceId;
  }
  
  async function handleSubscribe() {
    if (!selectedPlanId || !stripePriceId || !organizationId) {
      error = 'Please select a subscription plan';
      return;
    }
    
    try {
      processing = true;
      error = null;
      success = null;
      
      // Redirect to Stripe Checkout
      await redirectToCheckout(organizationId, stripePriceId);
      
      // Note: The page will redirect to Stripe, so the code below won't execute
      // until the user returns from Stripe checkout
      
    } catch (err) {
      error = err.message || 'Failed to redirect to checkout';
      processing = false;
    }
  }
  
  function handleSubscriptionChange() {
    // Clear feature access cache when subscription changes
    clearFeatureCache(organizationId);
  }
</script>

<div class="subscription-page">
  <div class="page-header">
    <h1>Subscription Management</h1>
    <p>Manage your organization's subscription plan and billing details</p>
  </div>
  
  {#if error}
    <div class="alert error">
      <span class="alert-icon">⚠️</span>
      <span>{error}</span>
      <button class="close-btn" on:click={() => error = null}>×</button>
    </div>
  {/if}
  
  {#if success}
    <div class="alert success">
      <span class="alert-icon">✓</span>
      <span>{success}</span>
      <button class="close-btn" on:click={() => success = null}>×</button>
    </div>
  {/if}
  
  {#if organizationId}
    <div class="current-subscription-section">
      <SubscriptionDetails 
        {organizationId} 
        onSubscriptionChange={handleSubscriptionChange} 
      />
      
      <div class="action-buttons">
        <button class="change-plan-btn" on:click={togglePlans}>
          {showPlans ? 'Hide Plans' : 'Change Subscription Plan'}
        </button>
      </div>
    </div>
    
    {#if showPlans}
      <div class="subscription-plans-section">
        <SubscriptionPlans 
          selectedPlanId={selectedPlanId} 
          onSelectPlan={(planId, priceId) => handleSelectPlan(planId, priceId)} 
        />
        
        {#if selectedPlanId}
          <div class="subscription-action">
            <button 
              class="subscribe-btn" 
              on:click={handleSubscribe} 
              disabled={processing || !selectedPlanId}
            >
              {processing ? 'Processing...' : 'Confirm Subscription Change'}
            </button>
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    <div class="no-organization">
      <p>No organization selected. Please select an organization to manage subscriptions.</p>
    </div>
  {/if}
</div>

<style>
  .subscription-page {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .page-header {
    margin-bottom: 2rem;
    text-align: center;
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
  
  .alert {
    padding: 1rem;
    border-radius: 4px;
    margin-bottom: 1.5rem;
    display: flex;
    align-items: center;
  }
  
  .alert.error {
    background-color: #ffebee;
    color: #c62828;
  }
  
  .alert.success {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .alert-icon {
    margin-right: 0.5rem;
    font-size: 1.2rem;
  }
  
  .close-btn {
    margin-left: auto;
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: inherit;
    padding: 0 0.5rem;
  }
  
  .current-subscription-section {
    margin-bottom: 2rem;
  }
  
  .action-buttons {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .change-plan-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    background-color: #2196f3;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .change-plan-btn:hover {
    background-color: #1976d2;
  }
  
  .subscription-plans-section {
    margin-top: 3rem;
    border-top: 1px solid #eee;
    padding-top: 2rem;
  }
  
  .subscription-action {
    display: flex;
    justify-content: center;
    margin-top: 2rem;
  }
  
  .subscribe-btn {
    padding: 1rem 2rem;
    border: none;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    font-weight: bold;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .subscribe-btn:hover {
    background-color: #388e3c;
  }
  
  .subscribe-btn:disabled {
    background-color: #9e9e9e;
    cursor: not-allowed;
  }
  
  .no-organization {
    text-align: center;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
  }
</style>
