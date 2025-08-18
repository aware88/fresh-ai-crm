'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, Settings, TrendingUp, Percent, AlertCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface ProductRelationship {
  id: string;
  source_product_keywords: string[];
  target_product_keywords: string[];
  target_product_id?: string;
  relationship_type: 'complementary' | 'premium' | 'accessory' | 'bundle';
  confidence_score: number;
  auto_discovered: boolean;
  created_at: string;
  updated_at: string;
}

interface UpsellingConfig {
  enabled: boolean;
  strategies: {
    complementary_products: { enabled: boolean; weight: number; description: string };
    premium_versions: { enabled: boolean; weight: number; description: string };
    seasonal_items: { enabled: boolean; weight: number; description: string };
    maintenance_products: { enabled: boolean; weight: number; description: string };
  };
  max_suggestions: number;
  min_confidence: number;
  discount_strategy: {
    enabled: boolean;
    max_discount_percent: number;
    offer_after_rejection: boolean;
    escalation_steps: Array<{
      step: number;
      discount_percent: number;
      trigger: 'rejection' | 'hesitation' | 'price_inquiry';
    }>;
  };
  product_relationships: ProductRelationship[];
  email_learning: {
    enabled: boolean;
    learn_from_sent_emails: boolean;
    learn_from_successful_sales: boolean;
    min_pattern_confidence: number;
  };
}

export default function UpsellSettingsPage() {
  const { data: session } = useSession();
  const [config, setConfig] = useState<UpsellingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newRelationship, setNewRelationship] = useState({
    source_keywords: '',
    target_keywords: '',
    relationship_type: 'complementary' as const,
    confidence_score: 0.8
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const response = await fetch('/api/settings/upsell');
      if (response.ok) {
        const data = await response.json();
        setConfig(data.config);
      } else {
        // Load default config
        setConfig(getDefaultConfig());
      }
    } catch (error) {
      console.error('Error loading upsell config:', error);
      setConfig(getDefaultConfig());
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    if (!config) return;
    
    setSaving(true);
    try {
      const response = await fetch('/api/settings/upsell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Upsell settings saved successfully",
        });
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      toast({
        title: "Error",
        description: "Failed to save upsell settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addProductRelationship = () => {
    if (!config || !newRelationship.source_keywords || !newRelationship.target_keywords) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const relationship: ProductRelationship = {
      id: `rel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      source_product_keywords: newRelationship.source_keywords.split(',').map(k => k.trim()),
      target_product_keywords: newRelationship.target_keywords.split(',').map(k => k.trim()),
      relationship_type: newRelationship.relationship_type,
      confidence_score: newRelationship.confidence_score,
      auto_discovered: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setConfig({
      ...config,
      product_relationships: [...config.product_relationships, relationship]
    });

    setNewRelationship({
      source_keywords: '',
      target_keywords: '',
      relationship_type: 'complementary',
      confidence_score: 0.8
    });

    toast({
      title: "Success",
      description: "Product relationship added",
    });
  };

  const removeProductRelationship = (id: string) => {
    if (!config) return;
    
    setConfig({
      ...config,
      product_relationships: config.product_relationships.filter(r => r.id !== id)
    });
    
    toast({
      title: "Success",
      description: "Product relationship removed",
    });
  };

  const getDefaultConfig = (): UpsellingConfig => ({
    enabled: true,
    strategies: {
      complementary_products: { enabled: true, weight: 0.8, description: 'Products that work well together' },
      premium_versions: { enabled: true, weight: 0.7, description: 'Higher-end versions of the same product' },
      seasonal_items: { enabled: false, weight: 0.6, description: 'Seasonal or time-sensitive items' },
      maintenance_products: { enabled: false, weight: 0.5, description: 'Maintenance or care products' }
    },
    max_suggestions: 3,
    min_confidence: 0.6,
    discount_strategy: {
      enabled: true,
      max_discount_percent: 15,
      offer_after_rejection: true,
      escalation_steps: [
        { step: 1, discount_percent: 5, trigger: 'price_inquiry' },
        { step: 1, discount_percent: 10, trigger: 'rejection' },
        { step: 2, discount_percent: 15, trigger: 'rejection' }
      ]
    },
    product_relationships: [],
    email_learning: {
      enabled: true,
      learn_from_sent_emails: true,
      learn_from_successful_sales: true,
      min_pattern_confidence: 0.7
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!config) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Upsell Settings</h1>
          <p className="text-muted-foreground">Configure intelligent product upselling for your emails</p>
        </div>
        <Button onClick={saveConfig} disabled={saving}>
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            General
          </TabsTrigger>
          <TabsTrigger value="products" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Product Relationships
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center gap-2">
            <Percent className="h-4 w-4" />
            Discount Strategy
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upselling Framework</CardTitle>
              <CardDescription>
                Enable intelligent product upselling in your email responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Upselling</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically suggest related products in email responses
                  </p>
                </div>
                <Switch
                  checked={config.enabled}
                  onCheckedChange={(enabled) => setConfig({ ...config, enabled })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_suggestions">Max Suggestions</Label>
                  <Input
                    id="max_suggestions"
                    type="number"
                    min="1"
                    max="10"
                    value={config.max_suggestions}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      max_suggestions: parseInt(e.target.value) || 3 
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_confidence">Min Confidence</Label>
                  <Input
                    id="min_confidence"
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={config.min_confidence}
                    onChange={(e) => setConfig({ 
                      ...config, 
                      min_confidence: parseFloat(e.target.value) || 0.6 
                    })}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <Label>Upselling Strategies</Label>
                {Object.entries(config.strategies).map(([key, strategy]) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <Label className="capitalize">{key.replace('_', ' ')}</Label>
                      <p className="text-sm text-muted-foreground">{strategy.description}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="space-y-1">
                        <Label className="text-xs">Weight</Label>
                        <Input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={strategy.weight}
                          onChange={(e) => setConfig({
                            ...config,
                            strategies: {
                              ...config.strategies,
                              [key]: {
                                ...strategy,
                                weight: parseFloat(e.target.value) || 0.5
                              }
                            }
                          })}
                          className="w-20"
                        />
                      </div>
                      <Switch
                        checked={strategy.enabled}
                        onCheckedChange={(enabled) => setConfig({
                          ...config,
                          strategies: {
                            ...config.strategies,
                            [key]: { ...strategy, enabled }
                          }
                        })}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-medium text-blue-900">Email Learning</p>
                      <p className="text-sm text-blue-700">
                        The system can learn upselling patterns from your existing emails to automatically discover new product relationships.
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            size="sm"
                            checked={config.email_learning.enabled}
                            onCheckedChange={(enabled) => setConfig({
                              ...config,
                              email_learning: { ...config.email_learning, enabled }
                            })}
                          />
                          Enable Learning
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                          <Switch
                            size="sm"
                            checked={config.email_learning.learn_from_sent_emails}
                            onCheckedChange={(enabled) => setConfig({
                              ...config,
                              email_learning: { ...config.email_learning, learn_from_sent_emails: enabled }
                            })}
                          />
                          Learn from Sent Emails
                        </label>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Relationships</CardTitle>
              <CardDescription>
                Define which products should be suggested together
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30">
                <div className="space-y-2">
                  <Label htmlFor="source_keywords">Source Product Keywords</Label>
                  <Input
                    id="source_keywords"
                    placeholder="car mats, floor mats"
                    value={newRelationship.source_keywords}
                    onChange={(e) => setNewRelationship({
                      ...newRelationship,
                      source_keywords: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_keywords">Target Product Keywords</Label>
                  <Input
                    id="target_keywords"
                    placeholder="trunk liner, cargo mat"
                    value={newRelationship.target_keywords}
                    onChange={(e) => setNewRelationship({
                      ...newRelationship,
                      target_keywords: e.target.value
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="relationship_type">Relationship Type</Label>
                  <select
                    id="relationship_type"
                    value={newRelationship.relationship_type}
                    onChange={(e) => setNewRelationship({
                      ...newRelationship,
                      relationship_type: e.target.value as any
                    })}
                    className="w-full px-3 py-2 border border-input bg-background rounded-md"
                  >
                    <option value="complementary">Complementary</option>
                    <option value="premium">Premium</option>
                    <option value="accessory">Accessory</option>
                    <option value="bundle">Bundle</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <Button onClick={addProductRelationship} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                {config.product_relationships.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No product relationships configured yet. Add some above to get started.
                  </p>
                ) : (
                  config.product_relationships.map((relationship) => (
                    <div key={relationship.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {relationship.relationship_type}
                          </Badge>
                          <Badge variant="secondary">
                            {Math.round(relationship.confidence_score * 100)}% confidence
                          </Badge>
                          {relationship.auto_discovered && (
                            <Badge variant="default">Auto-discovered</Badge>
                          )}
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">
                            {relationship.source_product_keywords.join(', ')}
                          </span>
                          {' → '}
                          <span className="font-medium">
                            {relationship.target_product_keywords.join(', ')}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeProductRelationship(relationship.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discounts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Discount Strategy</CardTitle>
              <CardDescription>
                Configure when and how to offer discounts on upsell products
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Discount Strategy</Label>
                  <p className="text-sm text-muted-foreground">
                    Offer discounts when customers show hesitation or reject offers
                  </p>
                </div>
                <Switch
                  checked={config.discount_strategy.enabled}
                  onCheckedChange={(enabled) => setConfig({
                    ...config,
                    discount_strategy: { ...config.discount_strategy, enabled }
                  })}
                />
              </div>

              {config.discount_strategy.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max_discount">Max Discount (%)</Label>
                      <Input
                        id="max_discount"
                        type="number"
                        min="0"
                        max="50"
                        value={config.discount_strategy.max_discount_percent}
                        onChange={(e) => setConfig({
                          ...config,
                          discount_strategy: {
                            ...config.discount_strategy,
                            max_discount_percent: parseInt(e.target.value) || 15
                          }
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between pt-8">
                      <div className="space-y-0.5">
                        <Label>Offer After Rejection</Label>
                        <p className="text-xs text-muted-foreground">
                          Automatically offer discount after customer rejects
                        </p>
                      </div>
                      <Switch
                        checked={config.discount_strategy.offer_after_rejection}
                        onCheckedChange={(enabled) => setConfig({
                          ...config,
                          discount_strategy: { ...config.discount_strategy, offer_after_rejection: enabled }
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>Escalation Steps</Label>
                    {config.discount_strategy.escalation_steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                        <div className="text-sm font-medium">Step {step.step}</div>
                        <div className="text-sm">{step.discount_percent}% discount</div>
                        <Badge variant="outline" className="capitalize">{step.trigger.replace('_', ' ')}</Badge>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
