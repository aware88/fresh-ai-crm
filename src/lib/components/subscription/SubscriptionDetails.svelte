<script>
  import { onMount } from 'svelte';
  import { getOrganizationSubscription } from '$lib/api/subscription-api';
  import { redirectToBillingPortal } from '$lib/api/stripe-api';
  import { getSubscriptionTier } from '$lib/utils/feature-flags';
  import BillingHistory from './BillingHistory.svelte';
  import FeatureFlagManager from './FeatureFlagManager.svelte';
  
  export let organizationId;
  export let onSubscriptionChange = () => {};
  export let isAdmin = false; // Only admins can override features
  
  let subscription = null;
  let loading = true;
  let error = null;
  let redirecting = false;
  
  onMount(async () => {
    await loadSubscription();
  });
  
  async function loadSubscription() {
    try {
      loading = true;
      subscription = await getOrganizationSubscription(organizationId);
      loading = false;
    } catch (err) {
      error = err.message;
      loading = false;
    }
  }
  
  function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  
  function getStatusClass(status) {
    switch (status) {
      case 'active': return 'status-active';
      case 'canceled': return 'status-canceled';
      case 'past_due': return 'status-past-due';
      case 'trial': return 'status-trial';
      case 'expired': return 'status-expired';
      default: return '';
    }
  }
  
  async function manageBilling() {
    try {
      redirecting = true;
      error = null;
      
      // Redirect to Stripe Billing Portal
      await redirectToBillingPortal(organizationId);
      
      // Note: The page will redirect to Stripe, so the code below won't execute
      // until the user returns from the billing portal
      
    } catch (err) {
      error = err.message;
      redirecting = false;
    }
  }
</script>

<div class="subscription-details">
  <h2>Subscription Details</h2>
  
  {#if loading}
    <div class="loading">Loading subscription details...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if !subscription}
    <div class="no-subscription">
      <p>No active subscription found for this organization.</p>
      <p>Select a subscription plan to get started.</p>
    </div>
  {:else}
    <div class="subscription-card">
      <div class="subscription-header">
        <h3>{subscription.subscription_plan?.name || 'Unknown Plan'}</h3>
        <div class="subscription-status {getStatusClass(subscription.status)}">
          {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
        </div>
      </div>
      
      <div class="subscription-info">
        <div class="info-row">
          <span class="label">Plan Type:</span>
          <span class="value">
            {subscription.subscription_plan ? 
              getSubscriptionTier(subscription.subscription_plan.features).charAt(0).toUpperCase() + 
              getSubscriptionTier(subscription.subscription_plan.features).slice(1) : 
              'Unknown'}
          </span>
        </div>
        
        <div class="info-row">
          <span class="label">Price:</span>
          <span class="value">
            {subscription.subscription_plan ? 
              `$${subscription.subscription_plan.price}/${subscription.subscription_plan.billing_interval}` : 
              'N/A'}
          </span>
        </div>
        
        <div class="info-row">
          <span class="label">Current Period:</span>
          <span class="value">
            {formatDate(subscription.current_period_start)} to {formatDate(subscription.current_period_end)}
          </span>
        </div>
        
        {#if subscription.cancel_at_period_end}
          <div class="info-row">
            <span class="label">Cancellation:</span>
            <span class="value canceling">Will cancel at period end</span>
          </div>
        {/if}
      </div>
      
      <div class="subscription-actions">
        <button class="manage-btn" on:click={manageBilling} disabled={redirecting}>
          {#if redirecting}
            Redirecting...
          {:else}
            Manage Billing
          {/if}
        </button>
      </div>
      
      {#if subscription && subscription.status !== 'canceled'}
        <BillingHistory {organizationId} />
        
        <!-- Feature Flag Manager -->
        <div class="feature-section">
          <FeatureFlagManager {organizationId} {isAdmin} />
        </div>
      {/if}
    </div>
  {/if}
</div>


<style>
  .subscription-details {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  h2 {
    margin-bottom: 2rem;
    font-size: 1.8rem;
    color: #333;
  }
  
  .loading, .error, .no-subscription {
    text-align: center;
    padding: 2rem;
    background: #f9f9f9;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .error {
    color: #d32f2f;
    background: #ffebee;
  }
  
  .subscription-card {
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    background: #fff;
  }
  
  .subscription-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #eee;
  }
  
  .subscription-header h3 {
    font-size: 1.5rem;
    margin: 0;
  }
  
  .subscription-status {
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: bold;
    font-size: 0.9rem;
  }
  
  .status-active {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .status-canceled {
    background-color: #ffebee;
    color: #c62828;
  }
  
  .status-past-due {
    background-color: #fff8e1;
    color: #ff8f00;
  }
  
  .status-trial {
    background-color: #e3f2fd;
    color: #1565c0;
  }
  
  .status-expired {
    background-color: #f5f5f5;
    color: #616161;
  }
  
  .subscription-info {
    margin-bottom: 1.5rem;
  }
  
  .info-row {
    display: flex;
    margin-bottom: 1rem;
  }
  
  .label {
    font-weight: bold;
    width: 150px;
  }
  
  .value {
    flex: 1;
  }
  
  .value.canceling {
    color: #c62828;
  }
  
  .subscription-actions {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
    display: flex;
    justify-content: flex-end;
  }
  
  .manage-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    background-color: #2196f3;
    color: white;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .manage-btn:hover {
    background-color: #1976d2;
  }
  
  .manage-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .modal {
    background-color: white;
    border-radius: 8px;
    padding: 2rem;
    width: 90%;
    max-width: 500px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .modal h3 {
    margin-top: 0;
    margin-bottom: 1rem;
  }
  
  .cancel-options {
    margin: 1.5rem 0;
  }
  
  .modal-actions {
    display: flex;
    justify-content: space-between;
    margin-top: 2rem;
  }
  
  .cancel-action-btn, .confirm-cancel-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .cancel-action-btn {
    background-color: #e0e0e0;
    color: #333;
  }
  
  .confirm-cancel-btn {
    background-color: #f44336;
    color: white;
  }
  
  .cancel-action-btn:hover {
    background-color: #bdbdbd;
  }
  
  .confirm-cancel-btn:hover {
    background-color: #d32f2f;
  }
  
  button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  .feature-section {
    margin-top: 2rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
  }
</style>
