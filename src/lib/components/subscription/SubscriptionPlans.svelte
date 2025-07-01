<script>
  import { onMount } from 'svelte';
  import { getSubscriptionPlans } from '$lib/api/subscription-api';
  import { getSubscriptionTier } from '$lib/utils/feature-flags';
  import { FEATURES } from '$lib/utils/feature-flags';
  
  export let selectedPlanId = null;
  export let onSelectPlan = (planId, stripePriceId = null) => {};
  
  let plans = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      plans = await getSubscriptionPlans();
      // Add Stripe price IDs to plans
      plans = plans.map(plan => ({
        ...plan,
        stripe_price_id: getStripePriceId(plan.id, plan.tier)
      }));
      loading = false;
    } catch (err) {
      error = err.message;
      loading = false;
    }
  });
  
  // Map plan IDs to Stripe price IDs
  function getStripePriceId(planId, tier) {
    // These would typically come from environment variables or database
    const stripePriceMap = {
      'free': 'price_free_monthly',
      'standard': 'price_standard_monthly',
      'premium': 'price_premium_monthly'
    };
    
    return stripePriceMap[tier] || stripePriceMap.standard;
  }
  
  function handleSelectPlan(planId, stripePriceId) {
    selectedPlanId = planId;
    onSelectPlan(planId, stripePriceId);
  }
  
  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
</script>

<div class="subscription-plans">
  <h2>Choose a Subscription Plan</h2>
  
  {#if loading}
    <div class="loading">Loading plans...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if plans.length === 0}
    <div class="empty">No subscription plans available</div>
  {:else}
    <div class="plans-container">
      {#each plans as plan}
        {@const tier = getSubscriptionTier(plan.features)}
        <div 
          class="plan-card {tier} {selectedPlanId === plan.id ? 'selected' : ''}"
          on:click={() => handleSelectPlan(plan.id, plan.stripe_price_id)}
        >
          <div class="plan-header">
            <h3>{plan.name}</h3>
            <div class="plan-price">
              <span class="amount">{formatPrice(plan.price)}</span>
              <span class="interval">/{plan.billing_interval}</span>
            </div>
          </div>
          
          <div class="plan-description">
            {plan.description || `${tier.charAt(0).toUpperCase() + tier.slice(1)} tier subscription plan`}
          </div>
          
          <div class="plan-features">
            <h4>Features</h4>
            <ul>
              {#if tier === 'free' || tier === 'standard' || tier === 'premium'}
                <li>Basic contact management</li>
                <li>Basic sales document management</li>
                <li>Basic product management</li>
              {/if}
              
              {#if tier === 'standard' || tier === 'premium'}
                <li>Metakocka integration</li>
                <li>Bulk operations</li>
                <li>Advanced reporting</li>
              {/if}
              
              {#if tier === 'premium'}
                <li>AI automation</li>
                <li>Email marketing</li>
                <li>White label options</li>
                <li>API access</li>
              {/if}
            </ul>
          </div>
          
          <button 
            class="select-plan-btn {tier}"
            class:selected={selectedPlanId === plan.id}
            on:click|stopPropagation={() => handleSelectPlan(plan.id, plan.stripe_price_id)}
          >
            {selectedPlanId === plan.id ? 'Selected' : 'Select Plan'}
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .subscription-plans {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  h2 {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 2rem;
    color: #333;
  }
  
  .loading, .error, .empty {
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
  
  .plans-container {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
  }
  
  .plan-card {
    border-radius: 8px;
    padding: 2rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
  }
  
  .plan-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  }
  
  .plan-card.selected {
    border: 2px solid #4caf50;
    box-shadow: 0 8px 15px rgba(76, 175, 80, 0.3);
  }
  
  .plan-card.free {
    background: linear-gradient(to bottom right, #f5f5f5, #e0e0e0);
  }
  
  .plan-card.standard {
    background: linear-gradient(to bottom right, #e3f2fd, #bbdefb);
  }
  
  .plan-card.premium {
    background: linear-gradient(to bottom right, #e8eaf6, #c5cae9);
  }
  
  .plan-header {
    margin-bottom: 1.5rem;
    text-align: center;
  }
  
  .plan-header h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }
  
  .plan-price {
    font-size: 1.2rem;
  }
  
  .plan-price .amount {
    font-size: 2rem;
    font-weight: bold;
  }
  
  .plan-description {
    margin-bottom: 1.5rem;
    flex-grow: 0;
  }
  
  .plan-features {
    flex-grow: 1;
    margin-bottom: 1.5rem;
  }
  
  .plan-features h4 {
    margin-bottom: 0.5rem;
    font-size: 1.1rem;
  }
  
  .plan-features ul {
    list-style-type: none;
    padding-left: 0;
  }
  
  .plan-features li {
    padding: 0.5rem 0;
    position: relative;
    padding-left: 1.5rem;
  }
  
  .plan-features li:before {
    content: '✓';
    position: absolute;
    left: 0;
    color: #4caf50;
  }
  
  .select-plan-btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 100%;
  }
  
  .select-plan-btn.free {
    background-color: #9e9e9e;
    color: white;
  }
  
  .select-plan-btn.standard {
    background-color: #2196f3;
    color: white;
  }
  
  .select-plan-btn.premium {
    background-color: #3f51b5;
    color: white;
  }
  
  .select-plan-btn:hover {
    opacity: 0.9;
  }
  
  .select-plan-btn.selected {
    background-color: #4caf50;
  }
</style>
