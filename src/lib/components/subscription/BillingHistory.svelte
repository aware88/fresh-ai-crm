<script>
  import { onMount } from 'svelte';
  import { getBillingHistory } from '$lib/api/subscription-api';
  
  export let organizationId;
  
  let invoices = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    await loadBillingHistory();
  });
  
  async function loadBillingHistory() {
    try {
      loading = true;
      error = null;
      invoices = await getBillingHistory(organizationId);
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
  
  function formatCurrency(amount) {
    if (amount === undefined || amount === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100); // Stripe amounts are in cents
  }
</script>

<div class="billing-history">
  <h3>Billing History</h3>
  
  {#if loading}
    <div class="loading">Loading billing history...</div>
  {:else if error}
    <div class="error">{error}</div>
  {:else if invoices.length === 0}
    <div class="empty">No billing history available.</div>
  {:else}
    <div class="invoices-table-container">
      <table class="invoices-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {#each invoices as invoice}
            <tr>
              <td>{formatDate(invoice.created)}</td>
              <td>
                {invoice.description || `Invoice ${invoice.number}`}
              </td>
              <td>{formatCurrency(invoice.amount_paid)}</td>
              <td>
                <span class="status-badge {invoice.status}">
                  {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                </span>
              </td>
              <td>
                {#if invoice.invoice_pdf}
                  <a href={invoice.invoice_pdf} target="_blank" rel="noopener noreferrer" class="invoice-link">
                    View Invoice
                  </a>
                {:else}
                  <span class="no-pdf">No PDF</span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>

<style>
  .billing-history {
    margin-top: 2rem;
  }
  
  h3 {
    margin-bottom: 1rem;
    font-size: 1.3rem;
    color: #333;
  }
  
  .loading, .error, .empty {
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
  
  .invoices-table-container {
    overflow-x: auto;
    margin-top: 1rem;
  }
  
  .invoices-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
  }
  
  .invoices-table th, .invoices-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #eee;
  }
  
  .invoices-table th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
  
  .invoices-table tr:hover {
    background-color: #f9f9f9;
  }
  
  .status-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: bold;
  }
  
  .status-badge.paid {
    background-color: #e8f5e9;
    color: #2e7d32;
  }
  
  .status-badge.open {
    background-color: #e3f2fd;
    color: #1565c0;
  }
  
  .status-badge.uncollectible {
    background-color: #ffebee;
    color: #c62828;
  }
  
  .status-badge.void {
    background-color: #f5f5f5;
    color: #616161;
  }
  
  .invoice-link {
    color: #2196f3;
    text-decoration: none;
    font-weight: bold;
  }
  
  .invoice-link:hover {
    text-decoration: underline;
  }
  
  .no-pdf {
    color: #9e9e9e;
    font-style: italic;
  }
</style>
