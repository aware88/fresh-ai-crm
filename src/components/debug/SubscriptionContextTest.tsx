'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useSubscriptionDebug, useEmailAccountLimits, useAITokenLimits, useCanChangeSubscriptionPlans } from '@/lib/subscription-utils';

/**
 * DEBUGGING COMPONENT
 * Add this temporarily to any page to test the subscription context
 * 
 * Usage:
 * import SubscriptionContextTest from '@/components/debug/SubscriptionContextTest';
 * // Add <SubscriptionContextTest /> to your JSX
 */
export default function SubscriptionContextTest() {
  const debug = useSubscriptionDebug();
  const emailLimits = useEmailAccountLimits();
  const tokenLimits = useAITokenLimits();
  const planChanges = useCanChangeSubscriptionPlans();

  const getStatusIcon = (isWorking: boolean) => {
    return isWorking ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getStatusBadge = (source: string) => {
    const colors = {
      'context': 'bg-green-100 text-green-800',
      'context-loading': 'bg-yellow-100 text-yellow-800', 
      'fallback-needed': 'bg-orange-100 text-orange-800',
      'legacy': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={colors[source as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {source}
      </Badge>
    );
  };

  return (
    <Card className="m-4 border-2 border-dashed border-blue-300">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          Subscription Context Test
          <Badge variant="outline">Debug Only</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Context Health */}
        <div className="p-3 bg-gray-50 rounded">
          <h4 className="font-medium mb-2">Context Health</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2">
              {getStatusIcon(debug.contextHealth.isWorking)}
              <span>Is Working</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(debug.contextHealth.isReady)}
              <span>Is Ready</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!debug.contextHealth.isLoading)}
              <span>Not Loading</span>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(!debug.contextHealth.error)}
              <span>No Errors</span>
            </div>
          </div>
          {debug.contextHealth.error && (
            <div className="mt-2 p-2 bg-red-50 rounded text-red-700 text-sm">
              Error: {debug.contextHealth.error}
            </div>
          )}
        </div>

        {/* Subscription Data */}
        {debug.subscription && (
          <div className="p-3 bg-green-50 rounded">
            <h4 className="font-medium mb-2">Subscription Data</h4>
            <div className="text-sm space-y-1">
              <div><strong>Tier:</strong> {debug.subscription.tier}</div>
              <div><strong>Email Accounts:</strong> {debug.subscription.limits.emailAccounts === -1 ? 'Unlimited' : debug.subscription.limits.emailAccounts}</div>
              <div><strong>AI Tokens:</strong> {debug.subscription.limits.aiTokens === -1 ? 'Unlimited' : debug.subscription.limits.aiTokens}</div>
              <div><strong>Can Change Plans:</strong> {debug.subscription.canChangePlans ? 'Yes' : 'No'}</div>
              <div><strong>Features:</strong> {debug.subscription.features.join(', ')}</div>
            </div>
          </div>
        )}

        {/* Individual Hook Tests */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Email Limits */}
          <div className="p-3 border rounded">
            <h5 className="font-medium mb-2">Email Account Limits</h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Source:</span>
                {getStatusBadge(emailLimits.source)}
              </div>
              <div><strong>Limit:</strong> {emailLimits.limit === null ? 'N/A' : emailLimits.isUnlimited ? 'Unlimited' : emailLimits.limit}</div>
              <div><strong>Needs Fallback:</strong> {emailLimits.needsFallback ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Token Limits */}
          <div className="p-3 border rounded">
            <h5 className="font-medium mb-2">AI Token Limits</h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Source:</span>
                {getStatusBadge(tokenLimits.source)}
              </div>
              <div><strong>Limit:</strong> {tokenLimits.limit === null ? 'N/A' : tokenLimits.isUnlimited ? 'Unlimited' : tokenLimits.limit}</div>
              <div><strong>Needs Fallback:</strong> {tokenLimits.needsFallback ? 'Yes' : 'No'}</div>
            </div>
          </div>

          {/* Plan Changes */}
          <div className="p-3 border rounded">
            <h5 className="font-medium mb-2">Plan Changes</h5>
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Source:</span>
                {getStatusBadge(planChanges.source)}
              </div>
              <div><strong>Can Change:</strong> {planChanges.canChange === null ? 'N/A' : planChanges.canChange ? 'Yes' : 'No'}</div>
              {planChanges.reason && (
                <div><strong>Reason:</strong> {planChanges.reason}</div>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="p-3 border-l-4 border-blue-500 bg-blue-50">
          <h5 className="font-medium mb-2">Recommendations</h5>
          <div className="text-sm space-y-1">
            {debug.recommendations.isFullyWorking && (
              <div className="text-green-700">✅ Context system fully working - ready to migrate components</div>
            )}
            {debug.recommendations.shouldShowLoading && (
              <div className="text-yellow-700">⏳ Context loading - components should show loading state</div>
            )}
            {debug.recommendations.shouldUseFallback && (
              <div className="text-orange-700">🔄 Context not ready - components should use fallback API calls</div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Test
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => localStorage.removeItem('subscription-cache')}
          >
            Clear Cache
          </Button>
        </div>

        {/* Raw Debug Data */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium">Raw Debug Data</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify({
              debug,
              emailLimits,
              tokenLimits,
              planChanges
            }, null, 2)}
          </pre>
        </details>
      </CardContent>
    </Card>
  );
}