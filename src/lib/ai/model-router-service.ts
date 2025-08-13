/**
 * Model Router Service - Intelligent AI Model Selection
 * 
 * This service intelligently routes requests to the most appropriate AI model
 * based on task complexity, user preferences, and performance optimization.
 */

import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'local';
  modelName: string;
  maxTokens: number;
  costPer1kTokens: number;
  capabilities: {
    reasoning: number;      // 1-10 scale
    speed: number;          // 1-10 scale
    creativity: number;     // 1-10 scale
    accuracy: number;       // 1-10 scale
  };
  suitableFor: TaskComplexity[];
  description: string;
}

export enum TaskComplexity {
  SIMPLE = 'simple',
  STANDARD = 'standard',
  COMPLEX = 'complex'
}

export interface TaskAnalysis {
  complexity: TaskComplexity;
  confidence: number;
  reasoning: string[];
  suggestedModel: string;
  alternativeModels: string[];
  estimatedTokens: number;
  estimatedCost: number;
}

export interface ModelSelection {
  selectedModel: ModelConfig;
  reasoning: string[];
  alternatives: ModelConfig[];
  userOverride?: boolean;
  estimatedCost: number;
}

export interface ModelPerformance {
  modelId: string;
  taskType: string;
  complexity: TaskComplexity;
  successRate: number;
  averageResponseTime: number;
  userSatisfactionScore: number;
  totalUsage: number;
  lastUpdated: Date;
}

export class ModelRouterService {
  private supabase: SupabaseClient<Database>;
  private openai: OpenAI;
  private organizationId: string;
  private userId: string;
  private models: Map<string, ModelConfig> = new Map();
  private performanceCache: Map<string, ModelPerformance[]> = new Map();

  constructor(
    supabase: SupabaseClient<Database>,
    openai: OpenAI,
    organizationId: string,
    userId: string
  ) {
    this.supabase = supabase;
    this.openai = openai;
    this.organizationId = organizationId;
    this.userId = userId;
    this.initializeModels();
  }

  /**
   * Initialize available AI models with their configurations
   */
  private initializeModels(): void {
    const modelConfigs: ModelConfig[] = [
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        modelName: 'gpt-3.5-turbo',
        maxTokens: 4096,
        costPer1kTokens: 0.0015,
        capabilities: {
          reasoning: 7,
          speed: 9,
          creativity: 7,
          accuracy: 8
        },
        suitableFor: [TaskComplexity.SIMPLE, TaskComplexity.STANDARD],
        description: 'Fast and cost-effective for simple tasks'
      },
      {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openai',
        modelName: 'gpt-4o-mini',
        maxTokens: 8192,
        costPer1kTokens: 0.00015,
        capabilities: {
          reasoning: 8,
          speed: 8,
          creativity: 8,
          accuracy: 9
        },
        suitableFor: [TaskComplexity.SIMPLE, TaskComplexity.STANDARD],
        description: 'Best balance of performance and cost'
      },
      {
        id: 'gpt-4o',
        name: 'GPT-4o',
        provider: 'openai',
        modelName: 'gpt-4o',
        maxTokens: 8192,
        costPer1kTokens: 0.005,
        capabilities: {
          reasoning: 10,
          speed: 7,
          creativity: 9,
          accuracy: 10
        },
        suitableFor: [TaskComplexity.STANDARD, TaskComplexity.COMPLEX],
        description: 'Most capable model for complex reasoning'
      },
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        modelName: 'gpt-4',
        maxTokens: 8192,
        costPer1kTokens: 0.03,
        capabilities: {
          reasoning: 9,
          speed: 6,
          creativity: 9,
          accuracy: 9
        },
        suitableFor: [TaskComplexity.COMPLEX],
        description: 'Premium model for highest quality results'
      }
    ];

    modelConfigs.forEach(config => {
      this.models.set(config.id, config);
    });
  }

  /**
   * Analyze task complexity using multiple classification methods
   */
  async analyzeTaskComplexity(message: string, context?: any): Promise<TaskAnalysis> {
    const analysis = {
      patternScore: this.analyzePatterns(message),
      linguisticScore: this.analyzeLinguistics(message),
      contextScore: this.analyzeContext(message, context)
    };

    // Weighted average (patterns 40%, linguistics 35%, context 25%)
    const complexityScore = (
      analysis.patternScore * 0.4 +
      analysis.linguisticScore * 0.35 +
      analysis.contextScore * 0.25
    );

    let complexity: TaskComplexity;
    let confidence: number;

    if (complexityScore <= 3) {
      complexity = TaskComplexity.SIMPLE;
      confidence = Math.min(0.9, 0.6 + (3 - complexityScore) * 0.1);
    } else if (complexityScore <= 7) {
      complexity = TaskComplexity.STANDARD;
      confidence = Math.min(0.85, 0.7 + Math.abs(5 - complexityScore) * -0.05);
    } else {
      complexity = TaskComplexity.COMPLEX;
      confidence = Math.min(0.9, 0.6 + (complexityScore - 7) * 0.1);
    }

    const reasoning = this.generateComplexityReasoning(message, analysis, complexityScore);
    
    // Use enhanced model selection with learning
    const taskType = this.extractTaskType(message);
    const suggestedModel = await this.selectModelWithLearning(complexity, taskType);
    const alternatives = this.getAlternativeModels(complexity, suggestedModel);
    const estimatedTokens = this.estimateTokenUsage(message, complexity);
    const estimatedCost = this.calculateCost(estimatedTokens, suggestedModel);

    return {
      complexity,
      confidence,
      reasoning,
      suggestedModel,
      alternativeModels: alternatives,
      estimatedTokens,
      estimatedCost
    };
  }

  /**
   * Extract task type from message for better model selection
   */
  private extractTaskType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('add') || lowerMessage.includes('create')) {
      return 'CREATE';
    }
    if (lowerMessage.includes('update') || lowerMessage.includes('modify') || lowerMessage.includes('change')) {
      return 'UPDATE';
    }
    if (lowerMessage.includes('delete') || lowerMessage.includes('remove')) {
      return 'DELETE';
    }
    if (lowerMessage.includes('find') || lowerMessage.includes('search') || lowerMessage.includes('show') || lowerMessage.includes('list')) {
      return 'SEARCH';
    }
    if (lowerMessage.includes('analyze') || lowerMessage.includes('report') || lowerMessage.includes('calculate')) {
      return 'ANALYZE';
    }
    
    return 'general';
  }

  /**
   * Pattern-based complexity analysis
   */
  private analyzePatterns(message: string): number {
    const lowerMessage = message.toLowerCase();
    let score = 0;

    // Simple patterns (score: 1-3)
    const simplePatterns = [
      /^(add|create|show|list|find|get)\s+\w+/,
      /\b(supplier|product|contact)\b.*\b(email|phone|name)\b/,
      /^(what|who|when|where)\s+/
    ];

    // Standard patterns (score: 4-6)
    const standardPatterns = [
      /\b(update|modify|change)\b.*\bwhere\b/,
      /\b(filter|sort|group)\b/,
      /\bmultiple\b.*\b(criteria|conditions)\b/,
      /\b(analyze|compare|calculate)\b/
    ];

    // Complex patterns (score: 7-10)
    const complexPatterns = [
      /\b(cross|join|relationship|correlation)\b/,
      /\b(if|then|else|when|unless)\b.*\b(and|or)\b/,
      /\b(optimize|recommend|suggest|predict)\b/,
      /\b(report|dashboard|visualization)\b/,
      /\bmultiple\b.*\b(tables|entities|sources)\b/
    ];

    // Check patterns
    if (simplePatterns.some(pattern => pattern.test(lowerMessage))) {
      score = Math.max(score, 2);
    }
    if (standardPatterns.some(pattern => pattern.test(lowerMessage))) {
      score = Math.max(score, 5);
    }
    if (complexPatterns.some(pattern => pattern.test(lowerMessage))) {
      score = Math.max(score, 8);
    }

    // Default scoring based on message characteristics
    if (score === 0) {
      if (message.length < 20) score = 1;
      else if (message.length < 100) score = 3;
      else if (message.length < 200) score = 6;
      else score = 8;
    }

    return Math.min(10, score);
  }

  /**
   * Linguistic complexity analysis
   */
  private analyzeLinguistics(message: string): number {
    let score = 0;

    // Word count factor
    const words = message.split(/\s+/).length;
    if (words <= 5) score += 1;
    else if (words <= 15) score += 3;
    else if (words <= 30) score += 6;
    else score += 8;

    // Sentence complexity
    const sentences = message.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length > 3) score += 2;

    // Complex conjunctions and operators
    const complexWords = ['however', 'therefore', 'nevertheless', 'furthermore', 'moreover', 'consequently'];
    const logicalOperators = ['and', 'or', 'but', 'if', 'then', 'unless', 'except'];
    
    complexWords.forEach(word => {
      if (message.toLowerCase().includes(word)) score += 1;
    });
    
    const operatorCount = logicalOperators.filter(op => 
      message.toLowerCase().includes(` ${op} `)
    ).length;
    score += Math.min(3, operatorCount);

    // Technical terminology
    const technicalTerms = ['database', 'query', 'relationship', 'foreign key', 'index', 'aggregate', 'pivot'];
    const techCount = technicalTerms.filter(term => 
      message.toLowerCase().includes(term)
    ).length;
    score += Math.min(2, techCount);

    return Math.min(10, score);
  }

  /**
   * Context-based complexity analysis
   */
  private analyzeContext(message: string, context?: any): number {
    let score = 3; // Base score

    if (!context) return score;

    // Multi-entity operations
    if (context.lastEntity && message.toLowerCase().includes('and')) {
      score += 2;
    }

    // Recent complex operations
    if (context.lastAction === 'ANALYZE' || context.lastAction === 'CROSS_ENTITY') {
      score += 2;
    }

    // Multiple recent entities
    if (context.recentlyCreated && Object.keys(context.recentlyCreated).length > 1) {
      score += 1;
    }

    // Conversation history complexity
    if (context.conversationHistory && context.conversationHistory.length > 5) {
      score += 1;
    }

    return Math.min(10, score);
  }

  /**
   * Generate human-readable reasoning for complexity analysis
   */
  private generateComplexityReasoning(message: string, analysis: any, score: number): string[] {
    const reasoning: string[] = [];

    reasoning.push(`📊 **Complexity Analysis**: Score ${score.toFixed(1)}/10`);
    reasoning.push(`• Pattern analysis: ${analysis.patternScore.toFixed(1)}/10`);
    reasoning.push(`• Language complexity: ${analysis.linguisticScore.toFixed(1)}/10`);
    reasoning.push(`• Context factors: ${analysis.contextScore.toFixed(1)}/10`);

    // Add specific insights
    if (analysis.patternScore >= 7) {
      reasoning.push(`• Detected complex operations requiring advanced reasoning`);
    } else if (analysis.patternScore <= 3) {
      reasoning.push(`• Simple, straightforward request detected`);
    }

    if (message.length > 150) {
      reasoning.push(`• Long message suggests detailed requirements`);
    }

    return reasoning;
  }

  /**
   * Select the best model for a given complexity level
   */
  private selectBestModel(complexity: TaskComplexity, userPreference?: string): string {
    // Check user preference first
    if (userPreference && this.models.has(userPreference)) {
      const model = this.models.get(userPreference)!;
      if (model.suitableFor.includes(complexity)) {
        return userPreference;
      }
    }

    // Get models suitable for this complexity
    const suitableModels = Array.from(this.models.values())
      .filter(model => model.suitableFor.includes(complexity))
      .sort((a, b) => {
        // Sort by cost efficiency (accuracy/cost ratio)
        const aEfficiency = a.capabilities.accuracy / a.costPer1kTokens;
        const bEfficiency = b.capabilities.accuracy / b.costPer1kTokens;
        return bEfficiency - aEfficiency;
      });

    // Default selection logic
    switch (complexity) {
      case TaskComplexity.SIMPLE:
        return suitableModels.find(m => m.id === 'gpt-4o-mini')?.id || 'gpt-3.5-turbo';
      case TaskComplexity.STANDARD:
        return suitableModels.find(m => m.id === 'gpt-4o-mini')?.id || 'gpt-4o';
      case TaskComplexity.COMPLEX:
        return suitableModels.find(m => m.id === 'gpt-4o')?.id || 'gpt-4';
      default:
        return 'gpt-4o-mini';
    }
  }

  /**
   * Get alternative models for user selection
   */
  private getAlternativeModels(complexity: TaskComplexity, selectedModel: string): string[] {
    return Array.from(this.models.values())
      .filter(model => 
        model.suitableFor.includes(complexity) && 
        model.id !== selectedModel
      )
      .sort((a, b) => b.capabilities.accuracy - a.capabilities.accuracy)
      .map(model => model.id);
  }

  /**
   * Estimate token usage based on message and complexity
   */
  private estimateTokenUsage(message: string, complexity: TaskComplexity): number {
    const baseTokens = Math.ceil(message.length / 4); // Rough estimate: 4 chars per token
    
    let multiplier: number;
    switch (complexity) {
      case TaskComplexity.SIMPLE:
        multiplier = 2; // Simple response
        break;
      case TaskComplexity.STANDARD:
        multiplier = 4; // More detailed response
        break;
      case TaskComplexity.COMPLEX:
        multiplier = 8; // Complex analysis and response
        break;
      default:
        multiplier = 3;
    }

    return Math.ceil(baseTokens * multiplier);
  }

  /**
   * Calculate estimated cost for token usage
   */
  private calculateCost(estimatedTokens: number, modelId: string): number {
    const model = this.models.get(modelId);
    if (!model) return 0;

    return (estimatedTokens / 1000) * model.costPer1kTokens;
  }

  /**
   * Get model configuration by ID
   */
  getModel(modelId: string): ModelConfig | undefined {
    return this.models.get(modelId);
  }

  /**
   * Get all available models
   */
  getAllModels(): ModelConfig[] {
    return Array.from(this.models.values());
  }

  /**
   * Get models suitable for specific complexity
   */
  getModelsForComplexity(complexity: TaskComplexity): ModelConfig[] {
    return Array.from(this.models.values())
      .filter(model => model.suitableFor.includes(complexity));
  }

  /**
   * Record model performance for learning
   */
  async recordModelPerformance(
    modelId: string,
    taskType: string,
    complexity: TaskComplexity,
    success: boolean,
    responseTime: number,
    userFeedback?: number
  ): Promise<void> {
    try {
      // Store in database for persistent learning
      await this.supabase
        .from('ai_model_performance')
        .upsert({
          model_id: modelId,
          task_type: taskType,
          complexity: complexity,
          success: success,
          response_time: responseTime,
          user_feedback: userFeedback,
          organization_id: this.organizationId,
          user_id: this.userId,
          created_at: new Date().toISOString()
        });

      // Update local cache
      this.updatePerformanceCache(modelId, taskType, complexity, success, responseTime, userFeedback);
    } catch (error) {
      console.error('Failed to record model performance:', error);
    }
  }

  /**
   * Update performance cache for quick access
   */
  private updatePerformanceCache(
    modelId: string,
    taskType: string,
    complexity: TaskComplexity,
    success: boolean,
    responseTime: number,
    userFeedback?: number
  ): void {
    const key = `${modelId}_${taskType}_${complexity}`;
    const performances = this.performanceCache.get(key) || [];
    
    const existing = performances.find(p => p.modelId === modelId);
    if (existing) {
      // Update existing performance record
      existing.totalUsage++;
      existing.successRate = (existing.successRate * (existing.totalUsage - 1) + (success ? 1 : 0)) / existing.totalUsage;
      existing.averageResponseTime = (existing.averageResponseTime * (existing.totalUsage - 1) + responseTime) / existing.totalUsage;
      if (userFeedback !== undefined) {
        existing.userSatisfactionScore = (existing.userSatisfactionScore + userFeedback) / 2;
      }
      existing.lastUpdated = new Date();
    } else {
      // Create new performance record
      performances.push({
        modelId,
        taskType,
        complexity,
        successRate: success ? 1 : 0,
        averageResponseTime: responseTime,
        userSatisfactionScore: userFeedback || 0.8,
        totalUsage: 1,
        lastUpdated: new Date()
      });
    }

    this.performanceCache.set(key, performances);
  }

  /**
   * Get performance statistics for a model
   */
  getModelPerformance(modelId: string, taskType?: string, complexity?: TaskComplexity): ModelPerformance[] {
    if (taskType && complexity) {
      const key = `${modelId}_${taskType}_${complexity}`;
      return this.performanceCache.get(key) || [];
    }

    // Return all performance data for the model
    const allPerformances: ModelPerformance[] = [];
    for (const [key, performances] of this.performanceCache.entries()) {
      if (key.startsWith(modelId)) {
        allPerformances.push(...performances);
      }
    }
    return allPerformances;
  }

  /**
   * Get recommended model based on historical performance
   */
  getRecommendedModel(
    complexity: TaskComplexity,
    taskType: string = 'general',
    prioritizeSpeed: boolean = false
  ): string {
    const suitableModels = this.getModelsForComplexity(complexity);
    
    if (suitableModels.length === 0) {
      return 'gpt-4o-mini'; // Fallback
    }

    // Score models based on performance and preferences
    const scoredModels = suitableModels.map(model => {
      const performance = this.getModelPerformance(model.id, taskType, complexity);
      const avgPerformance = performance.length > 0 
        ? performance.reduce((acc, p) => ({
            successRate: acc.successRate + p.successRate,
            responseTime: acc.responseTime + p.averageResponseTime,
            satisfaction: acc.satisfaction + p.userSatisfactionScore
          }), { successRate: 0, responseTime: 0, satisfaction: 0 })
        : { successRate: 0.8, responseTime: 2000, satisfaction: 0.8 };

      if (performance.length > 0) {
        avgPerformance.successRate /= performance.length;
        avgPerformance.responseTime /= performance.length;
        avgPerformance.satisfaction /= performance.length;
      }

      let score = 0;
      if (prioritizeSpeed) {
        score = model.capabilities.speed * 0.4 + 
                avgPerformance.successRate * 30 + 
                avgPerformance.satisfaction * 20 - 
                (avgPerformance.responseTime / 1000) * 5;
      } else {
        score = model.capabilities.accuracy * 0.3 + 
                model.capabilities.reasoning * 0.3 + 
                avgPerformance.successRate * 30 + 
                avgPerformance.satisfaction * 20 - 
                (model.costPer1kTokens * 100);
      }

      return { model, score };
    });

    scoredModels.sort((a, b) => b.score - a.score);
    return scoredModels[0].model.id;
  }

  /**
   * Learn from user overrides to improve future recommendations
   */
  async learnFromUserOverride(
    originalModel: string,
    selectedModel: string,
    taskType: string,
    complexity: TaskComplexity,
    success: boolean
  ): Promise<void> {
    try {
      // Store the user preference as a positive signal for the selected model
      await this.recordModelPerformance(
        selectedModel,
        taskType,
        complexity,
        success,
        0, // No response time for user preference
        success ? 5 : 3 // Higher rating for successful overrides
      );
      
      // Store negative signal for the originally suggested model if override was successful
      if (success && originalModel !== selectedModel) {
        await this.recordModelPerformance(
          originalModel,
          taskType,
          complexity,
          false, // Mark as unsuccessful since user chose differently
          0,
          2 // Lower rating for rejected suggestion
        );
      }
    } catch (error) {
      console.error('Failed to learn from user override:', error);
    }
  }

  /**
   * Get user's preferred models based on historical choices
   */
  async getUserPreferredModels(
    taskType?: string,
    complexity?: TaskComplexity
  ): Promise<string[]> {
    try {
      const { data: userPreferences } = await this.supabase
        .from('ai_model_performance')
        .select('model_id, AVG(user_feedback) as avg_rating, COUNT(*) as usage_count')
        .eq('organization_id', this.organizationId)
        .eq('user_id', this.userId)
        .gte('user_feedback', 4) // Only consider positive feedback
        .modify((query) => {
          if (taskType) query.eq('task_type', taskType);
          if (complexity) query.eq('complexity', complexity);
        })
        .group('model_id')
        .order('avg_rating', { ascending: false })
        .order('usage_count', { ascending: false })
        .limit(3);

      return userPreferences?.map(p => p.model_id) || [];
    } catch (error) {
      console.error('Failed to get user preferred models:', error);
      return [];
    }
  }

  /**
   * Enhanced model selection with user preference learning
   */
  async selectModelWithLearning(
    complexity: TaskComplexity,
    taskType: string = 'general',
    userPreference?: string
  ): Promise<string> {
    // If user has explicit preference, use it if suitable
    if (userPreference && this.models.has(userPreference)) {
      const model = this.models.get(userPreference)!;
      if (model.suitableFor.includes(complexity)) {
        return userPreference;
      }
    }

    // Get user's historically preferred models
    const preferredModels = await this.getUserPreferredModels(taskType, complexity);
    
    // If user has preferred models for this context, prioritize them
    if (preferredModels.length > 0) {
      const suitablePreferred = preferredModels.filter(modelId => {
        const model = this.models.get(modelId);
        return model && model.suitableFor.includes(complexity);
      });
      
      if (suitablePreferred.length > 0) {
        return suitablePreferred[0]; // Return top preferred model
      }
    }

    // Fall back to performance-based recommendation
    return this.getRecommendedModel(complexity, taskType);
  }
}