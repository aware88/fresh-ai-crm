/**
 * Transparent Sales Agent
 * 
 * Extends the SalesAgentService with transparency features including:
 * - Activity logging
 * - Thought process logging
 * - User-configurable settings
 */

import { SalesAgentService } from './sales-agent-service';
import { SupabaseClient } from '@supabase/supabase-js';
import { TransparencyService } from '../transparency/transparency-service';
import { v4 as uuidv4 } from 'uuid';

export class TransparentSalesAgent extends SalesAgentService {
  private transparencyService: TransparencyService;
  private activityLoggingEnabled: boolean = true;
  private thoughtLoggingEnabled: boolean = true;
  private agentId: string;
  private organizationId: string;
  
  constructor(
    supabaseClient: SupabaseClient,
    openaiClient: any,
    agentId: string,
    organizationId: string
  ) {
    super(supabaseClient, openaiClient);
    this.agentId = agentId;
    this.organizationId = organizationId;
    this.transparencyService = new TransparencyService(
      supabaseClient,
      organizationId
    );
    
    // Load settings asynchronously
    this.loadSettings();
  }
  
  private async loadSettings() {
    const settings = await this.transparencyService.getSettings(this.agentId);
    
    for (const setting of settings) {
      if (setting.setting_key === 'activity_logging_enabled') {
        this.activityLoggingEnabled = setting.setting_value;
      }
      if (setting.setting_key === 'thought_logging_enabled') {
        this.thoughtLoggingEnabled = setting.setting_value;
      }
    }
  }
  
  /**
   * Override processContactMessage to include transparency features
   */
  async processContactMessage(message: any) {
    // Log the activity start
    const activity = this.activityLoggingEnabled ? 
      await this.transparencyService.logActivity({
        agentId: this.agentId,
        activityType: 'process_message',
        description: `Processing message from contact ${message.contact_id}`,
        relatedEntityType: 'contact',
        relatedEntityId: message.contact_id,
        metadata: { messageId: message.id }
      }) : null;
    
    // Log the thought process for analyzing the message
    if (this.thoughtLoggingEnabled && activity) {
      await this.transparencyService.logThought({
        agentId: this.agentId,
        activityId: activity.id,
        thoughtStep: 1,
        reasoning: `Analyzing message: "${message.content.substring(0, 100)}${message.content.length > 100 ? '...' : ''}"`,
        confidence: 1.0
      });
    }
    
    try {
      // Retrieve relevant memories
      const relevantMemories = await this.getRelevantMemories(message.contact_id, message.content);
      
      // Log the thought process for memory retrieval
      if (this.thoughtLoggingEnabled && activity) {
        await this.transparencyService.logThought({
          agentId: this.agentId,
          activityId: activity.id,
          thoughtStep: 2,
          reasoning: `Retrieved ${relevantMemories.length} relevant memories for context`,
          alternatives: relevantMemories.map(m => ({ 
            id: m.id, 
            content: m.content.substring(0, 100) 
          })),
          confidence: 0.9
        });
      }
      
      // Make a decision about how to respond
      const decision = await this.makeDecision(message, relevantMemories);
      
      // Log the thought process for decision making
      if (this.thoughtLoggingEnabled && activity) {
        await this.transparencyService.logThought({
          agentId: this.agentId,
          activityId: activity.id,
          thoughtStep: 3,
          reasoning: `Decided on approach: ${decision.approach}`,
          alternatives: decision.alternatives,
          confidence: decision.confidence
        });
      }
      
      // Generate the response
      const response = await super.processContactMessage(message);
      
      // Log the final response
      if (this.thoughtLoggingEnabled && activity) {
        await this.transparencyService.logThought({
          agentId: this.agentId,
          activityId: activity.id,
          thoughtStep: 4,
          reasoning: `Generated response: "${response.content.substring(0, 100)}${response.content.length > 100 ? '...' : ''}"`,
          confidence: 0.95
        });
      }
      
      // Log activity completion
      if (this.activityLoggingEnabled && activity) {
        await this.transparencyService.logActivity({
          agentId: this.agentId,
          activityType: 'response_generated',
          description: `Generated response to contact ${message.contact_id}`,
          relatedEntityType: 'message',
          relatedEntityId: response.id,
          metadata: { responseLength: response.content.length }
        });
      }
      
      return response;
    } catch (error) {
      // Log error
      if (this.activityLoggingEnabled && activity) {
        await this.transparencyService.logActivity({
          agentId: this.agentId,
          activityType: 'error',
          description: `Error processing message: ${error.message}`,
          relatedEntityType: 'contact',
          relatedEntityId: message.contact_id,
          metadata: { error: error.message, stack: error.stack }
        });
      }
      
      throw error;
    }
  }
  
  /**
   * Get relevant memories for the current conversation
   */
  private async getRelevantMemories(contactId: string, messageContent: string) {
    // This would use the memory service to retrieve relevant memories
    // For now, we'll return a mock implementation
    return [
      {
        id: uuidv4(),
        content: `Previous conversation with contact ${contactId}`,
        importance: 0.8
      },
      {
        id: uuidv4(),
        content: `Contact ${contactId} preferences`,
        importance: 0.9
      }
    ];
  }
  
  /**
   * Make a decision about how to respond
   */
  private async makeDecision(message: any, relevantMemories: any[]) {
    // This would use the decision-making framework to determine the best approach
    // For now, we'll return a mock implementation
    return {
      approach: 'informative_response',
      confidence: 0.85,
      alternatives: [
        { approach: 'ask_clarifying_question', confidence: 0.6 },
        { approach: 'suggest_product', confidence: 0.4 }
      ]
    };
  }
  
  /**
   * Enable or disable activity logging
   */
  async setActivityLogging(enabled: boolean) {
    this.activityLoggingEnabled = enabled;
    await this.transparencyService.updateSetting({
      settingKey: 'activity_logging_enabled',
      settingValue: enabled,
      agentId: this.agentId
    });
  }
  
  /**
   * Enable or disable thought logging
   */
  async setThoughtLogging(enabled: boolean) {
    this.thoughtLoggingEnabled = enabled;
    await this.transparencyService.updateSetting({
      settingKey: 'thought_logging_enabled',
      settingValue: enabled,
      agentId: this.agentId
    });
  }
}
