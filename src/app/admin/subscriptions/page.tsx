'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SubscriptionPlan, SubscriptionService } from '@/lib/services/subscription-service';

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  const router = useRouter();

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/admin/subscription/plans');
      if (!response.ok) throw new Error('Failed to load subscription plans');
      
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (err) {
      console.error('Error fetching subscription plans:', err);
      setError('Failed to load subscription plans. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPlan = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setIsCreating(false);
  };

  const handleCreatePlan = () => {
    setEditingPlan({
      id: '',
      name: '',
      description: '',
      price: 0,
      billing_interval: 'monthly',
      features: {},
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    setIsCreating(true);
  };

  const handleSavePlan = async (plan: SubscriptionPlan) => {
    try {
      const url = isCreating 
        ? '/api/admin/subscription/plans' 
        : `/api/admin/subscription/plans/${plan.id}`;
      
      const method = isCreating ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plan })
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isCreating ? 'create' : 'update'} plan`);
      }

      // Refresh plans list
      await fetchPlans();
      
      // Close editor
      setEditingPlan(null);
      setIsCreating(false);
    } catch (err) {
      console.error('Error saving plan:', err);
      alert(`Failed to ${isCreating ? 'create' : 'update'} plan. Please try again.`);
    }
  };

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const response = await fetch(`/api/admin/subscription/plans/${plan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ is_active: !plan.is_active })
      });

      if (!response.ok) {
        throw new Error('Failed to update plan status');
      }

      // Refresh plans list
      await fetchPlans();
    } catch (err) {
      console.error('Error toggling plan status:', err);
      alert('Failed to update plan status. Please try again.');
    }
  };

  const formatFeatures = (features: Record<string, any>) => {
    return Object.entries(features).map(([key, value]) => {
      if (typeof value === 'boolean') {
        return `${key}: ${value ? 'Yes' : 'No'}`;
      }
      if (typeof value === 'number') {
        return `${key}: ${value}`;
      }
      return `${key}: ${value}`;
    }).join(', ');
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Plans Management</h1>
          <div className="animate-pulse space-y-4">
            <div className="h-10 bg-gray-200 rounded w-full"></div>
            <div className="h-64 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Subscription Plans Management</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Subscription Plans Management</h1>
          <button 
            onClick={handleCreatePlan}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Create New Plan
          </button>
        </div>
        
        {editingPlan ? (
          <PlanEditor 
            plan={editingPlan} 
            isCreating={isCreating}
            onSave={handleSavePlan}
            onCancel={() => setEditingPlan(null)}
          />
        ) : (
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Billing
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Features
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {plan.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${plan.price}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {plan.billing_interval}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {formatFeatures(plan.features)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {plan.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditPlan(plan)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => handleToggleActive(plan)}
                        className={`${plan.is_active ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                      >
                        {plan.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

interface PlanEditorProps {
  plan: SubscriptionPlan;
  isCreating: boolean;
  onSave: (plan: SubscriptionPlan) => void;
  onCancel: () => void;
}

function PlanEditor({ plan, isCreating, onSave, onCancel }: PlanEditorProps) {
  const [editedPlan, setEditedPlan] = useState<SubscriptionPlan>({...plan});
  const [featureKey, setFeatureKey] = useState('');
  const [featureValue, setFeatureValue] = useState<string | number | boolean>('');
  const [featureType, setFeatureType] = useState<'boolean' | 'number' | 'string'>('boolean');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'price') {
      setEditedPlan({...editedPlan, [name]: parseFloat(value) || 0});
    } else if (name === 'is_active') {
      setEditedPlan({...editedPlan, [name]: (e.target as HTMLInputElement).checked});
    } else {
      setEditedPlan({...editedPlan, [name]: value});
    }
  };

  const handleAddFeature = () => {
    if (!featureKey.trim()) return;
    
    let parsedValue: boolean | number | string = featureValue;
    
    if (featureType === 'boolean') {
      parsedValue = featureValue === 'true';
    } else if (featureType === 'number') {
      parsedValue = parseFloat(featureValue as string) || 0;
    }
    
    setEditedPlan({
      ...editedPlan,
      features: {
        ...editedPlan.features,
        [featureKey]: parsedValue
      }
    });
    
    // Reset inputs
    setFeatureKey('');
    setFeatureValue('');
    setFeatureType('boolean');
  };

  const handleRemoveFeature = (key: string) => {
    const updatedFeatures = {...editedPlan.features};
    delete updatedFeatures[key];
    
    setEditedPlan({
      ...editedPlan,
      features: updatedFeatures
    });
  };

  const handleFeatureTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const type = e.target.value as 'boolean' | 'number' | 'string';
    setFeatureType(type);
    
    // Reset value based on type
    if (type === 'boolean') {
      setFeatureValue('true');
    } else if (type === 'number') {
      setFeatureValue(0);
    } else {
      setFeatureValue('');
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">{isCreating ? 'Create New Plan' : 'Edit Plan'}</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={editedPlan.name}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input
            type="number"
            name="price"
            value={editedPlan.price}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            min="0"
            step="0.01"
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Billing Interval</label>
          <select
            name="billing_interval"
            value={editedPlan.billing_interval}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_active"
              checked={editedPlan.is_active}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">Active</span>
          </div>
        </div>
      </div>
      
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          value={editedPlan.description || ''}
          onChange={handleInputChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          rows={3}
        />
      </div>
      
      <div className="mb-6">
        <h3 className="text-lg font-medium mb-2">Features</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Feature Key</label>
            <input
              type="text"
              value={featureKey}
              onChange={(e) => setFeatureKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g. MAX_USERS"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={featureType}
              onChange={handleFeatureTypeChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="boolean">Boolean</option>
              <option value="number">Number</option>
              <option value="string">String</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
            {featureType === 'boolean' ? (
              <select
                value={featureValue as string}
                onChange={(e) => setFeatureValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            ) : featureType === 'number' ? (
              <input
                type="number"
                value={featureValue as number}
                onChange={(e) => setFeatureValue(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            ) : (
              <input
                type="text"
                value={featureValue as string}
                onChange={(e) => setFeatureValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            )}
          </div>
        </div>
        
        <button
          type="button"
          onClick={handleAddFeature}
          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
        >
          Add Feature
        </button>
        
        {Object.keys(editedPlan.features).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Features</h4>
            <div className="bg-gray-50 p-4 rounded-md">
              <ul className="space-y-2">
                {Object.entries(editedPlan.features).map(([key, value]) => (
                  <li key={key} className="flex justify-between items-center">
                    <span>
                      <strong>{key}:</strong> {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value.toString()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(key)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSave(editedPlan)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {isCreating ? 'Create Plan' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
