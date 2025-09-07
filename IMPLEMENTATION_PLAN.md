# Complete Implementation Plan: Enhanced AI Model Selection & Learning Exemption

## Overview
This plan implements:
1. **5000 email learning exemption** (doesn't count against subscription limits)
2. **Enhanced model selection** (GPT-4o for complex tasks with ERP/external data)
3. **Model visibility** in UI (show which model is used and why)
4. **Improved complexity assessment** (detect ERP integrations, external data needs)

## Phase 1: Learning Exemption System

### 1.1 Update AI Usage Service
**File: `src/lib/services/ai-usage-service.ts`**

Add new method to handle learning exemptions:
```typescript
/**
 * Log AI usage with learning exemption support
 */
async logUsageWithLearningExemption({
  organizationId,
  userId,
  messageType,
  tokensUsed = 1,
  costUsd = 0,
  featureUsed,
  metadata = {},
  isInitialLearning = false
}: {
  organizationId: string;
  userId: string;
  messageType: 'email_response' | 'ai_future' | 'profiling' | 'general' | 'drafting' | 'initial_learning';
  tokensUsed?: number;
  costUsd?: number;
  featureUsed?: string;
  metadata?: Record<string, any>;
  isInitialLearning?: boolean;
}): Promise<string | null>
```

### 1.2 Database Schema Updates
**File: `supabase/migrations/[timestamp]_learning_exemption.sql`**

```sql
-- Add learning exemption tracking
ALTER TABLE ai_usage_tracking 
ADD COLUMN is_initial_learning BOOLEAN DEFAULT FALSE,
ADD COLUMN learning_session_id TEXT,
ADD COLUMN exempt_from_limits BOOLEAN DEFAULT FALSE;

-- Add learning session tracking
CREATE TABLE IF NOT EXISTS ai_learning_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  total_emails_processed INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  total_cost_usd DECIMAL(10,6) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
  session_type TEXT DEFAULT 'initial' CHECK (session_type IN ('initial', 'manual'))
);

-- RPC function to check learning exemption eligibility
CREATE OR REPLACE FUNCTION check_learning_exemption_eligibility(
  p_user_id TEXT,
  p_organization_id TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  existing_session RECORD;
  result JSON;
BEGIN
  -- Check if user already has a completed initial learning session
  SELECT * INTO existing_session
  FROM ai_learning_sessions
  WHERE user_id = p_user_id
    AND (p_organization_id IS NULL OR organization_id = p_organization_id)
    AND session_type = 'initial'
    AND status = 'completed'
  LIMIT 1;
  
  IF existing_session IS NOT NULL THEN
    result := json_build_object(
      'eligible', false,
      'reason', 'Initial learning already completed',
      'completed_at', existing_session.completed_at,
      'emails_processed', existing_session.total_emails_processed
    );
  ELSE
    result := json_build_object(
      'eligible', true,
      'reason', 'No initial learning session found',
      'max_emails_allowed', 5000
    );
  END IF;
  
  RETURN result;
END;
$$;
```

### 1.3 Update Email Learning Service
**File: `src/lib/email/email-learning-service.ts`**

Add learning exemption logic:
```typescript
/**
 * Start initial learning session with exemption tracking
 */
async startInitialLearningSession(
  userId: string,
  organizationId?: string
): Promise<{ sessionId: string; eligible: boolean; reason?: string }> {
  // Check eligibility
  const { data: eligibility } = await this.supabase.rpc(
    'check_learning_exemption_eligibility',
    { p_user_id: userId, p_organization_id: organizationId }
  );
  
  if (!eligibility.eligible) {
    return { sessionId: '', eligible: false, reason: eligibility.reason };
  }
  
  // Create learning session
  const { data: session, error } = await this.supabase
    .from('ai_learning_sessions')
    .insert({
      user_id: userId,
      organization_id: organizationId,
      session_type: 'initial'
    })
    .select()
    .single();
    
  return { sessionId: session.id, eligible: true };
}

/**
 * Modified performInitialLearning with exemption support
 */
async performInitialLearning(
  userId: string, 
  organizationId?: string,
  maxEmails: number = 5000 // Increased from 1000
): Promise<LearningAnalysis> {
  const startTime = Date.now();
  
  // Start learning session
  const sessionResult = await this.startInitialLearningSession(userId, organizationId);
  if (!sessionResult.eligible) {
    throw new Error(`Learning exemption not eligible: ${sessionResult.reason}`);
  }
  
  const sessionId = sessionResult.sessionId;
  
  try {
    // ... existing learning logic ...
    
    // Log usage with exemption flag
    await this.logLearningUsage(
      userId,
      organizationId,
      totalTokens,
      totalCost,
      sessionId,
      true // isInitialLearning = true (exempt from limits)
    );
    
    // Mark session as completed
    await this.supabase
      .from('ai_learning_sessions')
      .update({
        completed_at: new Date().toISOString(),
        total_emails_processed: emailPairs.length,
        total_tokens_used: totalTokens,
        total_cost_usd: totalCost,
        status: 'completed'
      })
      .eq('id', sessionId);
      
  } catch (error) {
    // Mark session as failed
    await this.supabase
      .from('ai_learning_sessions')
      .update({ status: 'failed' })
      .eq('id', sessionId);
    throw error;
  }
}
```

## Phase 2: Enhanced Model Selection

### 2.1 Update Model Router Service
**File: `src/lib/ai/model-router-service.ts`**

Enhance complexity detection:
```typescript
/**
 * Enhanced context analysis to detect ERP/external data needs
 */
private analyzeContext(message: string, context?: any): number {
  let score = 0;
  const lowerMessage = message.toLowerCase();
  
  // ERP Integration indicators (HIGH COMPLEXITY)
  const erpIndicators = [
    'metakocka', 'magento', 'inventory', 'stock', 'order status',
    'product availability', 'pricing', 'customer history', 'invoice',
    'payment status', 'shipping status', 'purchase history'
  ];
  
  const hasErpNeeds = erpIndicators.some(indicator => 
    lowerMessage.includes(indicator)
  );
  
  if (hasErpNeeds) {
    score += 6; // Force high complexity for ERP needs
  }
  
  // External data indicators
  if (context?.has_customer_data || 
      context?.has_sales_context || 
      context?.requires_external_lookup) {
    score += 4;
  }
  
  // Complex business logic indicators
  const businessComplexity = [
    'analyze sales', 'customer segmentation', 'revenue analysis',
    'cross-sell', 'upsell', 'business intelligence'
  ];
  
  if (businessComplexity.some(term => lowerMessage.includes(term))) {
    score += 3;
  }
  
  // ... existing context analysis logic ...
  
  return Math.min(score, 10);
}

/**
 * Enhanced model selection with ERP awareness
 */
private selectBestModel(complexity: TaskComplexity, userPreference?: string, taskType?: string, context?: any): string {
  // Check user preference first
  if (userPreference && this.models.has(userPreference)) {
    const model = this.models.get(userPreference)!;
    if (model.suitableFor.includes(complexity)) {
      return userPreference;
    }
  }
  
  // FORCE GPT-4o for ERP integrations and external data
  if (context?.requires_erp_integration || 
      context?.has_customer_data ||
      context?.has_sales_context ||
      taskType?.includes('erp_') ||
      taskType?.includes('metakocka') ||
      taskType?.includes('magento')) {
    return 'gpt-4o';
  }
  
  // Special case for email learning tasks - always prefer GPT-4o-mini
  if (taskType && 
      (taskType.includes('email_learning') || 
       taskType.includes('pattern_extraction') || 
       taskType.includes('pattern_based_draft'))) {
    return 'gpt-4o-mini';
  }

  // Enhanced selection logic
  switch (complexity) {
    case TaskComplexity.SIMPLE:
      return 'gpt-4o-mini';
    case TaskComplexity.STANDARD:
      return 'gpt-4o-mini'; // Still prefer mini for standard tasks
    case TaskComplexity.COMPLEX:
      return 'gpt-4o'; // Use GPT-4o for truly complex tasks
    default:
      return 'gpt-4o-mini';
  }
}
```

### 2.2 Update Unified Drafting Service
**File: `src/lib/ai/unified-drafting-service.ts`**

Enhance complexity assessment:
```typescript
/**
 * Enhanced task complexity assessment with ERP detection
 */
private assessTaskComplexity(context: DraftingContext, comprehensiveContext: any): string {
  const email = context.originalEmail;
  let complexityScore = 0;
  
  // ERP Integration Detection
  const needsErpIntegration = this.detectErpIntegrationNeeds(email, comprehensiveContext);
  if (needsErpIntegration.required) {
    complexityScore += 6; // Force high complexity
    console.log(`[UnifiedDrafting] ERP integration detected: ${needsErpIntegration.systems.join(', ')}`);
  }
  
  // External data requirements
  if (comprehensiveContext.contactContext || 
      comprehensiveContext.salesContext ||
      context.salesContext) {
    complexityScore += 4;
  }
  
  // ... existing complexity logic ...
  
  if (complexityScore >= 7) return 'complex';
  if (complexityScore >= 4) return 'standard';
  return 'simple';
}

/**
 * Detect if email requires ERP integration
 */
private detectErpIntegrationNeeds(email: any, context: any): {
  required: boolean;
  systems: string[];
  reasoning: string[];
} {
  const content = `${email.subject} ${email.body}`.toLowerCase();
  const systems: string[] = [];
  const reasoning: string[] = [];
  
  // Metakocka indicators
  const metakockaIndicators = [
    'order status', 'invoice', 'product availability', 'stock level',
    'pricing', 'delivery', 'payment status', 'account balance'
  ];
  
  if (metakockaIndicators.some(indicator => content.includes(indicator))) {
    systems.push('Metakocka ERP');
    reasoning.push('Email contains ERP-related queries requiring real-time data');
  }
  
  // Magento indicators
  const magentoIndicators = [
    'product catalog', 'customer order', 'shopping cart', 'checkout',
    'product details', 'category'
  ];
  
  if (magentoIndicators.some(indicator => content.includes(indicator))) {
    systems.push('Magento');
    reasoning.push('Email requires e-commerce platform integration');
  }
  
  // Context-based detection
  if (context.hasCustomerData) {
    systems.push('Customer Database');
    reasoning.push('Customer context requires database lookup');
  }
  
  return {
    required: systems.length > 0,
    systems,
    reasoning
  };
}
```

## Phase 3: Model Visibility in UI

### 3.1 Add Model Information to API Responses
**File: `src/lib/ai/unified-drafting-service.ts`**

Update response format:
```typescript
export interface DraftingResult {
  success: boolean;
  draft?: {
    subject: string;
    body: string;
    confidence: number;
    reasoning?: string[];
  };
  modelUsed?: {
    id: string;
    name: string;
    reasoning: string[];
    cost: number;
    tokensUsed: number;
    alternatives?: string[];
  };
  // ... existing fields
}

/**
 * Enhanced generateDraft with model visibility
 */
async generateDraft(context: DraftingContext): Promise<DraftingResult> {
  const startTime = Date.now();
  
  try {
    // ... existing logic ...
    
    // Step 2: Select optimal AI model with detailed reasoning
    const modelSelection = await this.selectOptimalModel(context, comprehensiveContext);
    const modelConfig = this.modelRouter.getModel(modelSelection.model);
    
    console.log(`[UnifiedDrafting] Selected model: ${modelSelection.model} (${modelSelection.reasoning})`);
    
    // ... AI generation logic ...
    
    // Calculate actual costs
    const tokensUsed = response.usage?.total_tokens || 0;
    const costUsd = this.calculateCost(modelSelection.model, tokensUsed);
    
    return {
      success: true,
      draft: parsedDraft,
      modelUsed: {
        id: modelSelection.model,
        name: modelConfig?.name || modelSelection.model,
        reasoning: [modelSelection.reasoning],
        cost: costUsd,
        tokensUsed,
        alternatives: modelSelection.alternatives || []
      },
      processingTime: Date.now() - startTime,
      // ... other fields
    };
  }
}
```

### 3.2 Update UI Components
**File: `src/components/email/AIDraftWindow.tsx`**

Add model visibility:
```tsx
interface ModelInfo {
  id: string;
  name: string;
  reasoning: string[];
  cost: number;
  tokensUsed: number;
  alternatives?: string[];
}

// Add to component state
const [modelInfo, setModelInfo] = useState<ModelInfo | null>(null);

// Update draft generation response handling
const handleDraftResponse = (response: any) => {
  if (response.modelUsed) {
    setModelInfo(response.modelUsed);
  }
  // ... existing logic
};

// Add model info display
const ModelInfoDisplay = ({ modelInfo }: { modelInfo: ModelInfo }) => (
  <div className="bg-gray-50 p-3 rounded-md text-sm border-l-4 border-blue-500">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center space-x-2">
        <span className="text-blue-600 font-medium">🤖 AI Model:</span>
        <span className="font-semibold">{modelInfo.name}</span>
      </div>
      <div className="text-gray-500 text-xs">
        💰 ${modelInfo.cost.toFixed(4)} ({modelInfo.tokensUsed} tokens)
      </div>
    </div>
    <div className="text-gray-600">
      <div className="font-medium mb-1">🔧 Selection Reasoning:</div>
      <ul className="list-disc list-inside space-y-1">
        {modelInfo.reasoning.map((reason, idx) => (
          <li key={idx} className="text-xs">{reason}</li>
        ))}
      </ul>
    </div>
    {modelInfo.alternatives && modelInfo.alternatives.length > 0 && (
      <div className="mt-2 pt-2 border-t border-gray-200">
        <span className="text-xs text-gray-500">
          Alternative models: {modelInfo.alternatives.join(', ')}
        </span>
      </div>
    )}
  </div>
);
```

## Phase 4: Implementation Steps

### Step 1: Database Migration
1. Run the learning exemption migration
2. Test the new RPC functions
3. Verify learning session tracking works

### Step 2: Update Services (Backend)
1. Update `AIUsageService` with exemption logic
2. Enhance `ModelRouterService` complexity detection
3. Update `EmailLearningService` with 5000 email support
4. Update `UnifiedDraftingService` with model visibility

### Step 3: Update API Endpoints
1. Modify `/api/email/learning/initial` to use exemptions
2. Update `/api/emails/ai-draft` to return model info
3. Update `/api/emails/ai-learning` to track exemptions

### Step 4: Update UI Components
1. Add model visibility to `AIDraftWindow`
2. Update learning progress indicators
3. Add model selection controls (advanced users)

### Step 5: Testing & Validation
1. Test learning exemption (5000 emails don't count against limits)
2. Verify GPT-4o is used for ERP integrations
3. Confirm model visibility shows correctly
4. Test cost calculations are accurate

## Risk Mitigation

### Backward Compatibility
- All new fields have defaults
- Existing API endpoints continue to work
- Graceful fallbacks for missing model info

### Performance
- Model selection cached per session
- Learning exemption checked once per user
- Database queries optimized with indexes

### Cost Control
- Learning exemption limited to initial session only
- Model selection still prefers cost-effective options
- Usage tracking remains accurate

## Success Metrics

1. **Learning Exemption**: New users can process 5000 emails without hitting limits
2. **Model Selection**: ERP-related emails automatically use GPT-4o
3. **Model Visibility**: Users see which model is used and why
4. **Cost Optimization**: Overall costs remain controlled while improving quality

This implementation maintains all existing functionality while adding the requested enhancements.





