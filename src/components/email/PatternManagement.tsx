'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Edit3, 
  Trash2, 
  Plus, 
  TrendingUp, 
  TrendingDown,
  Search,
  Filter,
  BarChart3,
  Target,
  MessageSquare,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface LearningPattern {
  id: string;
  pattern_type: string;
  context_category: string;
  trigger_keywords: string[];
  response_template: string;
  confidence_score: number;
  usage_count: number;
  success_rate: number;
  last_used_at: string | null;
  created_at: string;
  example_pairs: Array<{ question: string; answer: string }>;
  learning_quality: string;
}

interface PatternStats {
  total_patterns: number;
  high_quality_patterns: number;
  active_patterns: number;
  avg_confidence: number;
  avg_success_rate: number;
  most_used_pattern_type: string;
}

export default function PatternManagement() {
  const { data: session } = useSession();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [patterns, setPatterns] = useState<LearningPattern[]>([]);
  const [filteredPatterns, setFilteredPatterns] = useState<LearningPattern[]>([]);
  const [patternStats, setPatternStats] = useState<PatternStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterQuality, setFilterQuality] = useState<string>('all');
  const [selectedPattern, setSelectedPattern] = useState<LearningPattern | null>(null);
  const [editingPattern, setEditingPattern] = useState(false);
  const [showCreatePattern, setShowCreatePattern] = useState(false);
  
  // New pattern form
  const [newPattern, setNewPattern] = useState({
    pattern_type: 'question_response',
    context_category: 'general',
    trigger_keywords: '',
    response_template: '',
    confidence_score: 0.7
  });

  useEffect(() => {
    if (session?.user?.id) {
      loadPatterns();
      loadPatternStats();
    }
  }, [session]);

  useEffect(() => {
    filterPatterns();
  }, [patterns, searchTerm, filterType, filterQuality]);

  const loadPatterns = async () => {
    try {
      const response = await fetch('/api/email/learning/patterns');
      if (response.ok) {
        const data = await response.json();
        setPatterns(data.patterns || []);
      }
    } catch (error) {
      console.error('Error loading patterns:', error);
      toast({
        title: "Error",
        description: "Failed to load learning patterns",
        variant: "destructive"
      });
    }
  };

  const loadPatternStats = async () => {
    try {
      const response = await fetch('/api/email/learning/analytics');
      if (response.ok) {
        const data = await response.json();
        setPatternStats(data.stats);
      }
    } catch (error) {
      console.error('Error loading pattern stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterPatterns = () => {
    let filtered = patterns;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pattern => 
        pattern.pattern_type?.toLowerCase().includes(term) ||
        pattern.context_category?.toLowerCase().includes(term) ||
        pattern.trigger_keywords?.some(keyword => keyword.toLowerCase().includes(term)) ||
        pattern.response_template?.toLowerCase().includes(term)
      );
    }

    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(pattern => pattern.pattern_type === filterType);
    }

    // Quality filter
    if (filterQuality !== 'all') {
      filtered = filtered.filter(pattern => pattern.learning_quality === filterQuality);
    }

    setFilteredPatterns(filtered);
  };

  const createPattern = async () => {
    try {
      const response = await fetch('/api/email/learning/patterns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newPattern,
          trigger_keywords: newPattern.trigger_keywords.split(',').map(k => k.trim()).filter(k => k)
        })
      });

      if (response.ok) {
        toast({
          title: "Pattern Created",
          description: "Custom pattern created successfully",
        });
        setShowCreatePattern(false);
        setNewPattern({
          pattern_type: 'question_response',
          context_category: 'general',
          trigger_keywords: '',
          response_template: '',
          confidence_score: 0.7
        });
        await loadPatterns();
      } else {
        throw new Error('Failed to create pattern');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create pattern",
        variant: "destructive"
      });
    }
  };

  const updatePattern = async (patternId: string, updates: Partial<LearningPattern>) => {
    try {
      const response = await fetch(`/api/email/learning/patterns/${patternId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      if (response.ok) {
        toast({
          title: "Pattern Updated",
          description: "Pattern updated successfully",
        });
        setEditingPattern(false);
        await loadPatterns();
      } else {
        throw new Error('Failed to update pattern');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update pattern",
        variant: "destructive"
      });
    }
  };

  const deletePattern = async (patternId: string) => {
    if (!confirm('Are you sure you want to delete this pattern?')) return;

    try {
      const response = await fetch(`/api/email/learning/patterns/${patternId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Pattern Deleted",
          description: "Pattern deleted successfully",
        });
        setSelectedPattern(null);
        await loadPatterns();
      } else {
        throw new Error('Failed to delete pattern');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete pattern",
        variant: "destructive"
      });
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSuccessRateIcon = (rate: number) => {
    if (rate >= 0.8) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (rate >= 0.6) return <BarChart3 className="h-4 w-4 text-yellow-600" />;
    return <TrendingDown className="h-4 w-4 text-red-600" />;
  };

  const uniquePatternTypes = [...new Set(patterns.map(p => p.pattern_type))];

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pattern Statistics */}
      {patternStats && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <CardTitle>Pattern Analytics</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {patternStats.total_patterns}
                </div>
                <div className="text-sm text-gray-600">Total Patterns</div>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {patternStats.high_quality_patterns}
                </div>
                <div className="text-sm text-gray-600">High Quality</div>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {patternStats.active_patterns}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round(patternStats.avg_confidence * 100)}%
                </div>
                <div className="text-sm text-gray-600">Avg Confidence</div>
              </div>
              
              <div className="text-center p-3 bg-cyan-50 rounded-lg">
                <div className="text-2xl font-bold text-cyan-600">
                  {Math.round(patternStats.avg_success_rate * 100)}%
                </div>
                <div className="text-sm text-gray-600">Success Rate</div>
              </div>
              
              <div className="text-center p-3 bg-pink-50 rounded-lg">
                <div className="text-sm font-medium text-pink-800">
                  {patternStats.most_used_pattern_type.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-600">Most Used Type</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pattern Management Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <CardTitle>Pattern Management</CardTitle>
            </div>
            <Button onClick={() => setShowCreatePattern(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Pattern
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search patterns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {uniquePatternTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterQuality} onValueChange={setFilterQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Quality</SelectItem>
                <SelectItem value="high">High Quality</SelectItem>
                <SelectItem value="medium">Medium Quality</SelectItem>
                <SelectItem value="low">Low Quality</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-600 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredPatterns.length} of {patterns.length} patterns
            </div>
          </div>

          {/* Pattern List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredPatterns.map(pattern => (
              <div
                key={pattern.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedPattern?.id === pattern.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedPattern(pattern)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs">
                        {pattern.pattern_type?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {pattern.context_category || 'No category'}
                      </Badge>
                      <Badge className={`text-xs ${getQualityColor(pattern.learning_quality)}`}>
                        {pattern.learning_quality}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      Keywords: {pattern.trigger_keywords?.slice(0, 3)?.join(', ') || 'None'}
                      {pattern.trigger_keywords?.length > 3 && '...'}
                    </div>
                    
                    <div className="text-sm text-gray-800 line-clamp-2">
                      {pattern.response_template?.substring(0, 100) || 'No template'}...
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 ml-4">
                    <div className="text-center">
                      <div className="font-medium">{Math.round((pattern.confidence_score || 0) * 100)}%</div>
                      <div className="text-xs">Confidence</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        {getSuccessRateIcon(pattern.success_rate)}
                        <span className="font-medium">{Math.round(pattern.success_rate * 100)}%</span>
                      </div>
                      <div className="text-xs">Success</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-medium">{pattern.usage_count}</div>
                      <div className="text-xs">Uses</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Selected Pattern Details */}
      {selectedPattern && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pattern Details</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingPattern(!editingPattern)}
                  className="flex items-center gap-2"
                >
                  <Edit3 className="h-4 w-4" />
                  {editingPattern ? 'Cancel' : 'Edit'}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deletePattern(selectedPattern.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {editingPattern ? (
              // Edit Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Pattern Type</Label>
                    <Select 
                      value={selectedPattern.pattern_type} 
                      onValueChange={(value) => setSelectedPattern({...selectedPattern, pattern_type: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="question_response">Question Response</SelectItem>
                        <SelectItem value="greeting_style">Greeting Style</SelectItem>
                        <SelectItem value="closing_style">Closing Style</SelectItem>
                        <SelectItem value="complaint_handling">Complaint Handling</SelectItem>
                        <SelectItem value="sales_response">Sales Response</SelectItem>
                        <SelectItem value="technical_support">Technical Support</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Context Category</Label>
                    <Select 
                      value={selectedPattern.context_category} 
                      onValueChange={(value) => setSelectedPattern({...selectedPattern, context_category: value})}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="customer_inquiry">Customer Inquiry</SelectItem>
                        <SelectItem value="sales_request">Sales Request</SelectItem>
                        <SelectItem value="technical_support">Technical Support</SelectItem>
                        <SelectItem value="complaint">Complaint</SelectItem>
                        <SelectItem value="pricing">Pricing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Trigger Keywords (comma-separated)</Label>
                  <Input
                    value={selectedPattern.trigger_keywords?.join(', ') || ''}
                    onChange={(e) => setSelectedPattern({
                      ...selectedPattern, 
                      trigger_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)
                    })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label>Response Template</Label>
                  <Textarea
                    value={selectedPattern.response_template}
                    onChange={(e) => setSelectedPattern({...selectedPattern, response_template: e.target.value})}
                    rows={6}
                    className="mt-1"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button onClick={() => updatePattern(selectedPattern.id, selectedPattern)}>
                    Save Changes
                  </Button>
                  <Button variant="outline" onClick={() => setEditingPattern(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              // View Mode
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Pattern Type</Label>
                    <div className="mt-1">{selectedPattern.pattern_type?.replace('_', ' ') || 'Unknown'}</div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Context Category</Label>
                    <div className="mt-1">{selectedPattern.context_category}</div>
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Trigger Keywords</Label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {selectedPattern.trigger_keywords?.map(keyword => (
                      <Badge key={keyword} variant="outline" className="text-xs">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                <div>
                  <Label className="text-sm font-medium text-gray-600">Response Template</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-lg text-sm">
                    {selectedPattern.response_template}
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-lg font-bold">{Math.round((selectedPattern.confidence_score || 0) * 100)}%</div>
                    <div className="text-xs text-gray-600">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{Math.round((selectedPattern.success_rate || 0) * 100)}%</div>
                    <div className="text-xs text-gray-600">Success Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">{selectedPattern.usage_count || 0}</div>
                    <div className="text-xs text-gray-600">Times Used</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      {selectedPattern.last_used_at 
                        ? new Date(selectedPattern.last_used_at).toLocaleDateString()
                        : 'Never'
                      }
                    </div>
                    <div className="text-xs text-gray-600">Last Used</div>
                  </div>
                </div>
                
                {selectedPattern.example_pairs?.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium text-gray-600">Example Pairs</Label>
                    <div className="mt-2 space-y-2">
                      {selectedPattern.example_pairs?.slice(0, 2).map((pair, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg text-sm">
                          <div className="font-medium text-blue-800 mb-1">Q: {pair.question}</div>
                          <div className="text-blue-700">A: {pair.answer}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create New Pattern Modal */}
      {showCreatePattern && (
        <Card>
          <CardHeader>
            <CardTitle>Create Custom Pattern</CardTitle>
            <CardDescription>
              Create a custom email response pattern that will be used for future drafts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pattern Type</Label>
                <Select 
                  value={newPattern.pattern_type} 
                  onValueChange={(value) => setNewPattern({...newPattern, pattern_type: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="question_response">Question Response</SelectItem>
                    <SelectItem value="greeting_style">Greeting Style</SelectItem>
                    <SelectItem value="closing_style">Closing Style</SelectItem>
                    <SelectItem value="complaint_handling">Complaint Handling</SelectItem>
                    <SelectItem value="sales_response">Sales Response</SelectItem>
                    <SelectItem value="technical_support">Technical Support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Context Category</Label>
                <Select 
                  value={newPattern.context_category} 
                  onValueChange={(value) => setNewPattern({...newPattern, context_category: value})}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="customer_inquiry">Customer Inquiry</SelectItem>
                    <SelectItem value="sales_request">Sales Request</SelectItem>
                    <SelectItem value="technical_support">Technical Support</SelectItem>
                    <SelectItem value="complaint">Complaint</SelectItem>
                    <SelectItem value="pricing">Pricing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>Trigger Keywords (comma-separated)</Label>
              <Input
                placeholder="price, cost, pricing, quote"
                value={newPattern.trigger_keywords}
                onChange={(e) => setNewPattern({...newPattern, trigger_keywords: e.target.value})}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Response Template</Label>
              <Textarea
                placeholder="Thank you for your inquiry about pricing. I'll be happy to provide you with a quote..."
                value={newPattern.response_template}
                onChange={(e) => setNewPattern({...newPattern, response_template: e.target.value})}
                rows={6}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label>Confidence Score ({Math.round(newPattern.confidence_score * 100)}%)</Label>
              <Input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={newPattern.confidence_score}
                onChange={(e) => setNewPattern({...newPattern, confidence_score: parseFloat(e.target.value)})}
                className="mt-2"
              />
            </div>
            
            <div className="flex gap-2">
              <Button onClick={createPattern}>
                Create Pattern
              </Button>
              <Button variant="outline" onClick={() => setShowCreatePattern(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


