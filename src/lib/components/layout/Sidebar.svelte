<script>
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { hasFeature, FEATURES } from '$lib/utils/feature-flags';
  
  export let organization = null;
  
  let organizationId = null;
  let userRole = 'user';
  let metakockaEnabled = false;
  
  $: {
    if (organization) {
      organizationId = organization.id;
      // Check if user has admin role in this organization
      userRole = $page.data?.organizationRole || 'user';
      
      // Check if Metakocka integration is enabled for this organization
      checkMetakockaFeature();
    }
  }
  
  async function checkMetakockaFeature() {
    if (organizationId) {
      metakockaEnabled = await hasFeature(organizationId, FEATURES.METAKOCKA_INTEGRATION);
    }
  }
  
  function isActive(path) {
    return $page.url.pathname.startsWith(path);
  }
  
  function navigateTo(path) {
    goto(path);
  }
</script>

<aside class="sidebar">
  <div class="sidebar-header">
    <div class="logo">
      <img src="/logo.svg" alt="ARIS" />
      <span>ARIS</span>
    </div>
  </div>
  
  <nav class="sidebar-nav">
    <ul>
      <li class:active={isActive('/app/dashboard')}>
        <button on:click={() => navigateTo('/app/dashboard')}>
          <span class="icon">📊</span>
          <span>Dashboard</span>
        </button>
      </li>
      
      <li class:active={isActive('/app/contacts')}>
        <button on:click={() => navigateTo('/app/contacts')}>
          <span class="icon">👥</span>
          <span>Contacts</span>
        </button>
      </li>
      
      <li class:active={isActive('/app/products')}>
        <button on:click={() => navigateTo('/app/products')}>
          <span class="icon">📦</span>
          <span>Products</span>
        </button>
      </li>
      
      <li class:active={isActive('/app/sales')}>
        <button on:click={() => navigateTo('/app/sales')}>
          <span class="icon">💰</span>
          <span>Sales</span>
        </button>
      </li>
      
      <li class:active={isActive('/app/emails')}>
        <button on:click={() => navigateTo('/app/emails')}>
          <span class="icon">✉️</span>
          <span>Emails</span>
        </button>
      </li>
      
      {#if metakockaEnabled}
        <li class:active={isActive('/app/integrations/metakocka')}>
          <button on:click={() => navigateTo('/app/integrations/metakocka')}>
            <span class="icon">🔄</span>
            <span>Metakocka</span>
          </button>
        </li>
      {/if}
    </ul>
    
    <div class="sidebar-divider"></div>
    
    <ul>
      <li class:active={isActive('/app/settings')}>
        <button on:click={() => navigateTo('/app/settings')}>
          <span class="icon">⚙️</span>
          <span>Settings</span>
        </button>
      </li>
      
      {#if userRole === 'admin' || userRole === 'owner'}
        <li class:active={isActive('/app/settings/subscription')}>
          <button on:click={() => navigateTo('/app/settings/subscription')}>
            <span class="icon">💳</span>
            <span>Subscription</span>
          </button>
        </li>
      {/if}
      
      <li class:active={isActive('/app/settings/profile')}>
        <button on:click={() => navigateTo('/app/settings/profile')}>
          <span class="icon">👤</span>
          <span>Profile</span>
        </button>
      </li>
    </ul>
  </nav>
</aside>

<style>
  .sidebar {
    width: 250px;
    height: 100%;
    background-color: #f8f9fa;
    border-right: 1px solid #e9ecef;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
  }
  
  .sidebar-header {
    padding: 1.5rem 1rem;
    border-bottom: 1px solid #e9ecef;
  }
  
  .logo {
    display: flex;
    align-items: center;
    font-weight: bold;
    font-size: 1.2rem;
  }
  
  .logo img {
    height: 30px;
    margin-right: 0.5rem;
  }
  
  .sidebar-nav {
    padding: 1rem 0;
    flex: 1;
  }
  
  .sidebar-nav ul {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .sidebar-nav li {
    margin-bottom: 0.25rem;
  }
  
  .sidebar-nav li button {
    display: flex;
    align-items: center;
    width: 100%;
    padding: 0.75rem 1.5rem;
    border: none;
    background: none;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;
    color: #495057;
  }
  
  .sidebar-nav li button:hover {
    background-color: #e9ecef;
    color: #212529;
  }
  
  .sidebar-nav li.active button {
    background-color: #e9ecef;
    color: #212529;
    font-weight: 500;
    border-left: 3px solid #2196f3;
  }
  
  .icon {
    margin-right: 0.75rem;
    font-size: 1.2rem;
    width: 24px;
    text-align: center;
  }
  
  .sidebar-divider {
    height: 1px;
    background-color: #e9ecef;
    margin: 1rem 0;
  }
</style>
