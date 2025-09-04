# Subscription Context Usage Examples

## How pages become much simpler:

### Before (Complex):
```tsx
// Every page had to do this...
const [subscriptionLimits, setSubscriptionLimits] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  const fetchLimits = async () => {
    const response = await fetch('/api/subscription/limits');
    const data = await response.json();
    setSubscriptionLimits(data);
    setLoading(false);
  };
  fetchLimits();
}, []);

if (loading) return <div>Loading...</div>;

const canAddEmail = subscriptionLimits?.emailAccounts > currentCount;
```

### After (Simple):
```tsx
// Just use the hook!
import { useCanAddEmailAccounts, useSubscription } from '@/contexts/SubscriptionContext';

const { canAdd, limit, isUnlimited } = useCanAddEmailAccounts();
const { subscription } = useSubscription();

// That's it! No loading states, no API calls, no complexity
```

## Example Usage in Your Components:

### 1. Email Account Limits:
```tsx
import { useCanAddEmailAccounts } from '@/contexts/SubscriptionContext';

function EmailAccountsPage() {
  const { canAdd, limit, isUnlimited } = useCanAddEmailAccounts();
  
  return (
    <div>
      <h1>Email Accounts ({currentCount} of {isUnlimited ? '∞' : limit})</h1>
      {canAdd ? (
        <AddEmailButton />
      ) : (
        <UpgradePrompt />
      )}
    </div>
  );
}
```

### 2. Plan Change Restrictions:
```tsx
import { useCanChangePlans } from '@/contexts/SubscriptionContext';

function SubscriptionPage() {
  const canChangePlans = useCanChangePlans();
  
  return (
    <Button 
      disabled={!canChangePlans}
      onClick={handlePlanChange}
    >
      {canChangePlans ? 'Change Plan' : 'Contact Admin'}
    </Button>
  );
}
```

### 3. Feature Gates:
```tsx
import { useHasFeature } from '@/contexts/SubscriptionContext';
import { SubscriptionGate } from '@/components/subscription/SubscriptionGate';

function AdvancedFeaturePage() {
  return (
    <SubscriptionGate feature="advanced_analytics">
      <AdvancedAnalyticsComponent />
    </SubscriptionGate>
  );
}
```

### 4. Token Display:
```tsx
import { useSubscription } from '@/contexts/SubscriptionContext';

function TokenBalance() {
  const { subscription } = useSubscription();
  
  if (subscription?.isUnlimited) {
    return <div>Unlimited tokens available</div>;
  }
  
  return <div>{subscription?.limits.aiTokens} tokens remaining</div>;
}
```

## Benefits:

1. **Single Source of Truth**: Subscription data loaded once, used everywhere
2. **Automatic Caching**: Data cached in localStorage and memory
3. **No Duplicate API Calls**: One API call per session, not per page
4. **Consistent Behavior**: Same logic everywhere
5. **Easy Testing**: Mock the context instead of multiple APIs
6. **Better Performance**: No loading states on every page
7. **Cleaner Code**: Remove subscription logic from every component

## Migration Strategy:

1. Start using the new context in new features
2. Gradually replace individual subscription checks
3. Remove duplicate API calls from existing components
4. Deprecate old subscription checking functions

The old approach required 50+ lines of code per component.
The new approach requires 1-2 lines per component.