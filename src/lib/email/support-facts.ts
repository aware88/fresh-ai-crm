import { MetakockaAIIntegrationService } from '@/lib/integrations/metakocka/metakocka-ai-integration';

export interface SupportFactsInput {
  organizationId: string | null;
  senderEmail?: string;
  subject?: string;
  body: string;
}

export interface SupportFactsResult {
  hasFacts: boolean;
  orders?: any[];
  shipments?: any[];
  inventory?: any[];
  billing?: any;
  extracted?: Record<string, string>;
}

export async function getSupportFacts(input: SupportFactsInput): Promise<SupportFactsResult> {
  const { organizationId, senderEmail = '', subject = '', body } = input;
  const content = `${subject} ${body}`.toLowerCase();

  const extracted = extractDataFromContent(content);

  // If no org available or no ERP connected, return gracefully
  if (!organizationId) {
    return { hasFacts: false, extracted };
  }

  // Try Metakocka first if available; service handles missing data gracefully
  const mkService = new MetakockaAIIntegrationService();

  const facts: SupportFactsResult = { hasFacts: false, extracted };

  try {
    // Customer context
    let customer = null as any;
    if (senderEmail) {
      customer = await mkService.getCustomerForAI(organizationId, senderEmail);
    }

    // Shipments
    let shipment = null as any;
    if (extracted.trackingNumber) {
      shipment = await mkService.getShipmentTrackingForAI(organizationId, extracted.trackingNumber);
    } else if (extracted.orderNumber) {
      shipment = await mkService.getShipmentTrackingForAI(organizationId, extracted.orderNumber);
    }

    if (shipment) {
      facts.shipments = [shipment];
      facts.hasFacts = true;
    }

    // Orders (limited), via customer when present
    if (customer?.orderHistory?.lastOrderDate) {
      // We only have summary in AI customer; still useful to show something
      facts.orders = [{
        customerId: customer.id,
        totalOrders: customer.orderHistory.totalOrders,
        lastOrderDate: customer.orderHistory.lastOrderDate,
        totalSpent: customer.orderHistory.totalSpent,
      }];
      facts.hasFacts = true;
    }

    // Inventory/product lookup
    const searchTerm = extracted.productCode || extracted.productName;
    if (searchTerm) {
      const products = await mkService.searchProductsForAI(organizationId, { searchTerm, inStockOnly: false });
      if (products && products.length > 0) {
        facts.inventory = products.slice(0, 3);
        facts.hasFacts = true;
      }
    }

    // Billing signal (placeholder from customer context)
    if (customer) {
      facts.billing = {
        recentActivity: customer.communication?.lastContact,
        totalOrders: customer.orderHistory?.totalOrders,
      };
      facts.hasFacts = facts.hasFacts || !!facts.billing;
    }
  } catch (_e) {
    // Swallow integration errors and return no facts
    return { hasFacts: false, extracted };
  }

  return facts;
}

export function stringifySupportFactsForPrompt(facts: SupportFactsResult): string {
  if (!facts.hasFacts) return '';
  const lines: string[] = [];
  if (facts.shipments?.length) {
    const s = facts.shipments[0];
    lines.push(`Shipment: tracking ${s?.trackingNumber || 'N/A'}, status ${s?.status || 'unknown'}, carrier ${s?.carrier || 'N/A'}, eta ${s?.estimatedDelivery || 'N/A'}`);
  }
  if (facts.orders?.length) {
    const o = facts.orders[0];
    lines.push(`Orders: total ${o.totalOrders}, last order date ${o.lastOrderDate || 'N/A'}`);
  }
  if (facts.inventory?.length) {
    const p = facts.inventory[0];
    lines.push(`Product: ${p?.name} — ${p?.availability?.available ?? 0} available at ${p?.price} ${p?.currency}`);
  }
  if (facts.billing) {
    lines.push(`Billing: total orders ${facts.billing.totalOrders ?? 'N/A'}`);
  }
  return lines.join('\n');
}

function extractDataFromContent(content: string): Record<string, string> {
  const patterns: Record<string, RegExp> = {
    orderNumber: /(?:order|naročilo|bestellung|ordine|pedido)[\s#:]*([a-z0-9\-]+)/i,
    trackingNumber: /(?:tracking|sledenje|verfolgung|tracciamento|seguimiento)[\s#:]*([a-z0-9\-]+)/i,
    productCode: /(?:code|sku|artikel|prodotto|izdelek)[\s#:]*([a-z0-9\-]+)/i,
  };
  const out: Record<string, string> = {};
  for (const [key, rx] of Object.entries(patterns)) {
    const m = content.match(rx);
    if (m && m[1]) out[key] = m[1];
  }
  // Product name heuristic
  const nameRx = /(?:have|stock|na zalogi|availability|ali imate|hab(en|t) sie|avete)\s+([^\n\.?]{3,60})/i;
  const mName = content.match(nameRx);
  if (mName && mName[1]) out.productName = mName[1].trim();
  return out;
}




