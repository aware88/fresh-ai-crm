import { EmailAgent } from './email-agent';
import { ProductAgent } from './product-agent';
import { CustomerAgent } from './customer-agent';
import { SalesAgent } from './sales-agent';
import { MultiAgentOrchestrator } from './multi-agent-orchestrator';
import { PredictiveIntelligence } from './predictive-intelligence';

// Integration Service Types
export interface ServiceIntegration {
  id: string;
  name: string;
  type: 'email' | 'database' | 'api' | 'webhook' | 'file' | 'crm';
  status: 'active' | 'inactive' | 'error' | 'pending';
  config: IntegrationConfig;
  lastSync: Date;
  syncFrequency: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  errorCount: number;
  successCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IntegrationConfig {
  endpoint?: string;
  apiKey?: string;
  credentials?: Record<string, string>;
  mappings: FieldMapping[];
  filters?: IntegrationFilter[];
  transformations?: DataTransformation[];
  webhookUrl?: string;
  retryPolicy?: RetryPolicy;
}

export interface FieldMapping {
  sourceField: string;
  targetField: string;
  dataType: 'string' | 'number' | 'date' | 'boolean' | 'object' | 'array';
  required: boolean;
  defaultValue?: any;
  transformation?: string;
}

export interface IntegrationFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'nin' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
}

export interface DataTransformation {
  type: 'format' | 'calculate' | 'lookup' | 'aggregate' | 'validate';
  field: string;
  expression: string;
  parameters?: Record<string, any>;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  baseDelay: number;
  maxDelay: number;
}

export interface SyncResult {
  id: string;
  integrationId: string;
  startTime: Date;
  endTime: Date;
  status: 'success' | 'partial' | 'failed';
  recordsProcessed: number;
  recordsSuccess: number;
  recordsError: number;
  errors: SyncError[];
  summary: Record<string, any>;
}

export interface SyncError {
  recordId?: string;
  field?: string;
  message: string;
  code?: string;
  timestamp: Date;
}

export interface DatabaseConnection {
  id: string;
  name: string;
  type: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'redis';
  connectionString: string;
  isConnected: boolean;
  lastHealthCheck: Date;
  queryCount: number;
  errorCount: number;
}

export interface EmailServiceConfig {
  provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'outlook';
  settings: {
    host?: string;
    port?: number;
    secure?: boolean;
    auth?: {
      user: string;
      pass: string;
    };
    apiKey?: string;
    domain?: string;
  };
  templates: EmailTemplate[];
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  textContent: string;
  variables: string[];
  category: 'welcome' | 'followup' | 'support' | 'marketing' | 'notification';
}

export interface MetakockaConfig {
  apiUrl: string;
  apiKey: string;
  companyId: string;
  syncEnabled: boolean;
  syncInterval: number;
  lastSync: Date;
  productMappings: Record<string, string>;
  customerMappings: Record<string, string>;
}

export class IntegrationServices {
  private integrations: Map<string, ServiceIntegration> = new Map();
  private syncResults: Map<string, SyncResult> = new Map();
  private databaseConnections: Map<string, DatabaseConnection> = new Map();
  private emailConfig: EmailServiceConfig | null = null;
  private metakockaConfig: MetakockaConfig | null = null;

  private emailAgent: EmailAgent;
  private productAgent: ProductAgent;
  private customerAgent: CustomerAgent;
  private salesAgent: SalesAgent;
  private orchestrator: MultiAgentOrchestrator;
  private predictiveIntelligence: PredictiveIntelligence;

  constructor(
    emailAgent: EmailAgent,
    productAgent: ProductAgent,
    customerAgent: CustomerAgent,
    salesAgent: SalesAgent,
    orchestrator: MultiAgentOrchestrator,
    predictiveIntelligence: PredictiveIntelligence
  ) {
    this.emailAgent = emailAgent;
    this.productAgent = productAgent;
    this.customerAgent = customerAgent;
    this.salesAgent = salesAgent;
    this.orchestrator = orchestrator;
    this.predictiveIntelligence = predictiveIntelligence;

    this.initializeDefaultIntegrations();
  }

  // Integration Management
  async createIntegration(integration: Omit<ServiceIntegration, 'id' | 'createdAt' | 'updatedAt' | 'lastSync' | 'errorCount' | 'successCount'>): Promise<string> {
    const id = `integration-${Date.now()}`;
    const newIntegration: ServiceIntegration = {
      id,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSync: new Date(0),
      errorCount: 0,
      successCount: 0,
      ...integration
    };

    this.integrations.set(id, newIntegration);
    
    // Initialize the integration
    await this.initializeIntegration(id);
    
    return id;
  }

  async updateIntegration(id: string, updates: Partial<ServiceIntegration>): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    Object.assign(integration, updates, { updatedAt: new Date() });
    this.integrations.set(id, integration);
    
    return true;
  }

  async deleteIntegration(id: string): Promise<boolean> {
    const integration = this.integrations.get(id);
    if (!integration) return false;

    // Cleanup integration
    await this.cleanupIntegration(id);
    
    return this.integrations.delete(id);
  }

  private async initializeIntegration(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) return;

    try {
      switch (integration.type) {
        case 'email':
          await this.initializeEmailIntegration(integration);
          break;
        case 'database':
          await this.initializeDatabaseIntegration(integration);
          break;
        case 'api':
          await this.initializeApiIntegration(integration);
          break;
        case 'webhook':
          await this.initializeWebhookIntegration(integration);
          break;
        case 'crm':
          await this.initializeCrmIntegration(integration);
          break;
      }

      integration.status = 'active';
      integration.updatedAt = new Date();
    } catch (error) {
      integration.status = 'error';
      integration.errorCount++;
      console.error(`Failed to initialize integration ${id}:`, error);
    }
  }

  private async cleanupIntegration(id: string): Promise<void> {
    const integration = this.integrations.get(id);
    if (!integration) return;

    // Cleanup based on integration type
    switch (integration.type) {
      case 'database':
        await this.cleanupDatabaseIntegration(integration);
        break;
      case 'webhook':
        await this.cleanupWebhookIntegration(integration);
        break;
    }
  }

  // Email Integration
  private async initializeEmailIntegration(integration: ServiceIntegration): Promise<void> {
    const config = integration.config;
    
    // Configure email service
    this.emailConfig = {
      provider: config.credentials?.provider as any || 'smtp',
      settings: {
        host: config.credentials?.host,
        port: parseInt(config.credentials?.port || '587'),
        secure: config.credentials?.secure === 'true',
        auth: {
          user: config.credentials?.user || '',
          pass: config.credentials?.pass || ''
        },
        apiKey: config.credentials?.apiKey
      },
      templates: this.getDefaultEmailTemplates()
    };

    // Test connection
    await this.testEmailConnection();
  }

  private async testEmailConnection(): Promise<boolean> {
    if (!this.emailConfig) return false;

    try {
      // Mock email connection test
      console.log('Testing email connection...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Email connection successful');
      return true;
    } catch (error) {
      console.error('Email connection failed:', error);
      return false;
    }
  }

  private getDefaultEmailTemplates(): EmailTemplate[] {
    return [
      {
        id: 'welcome',
        name: 'Welcome Email',
        subject: 'Welcome to {{companyName}}!',
        htmlContent: `
          <h1>Welcome {{customerName}}!</h1>
          <p>We're excited to have you on board. Here's what you can expect:</p>
          <ul>
            <li>24/7 customer support</li>
            <li>Comprehensive training resources</li>
            <li>Regular product updates</li>
          </ul>
          <p>Best regards,<br>The {{companyName}} Team</p>
        `,
        textContent: `Welcome {{customerName}}! We're excited to have you on board...`,
        variables: ['customerName', 'companyName'],
        category: 'welcome'
      },
      {
        id: 'followup',
        name: 'Follow-up Email',
        subject: 'Following up on your inquiry',
        htmlContent: `
          <h1>Hi {{customerName}},</h1>
          <p>I wanted to follow up on your recent inquiry about {{productName}}.</p>
          <p>{{personalizedMessage}}</p>
          <p>Would you like to schedule a call to discuss this further?</p>
          <p>Best regards,<br>{{senderName}}</p>
        `,
        textContent: `Hi {{customerName}}, I wanted to follow up on your recent inquiry...`,
        variables: ['customerName', 'productName', 'personalizedMessage', 'senderName'],
        category: 'followup'
      },
      {
        id: 'support',
        name: 'Support Response',
        subject: 'Re: {{originalSubject}}',
        htmlContent: `
          <h1>Hi {{customerName}},</h1>
          <p>Thank you for contacting our support team.</p>
          <p>{{supportResponse}}</p>
          <p>If you need further assistance, please don't hesitate to reach out.</p>
          <p>Best regards,<br>{{supportAgentName}}<br>Customer Support Team</p>
        `,
        textContent: `Hi {{customerName}}, Thank you for contacting our support team...`,
        variables: ['customerName', 'originalSubject', 'supportResponse', 'supportAgentName'],
        category: 'support'
      }
    ];
  }

  // Database Integration
  private async initializeDatabaseIntegration(integration: ServiceIntegration): Promise<void> {
    const config = integration.config;
    
    const dbConnection: DatabaseConnection = {
      id: `db-${integration.id}`,
      name: integration.name,
      type: config.credentials?.type as any || 'postgresql',
      connectionString: config.credentials?.connectionString || '',
      isConnected: false,
      lastHealthCheck: new Date(),
      queryCount: 0,
      errorCount: 0
    };

    // Test database connection
    await this.testDatabaseConnection(dbConnection);
    
    this.databaseConnections.set(dbConnection.id, dbConnection);
  }

  private async testDatabaseConnection(connection: DatabaseConnection): Promise<boolean> {
    try {
      // Mock database connection test
      console.log(`Testing ${connection.type} connection...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      connection.isConnected = true;
      connection.lastHealthCheck = new Date();
      console.log('Database connection successful');
      return true;
    } catch (error) {
      connection.isConnected = false;
      connection.errorCount++;
      console.error('Database connection failed:', error);
      return false;
    }
  }

  private async cleanupDatabaseIntegration(integration: ServiceIntegration): Promise<void> {
    const dbId = `db-${integration.id}`;
    this.databaseConnections.delete(dbId);
  }

  // API Integration
  private async initializeApiIntegration(integration: ServiceIntegration): Promise<void> {
    const config = integration.config;
    
    // Test API connection
    if (config.endpoint) {
      await this.testApiConnection(config.endpoint, config.apiKey);
    }
  }

  private async testApiConnection(endpoint: string, apiKey?: string): Promise<boolean> {
    try {
      // Mock API connection test
      console.log(`Testing API connection to ${endpoint}...`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('API connection successful');
      return true;
    } catch (error) {
      console.error('API connection failed:', error);
      return false;
    }
  }

  // Webhook Integration
  private async initializeWebhookIntegration(integration: ServiceIntegration): Promise<void> {
    const config = integration.config;
    
    // Register webhook endpoints
    if (config.webhookUrl) {
      await this.registerWebhook(integration.id, config.webhookUrl);
    }
  }

  private async registerWebhook(integrationId: string, webhookUrl: string): Promise<void> {
    // Mock webhook registration
    console.log(`Registering webhook for integration ${integrationId}: ${webhookUrl}`);
  }

  private async cleanupWebhookIntegration(integration: ServiceIntegration): Promise<void> {
    // Unregister webhook
    if (integration.config.webhookUrl) {
      await this.unregisterWebhook(integration.id);
    }
  }

  private async unregisterWebhook(integrationId: string): Promise<void> {
    // Mock webhook unregistration
    console.log(`Unregistering webhook for integration ${integrationId}`);
  }

  // CRM Integration (Metakocka)
  private async initializeCrmIntegration(integration: ServiceIntegration): Promise<void> {
    const config = integration.config;
    
    this.metakockaConfig = {
      apiUrl: config.endpoint || 'https://api.metakocka.si',
      apiKey: config.apiKey || '',
      companyId: config.credentials?.companyId || '',
      syncEnabled: true,
      syncInterval: 3600000, // 1 hour
      lastSync: new Date(0),
      productMappings: {
        'name': 'product_name',
        'price': 'unit_price',
        'category': 'product_category',
        'description': 'description'
      },
      customerMappings: {
        'name': 'customer_name',
        'email': 'email',
        'company': 'company_name',
        'phone': 'phone'
      }
    };

    // Test Metakocka connection
    await this.testMetakockaConnection();
  }

  private async testMetakockaConnection(): Promise<boolean> {
    if (!this.metakockaConfig) return false;

    try {
      // Mock Metakocka API test
      console.log('Testing Metakocka connection...');
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Metakocka connection successful');
      return true;
    } catch (error) {
      console.error('Metakocka connection failed:', error);
      return false;
    }
  }

  // Data Synchronization
  async syncIntegration(integrationId: string): Promise<SyncResult> {
    const integration = this.integrations.get(integrationId);
    if (!integration) {
      throw new Error(`Integration ${integrationId} not found`);
    }

    const syncResult: SyncResult = {
      id: `sync-${Date.now()}`,
      integrationId,
      startTime: new Date(),
      endTime: new Date(),
      status: 'success',
      recordsProcessed: 0,
      recordsSuccess: 0,
      recordsError: 0,
      errors: [],
      summary: {}
    };

    try {
      switch (integration.type) {
        case 'email':
          await this.syncEmailData(integration, syncResult);
          break;
        case 'database':
          await this.syncDatabaseData(integration, syncResult);
          break;
        case 'api':
          await this.syncApiData(integration, syncResult);
          break;
        case 'crm':
          await this.syncCrmData(integration, syncResult);
          break;
      }

      integration.lastSync = new Date();
      integration.successCount++;
      syncResult.endTime = new Date();
      
    } catch (error) {
      syncResult.status = 'failed';
      syncResult.errors.push({
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
      
      integration.errorCount++;
    }

    this.syncResults.set(syncResult.id, syncResult);
    return syncResult;
  }

  private async syncEmailData(integration: ServiceIntegration, syncResult: SyncResult): Promise<void> {
    // Mock email data sync
    console.log('Syncing email data...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    syncResult.recordsProcessed = 25;
    syncResult.recordsSuccess = 23;
    syncResult.recordsError = 2;
    syncResult.summary = {
      newEmails: 15,
      updatedContacts: 8,
      emailsSent: 12
    };
  }

  private async syncDatabaseData(integration: ServiceIntegration, syncResult: SyncResult): Promise<void> {
    // Mock database sync
    console.log('Syncing database data...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Sync customers
    const customers = await this.fetchCustomersFromDatabase(integration);
    for (const customer of customers) {
      await this.syncCustomerData(customer);
    }
    
    syncResult.recordsProcessed = 150;
    syncResult.recordsSuccess = 148;
    syncResult.recordsError = 2;
    syncResult.summary = {
      customersUpdated: 75,
      ordersProcessed: 50,
      contactsCreated: 23
    };
  }

  private async syncApiData(integration: ServiceIntegration, syncResult: SyncResult): Promise<void> {
    // Mock API data sync
    console.log('Syncing API data...');
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    syncResult.recordsProcessed = 100;
    syncResult.recordsSuccess = 98;
    syncResult.recordsError = 2;
    syncResult.summary = {
      apiCallsSuccessful: 98,
      dataPointsUpdated: 245,
      webhooksTriggered: 12
    };
  }

  private async syncCrmData(integration: ServiceIntegration, syncResult: SyncResult): Promise<void> {
    if (!this.metakockaConfig) return;

    console.log('Syncing Metakocka data...');
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    // Sync products
    const products = await this.fetchProductsFromMetakocka();
    for (const product of products) {
      await this.syncProductData(product);
    }
    
    // Sync customers
    const customers = await this.fetchCustomersFromMetakocka();
    for (const customer of customers) {
      await this.syncCustomerData(customer);
    }
    
    syncResult.recordsProcessed = 200;
    syncResult.recordsSuccess = 195;
    syncResult.recordsError = 5;
    syncResult.summary = {
      productsUpdated: 85,
      customersUpdated: 110,
      pricesUpdated: 45
    };
    
    this.metakockaConfig.lastSync = new Date();
  }

  // Mock data fetching methods
  private async fetchCustomersFromDatabase(integration: ServiceIntegration): Promise<any[]> {
    // Mock database customer fetch
    return [
      { id: 1, name: 'John Doe', email: 'john@example.com', company: 'Example Corp' },
      { id: 2, name: 'Jane Smith', email: 'jane@company.com', company: 'Company Inc' }
    ];
  }

  private async fetchProductsFromMetakocka(): Promise<any[]> {
    // Mock Metakocka product fetch
    return [
      { id: 'mk-001', name: 'CRM Professional', price: 29.99, category: 'Software' },
      { id: 'mk-002', name: 'CRM Enterprise', price: 99.99, category: 'Software' }
    ];
  }

  private async fetchCustomersFromMetakocka(): Promise<any[]> {
    // Mock Metakocka customer fetch
    return [
      { id: 'mk-cust-001', name: 'Tech Solutions', email: 'contact@techsolutions.com' },
      { id: 'mk-cust-002', name: 'Business Corp', email: 'info@businesscorp.com' }
    ];
  }

  private async syncCustomerData(customerData: any): Promise<void> {
    // Transform and sync customer data with CustomerAgent
    const transformedData = this.transformCustomerData(customerData);
    // In a real implementation, this would call customerAgent methods
    console.log('Syncing customer:', transformedData.name);
  }

  private async syncProductData(productData: any): Promise<void> {
    // Transform and sync product data with ProductAgent
    const transformedData = this.transformProductData(productData);
    // In a real implementation, this would call productAgent methods
    console.log('Syncing product:', transformedData.name);
  }

  private transformCustomerData(data: any): any {
    // Apply field mappings and transformations
    return {
      id: data.id,
      name: data.name || data.customer_name,
      email: data.email,
      company: data.company || data.company_name,
      phone: data.phone,
      source: 'integration'
    };
  }

  private transformProductData(data: any): any {
    // Apply field mappings and transformations
    return {
      id: data.id,
      name: data.name || data.product_name,
      price: data.price || data.unit_price,
      category: data.category || data.product_category,
      description: data.description,
      source: 'metakocka'
    };
  }

  // Email Service Methods
  async sendEmail(to: string, templateId: string, variables: Record<string, any>): Promise<boolean> {
    if (!this.emailConfig) {
      throw new Error('Email service not configured');
    }

    const template = this.emailConfig.templates.find(t => t.id === templateId);
    if (!template) {
      throw new Error(`Email template ${templateId} not found`);
    }

    try {
      // Mock email sending
      console.log(`Sending email to ${to} using template ${templateId}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, this would use the configured email provider
      const subject = this.replaceVariables(template.subject, variables);
      const htmlContent = this.replaceVariables(template.htmlContent, variables);
      
      console.log(`Email sent successfully: ${subject}`);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  private replaceVariables(content: string, variables: Record<string, any>): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }

  // Webhook Handlers
  async handleWebhook(integrationId: string, payload: any): Promise<void> {
    const integration = this.integrations.get(integrationId);
    if (!integration || integration.status !== 'active') {
      throw new Error(`Integration ${integrationId} not found or inactive`);
    }

    try {
      // Process webhook payload based on integration type
      switch (integration.type) {
        case 'crm':
          await this.handleCrmWebhook(payload);
          break;
        case 'email':
          await this.handleEmailWebhook(payload);
          break;
        default:
          console.log(`Webhook received for ${integration.name}:`, payload);
      }
    } catch (error) {
      console.error(`Error handling webhook for ${integrationId}:`, error);
      throw error;
    }
  }

  private async handleCrmWebhook(payload: any): Promise<void> {
    // Handle CRM webhook events
    if (payload.event === 'customer.created') {
      await this.syncCustomerData(payload.data);
    } else if (payload.event === 'product.updated') {
      await this.syncProductData(payload.data);
    }
  }

  private async handleEmailWebhook(payload: any): Promise<void> {
    // Handle email webhook events (bounces, opens, clicks, etc.)
    if (payload.event === 'email.bounced') {
      console.log('Email bounced:', payload.email);
    } else if (payload.event === 'email.opened') {
      console.log('Email opened:', payload.email);
    }
  }

  // Default Integrations
  private initializeDefaultIntegrations(): void {
    // Email Integration
    this.createIntegration({
      name: 'Email Service',
      type: 'email',
      status: 'pending',
      config: {
        mappings: [
          { sourceField: 'email', targetField: 'email', dataType: 'string', required: true },
          { sourceField: 'name', targetField: 'name', dataType: 'string', required: true },
          { sourceField: 'subject', targetField: 'subject', dataType: 'string', required: true }
        ],
        credentials: {
          provider: 'smtp',
          host: 'smtp.gmail.com',
          port: '587',
          secure: 'true'
        }
      },
      syncFrequency: 'realtime'
    });

    // Database Integration
    this.createIntegration({
      name: 'Customer Database',
      type: 'database',
      status: 'pending',
      config: {
        mappings: [
          { sourceField: 'customer_id', targetField: 'id', dataType: 'string', required: true },
          { sourceField: 'customer_name', targetField: 'name', dataType: 'string', required: true },
          { sourceField: 'email', targetField: 'email', dataType: 'string', required: true },
          { sourceField: 'company_name', targetField: 'company', dataType: 'string', required: false }
        ],
        credentials: {
          type: 'postgresql',
          host: 'localhost',
          port: '5432',
          database: 'crm_db'
        }
      },
      syncFrequency: 'hourly'
    });

    // Metakocka Integration
    this.createIntegration({
      name: 'Metakocka CRM',
      type: 'crm',
      status: 'pending',
      config: {
        endpoint: 'https://api.metakocka.si/v1',
        mappings: [
          { sourceField: 'product_name', targetField: 'name', dataType: 'string', required: true },
          { sourceField: 'unit_price', targetField: 'price', dataType: 'number', required: true },
          { sourceField: 'product_category', targetField: 'category', dataType: 'string', required: false }
        ],
        credentials: {
          companyId: 'your-company-id'
        }
      },
      syncFrequency: 'daily'
    });
  }

  // Public getters
  getIntegrations(): ServiceIntegration[] {
    return Array.from(this.integrations.values());
  }

  getIntegration(id: string): ServiceIntegration | undefined {
    return this.integrations.get(id);
  }

  getSyncResults(integrationId?: string): SyncResult[] {
    let results = Array.from(this.syncResults.values());
    
    if (integrationId) {
      results = results.filter(r => r.integrationId === integrationId);
    }
    
    return results.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }

  getDatabaseConnections(): DatabaseConnection[] {
    return Array.from(this.databaseConnections.values());
  }

  getEmailConfig(): EmailServiceConfig | null {
    return this.emailConfig;
  }

  getMetakockaConfig(): MetakockaConfig | null {
    return this.metakockaConfig;
  }

  // Health check
  async healthCheck(): Promise<Record<string, any>> {
    const health = {
      integrations: {
        total: this.integrations.size,
        active: 0,
        inactive: 0,
        error: 0
      },
      databases: {
        total: this.databaseConnections.size,
        connected: 0,
        disconnected: 0
      },
      email: {
        configured: this.emailConfig !== null,
        templatesAvailable: this.emailConfig?.templates.length || 0
      },
      metakocka: {
        configured: this.metakockaConfig !== null,
        lastSync: this.metakockaConfig?.lastSync || null
      }
    };

    // Count integration statuses
    for (const integration of this.integrations.values()) {
      switch (integration.status) {
        case 'active':
          health.integrations.active++;
          break;
        case 'inactive':
          health.integrations.inactive++;
          break;
        case 'error':
          health.integrations.error++;
          break;
      }
    }

    // Count database connections
    for (const db of this.databaseConnections.values()) {
      if (db.isConnected) {
        health.databases.connected++;
      } else {
        health.databases.disconnected++;
      }
    }

    return health;
  }
} 