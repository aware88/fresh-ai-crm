'use client';

import { useState, useEffect } from 'react';
import { Wand2, Plus, Save, Trash2, AlertCircle, Check } from 'lucide-react';

interface PromptRule {
  id: string;
  name: string;
  description: string;
  triggerPattern: string;
  prompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function EmailPromptRulesEditor() {
  const [rules, setRules] = useState<PromptRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRule, setCurrentRule] = useState<Partial<PromptRule> | null>(null);

  // Load existing rules
  useEffect(() => {
    async function loadRules() {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from an API
        // For now, we'll use sample data
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const sampleRules: PromptRule[] = [
          {
            id: '1',
            name: 'Customer Support Response',
            description: 'Generates a helpful response for customer support inquiries',
            triggerPattern: 'support OR help OR issue',
            prompt: 'Generate a helpful and empathetic response to this customer support inquiry. Address their concerns directly and provide clear next steps.',
            isActive: true,
            createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '2',
            name: 'Sales Inquiry Response',
            description: 'Creates a response for potential sales leads',
            triggerPattern: 'price OR quote OR purchase',
            prompt: 'Generate a professional sales response that addresses pricing questions, highlights our value proposition, and includes a clear call to action.',
            isActive: true,
            createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: '3',
            name: 'Technical Documentation',
            description: 'Creates technical documentation for developers',
            triggerPattern: 'api OR documentation OR integration',
            prompt: 'Generate clear technical documentation with code examples and step-by-step instructions.',
            isActive: false,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          },
        ];
        
        setRules(sampleRules);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load prompt rules:', err);
        setError('Failed to load prompt rules');
      } finally {
        setLoading(false);
      }
    }
    
    loadRules();
  }, []);

  const handleAddRule = () => {
    setCurrentRule({
      name: '',
      description: '',
      triggerPattern: '',
      prompt: '',
      isActive: true,
    });
    setIsEditing(true);
  };

  const handleEditRule = (rule: PromptRule) => {
    setCurrentRule({ ...rule });
    setIsEditing(true);
  };

  const handleDeleteRule = async (id: string) => {
    try {
      // In a real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setRules(rules.filter(rule => rule.id !== id));
      setSuccess('Rule deleted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to delete rule:', err);
      setError('Failed to delete rule');
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      // In a real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setRules(rules.map(rule => {
        if (rule.id === id) {
          return { ...rule, isActive: !rule.isActive, updatedAt: new Date().toISOString() };
        }
        return rule;
      }));
    } catch (err: any) {
      console.error('Failed to update rule status:', err);
      setError('Failed to update rule status');
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  const handleSaveRule = async () => {
    if (!currentRule || !currentRule.name || !currentRule.triggerPattern || !currentRule.prompt) {
      setError('Please fill in all required fields');
      return;
    }
    
    try {
      // In a real implementation, this would call an API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const now = new Date().toISOString();
      
      if (currentRule.id) {
        // Update existing rule
        setRules(rules.map(rule => {
          if (rule.id === currentRule.id) {
            return {
              ...rule,
              ...currentRule,
              updatedAt: now,
            } as PromptRule;
          }
          return rule;
        }));
      } else {
        // Create new rule
        const newRule: PromptRule = {
          id: `rule-${Date.now()}`,
          name: currentRule.name,
          description: currentRule.description || '',
          triggerPattern: currentRule.triggerPattern,
          prompt: currentRule.prompt,
          isActive: currentRule.isActive ?? true,
          createdAt: now,
          updatedAt: now,
        };
        
        setRules([...rules, newRule]);
      }
      
      setSuccess('Rule saved successfully');
      setIsEditing(false);
      setCurrentRule(null);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Failed to save rule:', err);
      setError('Failed to save rule');
      
      // Clear error message after 5 seconds
      setTimeout(() => setError(null), 5000);
    }
  };

  return (
    <div className="email-prompt-rules-editor">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-xl font-semibold">Email Prompt Rules</h2>
          <p className="text-sm text-gray-500">
            Create AI prompt rules that automatically generate responses based on email content
          </p>
        </div>
        
        <button
          onClick={handleAddRule}
          className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          disabled={isEditing}
        >
          <Plus size={16} className="mr-1" />
          Add Rule
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-3 rounded-md mb-4 flex items-center">
          <Check size={16} className="mr-2" />
          {success}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading prompt rules...</p>
        </div>
      ) : isEditing ? (
        <div className="bg-gray-50 p-6 rounded-lg border">
          <h3 className="text-lg font-medium mb-4">
            {currentRule?.id ? 'Edit Rule' : 'Create New Rule'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Rule Name *
              </label>
              <input
                type="text"
                value={currentRule?.name || ''}
                onChange={(e) => setCurrentRule(prev => prev ? { ...prev, name: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., Customer Support Response"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                value={currentRule?.description || ''}
                onChange={(e) => setCurrentRule(prev => prev ? { ...prev, description: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="Brief description of what this rule does"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trigger Pattern *
              </label>
              <input
                type="text"
                value={currentRule?.triggerPattern || ''}
                onChange={(e) => setCurrentRule(prev => prev ? { ...prev, triggerPattern: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md font-mono text-sm"
                placeholder="support OR help OR issue"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use keywords separated by OR to trigger this rule. The rule will activate when any of these words are found in the email.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                AI Prompt *
              </label>
              <textarea
                value={currentRule?.prompt || ''}
                onChange={(e) => setCurrentRule(prev => prev ? { ...prev, prompt: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                rows={5}
                placeholder="Instructions for the AI to generate a response"
              />
              <p className="text-xs text-gray-500 mt-1">
                Write clear instructions for the AI to generate appropriate responses when this rule is triggered.
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                type="checkbox"
                id="rule-active"
                checked={currentRule?.isActive ?? true}
                onChange={(e) => setCurrentRule(prev => prev ? { ...prev, isActive: e.target.checked } : null)}
                className="h-4 w-4 text-blue-600 rounded"
              />
              <label htmlFor="rule-active" className="ml-2 text-sm text-gray-700">
                Rule is active
              </label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setCurrentRule(null);
                }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRule}
                disabled={!currentRule?.name || !currentRule?.triggerPattern || !currentRule?.prompt}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save size={16} className="mr-1" />
                Save Rule
              </button>
            </div>
          </div>
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-12 border rounded-lg bg-gray-50">
          <Wand2 size={32} className="mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No prompt rules yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first prompt rule to automate email responses
          </p>
          <div className="mt-6">
            <button
              onClick={handleAddRule}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus size={16} className="mr-1" />
              Create First Rule
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className="border rounded-lg overflow-hidden bg-white">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
                <div className="flex items-center">
                  <h3 className="font-medium">{rule.name}</h3>
                  <span 
                    className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(rule.id)}
                    className={`px-2 py-1 rounded text-xs font-medium ${rule.isActive ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}
                  >
                    {rule.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleEditRule(rule)}
                    className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-medium hover:bg-blue-100"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="px-2 py-1 bg-red-50 text-red-700 rounded text-xs font-medium hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {rule.description && (
                  <p className="text-sm text-gray-600">{rule.description}</p>
                )}
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase">Trigger Pattern</h4>
                  <p className="mt-1 text-sm font-mono bg-gray-50 p-2 rounded">{rule.triggerPattern}</p>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-gray-500 uppercase">AI Prompt</h4>
                  <p className="mt-1 text-sm bg-gray-50 p-2 rounded">{rule.prompt}</p>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Created: {new Date(rule.createdAt).toLocaleDateString()}</span>
                  <span>Updated: {new Date(rule.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
