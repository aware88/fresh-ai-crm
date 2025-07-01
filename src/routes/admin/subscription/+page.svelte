<script>
  import { onMount } from 'svelte';
  import { getSubscriptionPlans, createSubscriptionPlan, updateSubscriptionPlan, deleteSubscriptionPlan } from '$lib/api/admin-subscription-api';
  import { toast } from '$lib/utils/toast';
  import AdminLayout from '$lib/components/layouts/AdminLayout.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import Spinner from '$lib/components/ui/Spinner.svelte';
  import Modal from '$lib/components/ui/Modal.svelte';
  
  let plans = [];
  let loading = true;
  let error = null;
  
  // Form state
  let showPlanModal = false;
  let editingPlan = null;
  let formData = {
    name: '',
    description: '',
    price: 0,
    billing_interval: 'monthly',
    stripe_price_id: '',
    features: {}
  };
  let availableFeatures = [
    { key: 'metakocka_integration', label: 'Metakocka Integration' },
    { key: 'ai_document_processing', label: 'AI Document Processing' },
    { key: 'advanced_analytics', label: 'Advanced Analytics' },
    { key: 'email_integration', label: 'Email Integration' },
    { key: 'bulk_operations', label: 'Bulk Operations' },
    { key: 'custom_branding', label: 'Custom Branding' }
  ];
  let formSubmitting = false;
  
  onMount(async () => {
    await loadPlans();
  });
  
  async function loadPlans() {
    try {
      loading = true;
      error = null;
      const data = await getSubscriptionPlans();
      plans = data;
    } catch (err) {
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function openCreatePlanModal() {
    editingPlan = null;
    formData = {
      name: '',
      description: '',
      price: 0,
      billing_interval: 'monthly',
      stripe_price_id: '',
      features: {}
    };
    
    // Initialize features to false
    availableFeatures.forEach(feature => {
      formData.features[feature.key] = false;
    });
    
    showPlanModal = true;
  }
  
  function openEditPlanModal(plan) {
    editingPlan = plan;
    formData = {
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      billing_interval: plan.billing_interval,
      stripe_price_id: plan.stripe_price_id || '',
      features: { ...plan.features }
    };
    
    // Ensure all available features exist in the form data
    availableFeatures.forEach(feature => {
      if (formData.features[feature.key] === undefined) {
        formData.features[feature.key] = false;
      }
    });
    
    showPlanModal = true;
  }
  
  function closeModal() {
    showPlanModal = false;
    editingPlan = null;
  }
  
  async function handleSubmit() {
    try {
      formSubmitting = true;
      
      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, formData);
        toast.success('Subscription plan updated successfully');
      } else {
        await createSubscriptionPlan(formData);
        toast.success('Subscription plan created successfully');
      }
      
      closeModal();
      await loadPlans();
    } catch (err) {
      toast.error(`Error: ${err.message}`);
    } finally {
      formSubmitting = false;
    }
  }
  
  async function handleDeletePlan(plan) {
    if (confirm(`Are you sure you want to delete the ${plan.name} plan?`)) {
      try {
        await deleteSubscriptionPlan(plan.id);
        toast.success('Subscription plan deleted successfully');
        await loadPlans();
      } catch (err) {
        toast.error(`Error: ${err.message}`);
      }
    }
  }
  
  function formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  }
  
  function toggleFeature(featureKey) {
    formData.features[featureKey] = !formData.features[featureKey];
  }
</script>

<AdminLayout>
  <div class="subscription-plans-admin">
    <div class="header">
      <h1>Subscription Plans Management</h1>
      <Button on:click={openCreatePlanModal}>Create New Plan</Button>
    </div>
    
    {#if loading}
      <div class="loading">
        <Spinner size="large" />
        <p>Loading subscription plans...</p>
      </div>
    {:else if error}
      <div class="error">
        <p>Error loading subscription plans: {error}</p>
        <Button on:click={loadPlans}>Retry</Button>
      </div>
    {:else if plans.length === 0}
      <div class="empty-state">
        <p>No subscription plans found. Create your first plan to get started.</p>
        <Button on:click={openCreatePlanModal}>Create New Plan</Button>
      </div>
    {:else}
      <div class="plans-grid">
        {#each plans as plan}
          <div class="plan-card">
            <div class="plan-header">
              <h2>{plan.name}</h2>
              <span class="price">{formatPrice(plan.price)}/{plan.billing_interval}</span>
            </div>
            
            <div class="plan-description">
              <p>{plan.description || 'No description provided.'}</p>
            </div>
            
            <div class="plan-features">
              <h3>Features</h3>
              <ul>
                {#each availableFeatures as feature}
                  <li class={plan.features && plan.features[feature.key] ? 'included' : 'excluded'}>
                    {plan.features && plan.features[feature.key] ? '✓' : '✗'} {feature.label}
                  </li>
                {/each}
              </ul>
            </div>
            
            <div class="plan-stripe">
              <p><strong>Stripe Price ID:</strong> {plan.stripe_price_id || 'Not set'}</p>
            </div>
            
            <div class="plan-actions">
              <Button variant="secondary" on:click={() => openEditPlanModal(plan)}>Edit</Button>
              <Button variant="danger" on:click={() => handleDeletePlan(plan)}>Delete</Button>
            </div>
          </div>
        {/each}
      </div>
    {/if}
  </div>
  
  {#if showPlanModal}
    <Modal title={editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'} on:close={closeModal}>
      <form on:submit|preventDefault={handleSubmit}>
        <div class="form-group">
          <label for="name">Plan Name</label>
          <input 
            type="text" 
            id="name" 
            bind:value={formData.name} 
            required 
          />
        </div>
        
        <div class="form-group">
          <label for="description">Description</label>
          <textarea 
            id="description" 
            bind:value={formData.description} 
            rows="3"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="price">Price</label>
            <input 
              type="number" 
              id="price" 
              bind:value={formData.price} 
              min="0" 
              step="0.01" 
              required 
            />
          </div>
          
          <div class="form-group">
            <label for="billing_interval">Billing Interval</label>
            <select id="billing_interval" bind:value={formData.billing_interval}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>
        </div>
        
        <div class="form-group">
          <label for="stripe_price_id">Stripe Price ID</label>
          <input 
            type="text" 
            id="stripe_price_id" 
            bind:value={formData.stripe_price_id} 
            placeholder="e.g. price_1234567890" 
          />
        </div>
        
        <div class="form-group">
          <label>Features</label>
          <div class="features-list">
            {#each availableFeatures as feature}
              <div class="feature-item">
                <label>
                  <input 
                    type="checkbox" 
                    checked={formData.features[feature.key]} 
                    on:change={() => toggleFeature(feature.key)} 
                  />
                  {feature.label}
                </label>
              </div>
            {/each}
          </div>
        </div>
        
        <div class="modal-actions">
          <Button type="button" variant="secondary" on:click={closeModal} disabled={formSubmitting}>Cancel</Button>
          <Button type="submit" disabled={formSubmitting}>
            {#if formSubmitting}
              <Spinner size="small" />
              {editingPlan ? 'Updating...' : 'Creating...'}
            {:else}
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            {/if}
          </Button>
        </div>
      </form>
    </Modal>
  {/if}
</AdminLayout>

<style>
  .subscription-plans-admin {
    padding: 1rem;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
  
  .loading, .error, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    text-align: center;
  }
  
  .plans-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 1.5rem;
  }
  
  .plan-card {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    background-color: white;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .plan-header h2 {
    margin: 0;
    font-size: 1.25rem;
  }
  
  .price {
    font-weight: bold;
    font-size: 1.25rem;
    color: #2563eb;
  }
  
  .plan-description {
    margin-bottom: 1rem;
    color: #64748b;
  }
  
  .plan-features {
    margin-bottom: 1rem;
  }
  
  .plan-features h3 {
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1rem;
  }
  
  .plan-features ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
  }
  
  .plan-features li {
    padding: 0.25rem 0;
  }
  
  .plan-features li.included {
    color: #10b981;
  }
  
  .plan-features li.excluded {
    color: #9ca3af;
  }
  
  .plan-stripe {
    margin-bottom: 1rem;
    font-size: 0.875rem;
    color: #64748b;
  }
  
  .plan-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
    justify-content: flex-end;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }
  
  label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
  }
  
  input[type="text"],
  input[type="number"],
  textarea,
  select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.25rem;
    font-size: 1rem;
  }
  
  .features-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 0.5rem;
  }
  
  .feature-item label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    margin-top: 1.5rem;
  }
</style>
