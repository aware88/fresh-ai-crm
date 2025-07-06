'use client';

import { useState, useEffect } from 'react';
import { Tag, Plus, X, Save, AlertCircle } from 'lucide-react';

interface StatusMapping {
  id: string;
  emailPattern: string;
  status: string;
  color: string;
  priority: number;
}

interface EmailStatusMappingProps {
  onSave?: (mappings: StatusMapping[]) => void;
}

export default function EmailStatusMapping({ onSave }: EmailStatusMappingProps) {
  const [mappings, setMappings] = useState<StatusMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentMapping, setCurrentMapping] = useState<StatusMapping | null>(null);
  
  // Available status options
  const statusOptions = [
    { value: 'new', label: 'New', color: '#3b82f6' },
    { value: 'in-progress', label: 'In Progress', color: '#f59e0b' },
    { value: 'waiting', label: 'Waiting', color: '#8b5cf6' },
    { value: 'completed', label: 'Completed', color: '#10b981' },
    { value: 'cancelled', label: 'Cancelled', color: '#ef4444' },
  ];

  // Load existing mappings
  useEffect(() => {
    async function loadMappings() {
      try {
        setLoading(true);
        // In a real implementation, this would fetch from an API
        // For now, we'll use sample data
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const sampleMappings: StatusMapping[] = [
          {
            id: '1',
            emailPattern: 'support@',
            status: 'new',
            color: '#3b82f6',
            priority: 1
          },
          {
            id: '2',
            emailPattern: 'urgent',
            status: 'in-progress',
            color: '#f59e0b',
            priority: 2
          },
          {
            id: '3',
            emailPattern: 'completed',
            status: 'completed',
            color: '#10b981',
            priority: 3
          },
        ];
        
        setMappings(sampleMappings);
        setError(null);
      } catch (err: any) {
        console.error('Failed to load status mappings:', err);
        setError('Failed to load status mappings');
      } finally {
        setLoading(false);
      }
    }
    
    loadMappings();
  }, []);

  const handleAddMapping = () => {
    setCurrentMapping({
      id: `mapping-${Date.now()}`,
      emailPattern: '',
      status: 'new',
      color: '#3b82f6',
      priority: mappings.length + 1
    });
    setIsEditing(true);
  };

  const handleEditMapping = (mapping: StatusMapping) => {
    setCurrentMapping({ ...mapping });
    setIsEditing(true);
  };

  const handleDeleteMapping = (id: string) => {
    setMappings(mappings.filter(m => m.id !== id));
    if (onSave) {
      onSave(mappings.filter(m => m.id !== id));
    }
  };

  const handleSaveMapping = () => {
    if (!currentMapping || !currentMapping.emailPattern.trim()) {
      return;
    }
    
    const updatedMappings = currentMapping.id
      ? mappings.map(m => m.id === currentMapping.id ? currentMapping : m)
      : [...mappings, currentMapping];
    
    setMappings(updatedMappings);
    setIsEditing(false);
    setCurrentMapping(null);
    
    if (onSave) {
      onSave(updatedMappings);
    }
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    
    const newMappings = [...mappings];
    [newMappings[index - 1], newMappings[index]] = [newMappings[index], newMappings[index - 1]];
    
    // Update priorities
    newMappings.forEach((mapping, idx) => {
      mapping.priority = idx + 1;
    });
    
    setMappings(newMappings);
    if (onSave) {
      onSave(newMappings);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index >= mappings.length - 1) return;
    
    const newMappings = [...mappings];
    [newMappings[index], newMappings[index + 1]] = [newMappings[index + 1], newMappings[index]];
    
    // Update priorities
    newMappings.forEach((mapping, idx) => {
      mapping.priority = idx + 1;
    });
    
    setMappings(newMappings);
    if (onSave) {
      onSave(newMappings);
    }
  };

  return (
    <div className="email-status-mapping">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Email Status Mappings</h3>
        <button
          onClick={handleAddMapping}
          className="flex items-center px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
          disabled={isEditing}
        >
          <Plus size={16} className="mr-1" />
          Add Mapping
        </button>
      </div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 flex items-center">
          <AlertCircle size={16} className="mr-2" />
          {error}
        </div>
      )}
      
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div>
          <p className="text-sm text-gray-500 mt-2">Loading status mappings...</p>
        </div>
      ) : isEditing ? (
        <div className="bg-gray-50 p-4 rounded-md border">
          <h4 className="font-medium mb-3">
            {currentMapping?.id.startsWith('mapping-') ? 'Add New Mapping' : 'Edit Mapping'}
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Pattern (text to match in emails)
              </label>
              <input
                type="text"
                value={currentMapping?.emailPattern || ''}
                onChange={(e) => setCurrentMapping(prev => prev ? { ...prev, emailPattern: e.target.value } : null)}
                className="w-full px-3 py-2 border rounded-md"
                placeholder="e.g., support@, urgent, invoice"
              />
              <p className="text-xs text-gray-500 mt-1">
                Emails containing this text will be assigned the selected status
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={currentMapping?.status || ''}
                onChange={(e) => {
                  const selectedStatus = e.target.value;
                  const selectedColor = statusOptions.find(opt => opt.value === selectedStatus)?.color || '#3b82f6';
                  setCurrentMapping(prev => prev ? { ...prev, status: selectedStatus, color: selectedColor } : null);
                }}
                className="w-full px-3 py-2 border rounded-md"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setCurrentMapping(null);
                }}
                className="px-4 py-2 border rounded-md text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMapping}
                disabled={!currentMapping?.emailPattern.trim()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Save size={16} className="mr-1" />
                Save Mapping
              </button>
            </div>
          </div>
        </div>
      ) : mappings.length === 0 ? (
        <div className="text-center py-8 border rounded-md bg-gray-50">
          <Tag size={24} className="mx-auto text-gray-400" />
          <p className="mt-2 text-gray-500">No status mappings defined</p>
          <p className="text-sm text-gray-400">
            Add mappings to automatically categorize emails based on their content
          </p>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email Pattern
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mappings.map((mapping, index) => (
                <tr key={mapping.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === mappings.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:text-gray-200"
                      >
                        ↓
                      </button>
                      <span className="ml-1">{mapping.priority}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <code className="bg-gray-100 px-2 py-1 rounded">{mapping.emailPattern}</code>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${mapping.color}20`,
                        color: mapping.color,
                      }}
                    >
                      {statusOptions.find(opt => opt.value === mapping.status)?.label || mapping.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEditMapping(mapping)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteMapping(mapping.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>
          <strong>Note:</strong> Mappings are applied in priority order. The first matching pattern will determine the email status.
        </p>
      </div>
    </div>
  );
}
