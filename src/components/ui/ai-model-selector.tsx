'use client';

import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Brain, Sparkles, Crown } from 'lucide-react';

interface AIModel {
  id: string;
  name: string;
  description: string;
  costPer1kTokens: number;
  capabilities: {
    reasoning: number;
    speed: number;
    creativity: number;
    accuracy: number;
  };
}

interface AIModelSelectorProps {
  selectedModel?: string;
  onModelChange: (modelId: string) => void;
  className?: string;
}

const MODELS: AIModel[] = [
  {
    id: 'auto',
    name: 'Auto Select',
    description: 'Let AI choose the best model for the task',
    costPer1kTokens: 0,
    capabilities: { reasoning: 8, speed: 9, creativity: 8, accuracy: 9 }
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Best balance of performance and cost',
    costPer1kTokens: 0.00015,
    capabilities: { reasoning: 8, speed: 8, creativity: 8, accuracy: 9 }
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and cost-effective for simple tasks',
    costPer1kTokens: 0.0015,
    capabilities: { reasoning: 7, speed: 9, creativity: 7, accuracy: 8 }
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model for complex reasoning',
    costPer1kTokens: 0.005,
    capabilities: { reasoning: 10, speed: 7, creativity: 9, accuracy: 10 }
  },
  {
    id: 'gpt-4',
    name: 'GPT-4',
    description: 'Premium model for highest quality results',
    costPer1kTokens: 0.03,
    capabilities: { reasoning: 9, speed: 6, creativity: 9, accuracy: 9 }
  }
];

const getModelIcon = (modelId: string) => {
  switch (modelId) {
    case 'auto': return <Sparkles className="h-4 w-4 text-purple-500" />;
    case 'gpt-4o-mini': return <Zap className="h-4 w-4 text-green-500" />;
    case 'gpt-3.5-turbo': return <Zap className="h-4 w-4 text-blue-500" />;
    case 'gpt-4o': return <Brain className="h-4 w-4 text-orange-500" />;
    case 'gpt-4': return <Crown className="h-4 w-4 text-yellow-500" />;
    default: return <Brain className="h-4 w-4" />;
  }
};

const getCostBadge = (cost: number) => {
  if (cost === 0) return <Badge variant="secondary">Smart</Badge>;
  if (cost <= 0.001) return <Badge variant="secondary" className="bg-green-100 text-green-800">Cheap</Badge>;
  if (cost <= 0.01) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Medium</Badge>;
  return <Badge variant="secondary" className="bg-red-100 text-red-800">Premium</Badge>;
};

export function AIModelSelector({ selectedModel = 'auto', onModelChange, className = '' }: AIModelSelectorProps) {
  const [userPreference, setUserPreference] = useState<string>(selectedModel);

  useEffect(() => {
    setUserPreference(selectedModel);
  }, [selectedModel]);

  const handleModelChange = async (modelId: string) => {
    setUserPreference(modelId);
    onModelChange(modelId);

    // Save user preference to backend
    try {
      await fetch('/api/ai/model-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          preferredModel: modelId === 'auto' ? null : modelId,
        }),
      });
    } catch (error) {
      console.error('Failed to save model preference:', error);
    }
  };

  const selectedModelData = MODELS.find(m => m.id === userPreference) || MODELS[0];

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">AI Model</label>
        {getCostBadge(selectedModelData.costPer1kTokens)}
      </div>
      
      <Select value={userPreference} onValueChange={handleModelChange}>
        <SelectTrigger className="w-full">
          <SelectValue>
            <div className="flex items-center space-x-2">
              {getModelIcon(userPreference)}
              <span>{selectedModelData.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {MODELS.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              <div className="flex items-start space-x-3 py-1">
                {getModelIcon(model.id)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{model.name}</span>
                    {getCostBadge(model.costPer1kTokens)}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{model.description}</p>
                  {model.id !== 'auto' && (
                    <div className="flex space-x-3 text-xs text-gray-400 mt-1">
                      <span>Speed: {model.capabilities.speed}/10</span>
                      <span>Quality: {model.capabilities.accuracy}/10</span>
                    </div>
                  )}
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <p className="text-xs text-gray-500">{selectedModelData.description}</p>
    </div>
  );
}





