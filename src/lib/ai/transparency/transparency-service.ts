/**
 * Transparency Service
 * 
 * Provides functionality for logging and retrieving agent activities,
 * thoughts, and managing user-configurable settings.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

interface ActivityLogParams {
  agentId: string;
  activityType: string;
  description: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  metadata?: any;
}

interface ThoughtLogParams {
  agentId: string;
  activityId: string;
  thoughtStep: number;
  reasoning: string;
  alternatives?: any[];
  confidence?: number;
}

interface AgentSetting {
  settingKey: string;
  settingValue: any;
  userId?: string;
  agentId?: string;
}

export class TransparencyService {
  private supabase: SupabaseClient;
  private organizationId: string;
  
  constructor(
    supabaseClient?: SupabaseClient,
    organizationId?: string,
    supabaseUrl?: string,
    supabaseKey?: string
  ) {
    if (supabaseClient) {
      this.supabase = supabaseClient;
    } else if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey);
    } else {
      throw new Error('Either provide a Supabase client or URL and key');
    }
    
    this.organizationId = organizationId || process.env.ORGANIZATION_ID || '';
    if (!this.organizationId) {
      console.warn('No organization ID provided to TransparencyService');
    }
  }
  
  /**
   * Log an agent activity
   */
  async logActivity({
    agentId,
    activityType,
    description,
    relatedEntityType,
    relatedEntityId,
    metadata
  }: ActivityLogParams) {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent_activities')
        .insert({
          id: uuidv4(),
          organization_id: this.organizationId,
          agent_id: agentId,
          activity_type: activityType,
          description,
          related_entity_type: relatedEntityType,
          related_entity_id: relatedEntityId,
          metadata,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Failed to log agent activity:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error logging agent activity:', error);
      return null;
    }
  }
  
  /**
   * Log an agent thought process
   */
  async logThought({
    agentId,
    activityId,
    thoughtStep,
    reasoning,
    alternatives,
    confidence
  }: ThoughtLogParams) {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent_thoughts')
        .insert({
          id: uuidv4(),
          organization_id: this.organizationId,
          agent_id: agentId,
          activity_id: activityId,
          thought_step: thoughtStep,
          reasoning,
          alternatives: alternatives || [],
          confidence: confidence || 0.5,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (error) {
        console.error('Failed to log agent thought:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error logging agent thought:', error);
      return null;
    }
  }
  
  /**
   * Get activities for a specific agent
   */
  async getAgentActivities(agentId: string, limit = 50, offset = 0) {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent_activities')
        .select('*')
        .eq('agent_id', agentId)
        .eq('organization_id', this.organizationId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);
        
      if (error) {
        console.error('Failed to get agent activities:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting agent activities:', error);
      return [];
    }
  }
  
  /**
   * Get thoughts for a specific activity
   */
  async getActivityThoughts(activityId: string) {
    try {
      const { data, error } = await this.supabase
        .from('ai_agent_thoughts')
        .select('*')
        .eq('activity_id', activityId)
        .eq('organization_id', this.organizationId)
        .order('thought_step', { ascending: true });
        
      if (error) {
        console.error('Failed to get activity thoughts:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting activity thoughts:', error);
      return [];
    }
  }
  
  /**
   * Update or create an agent setting
   */
  async updateSetting({
    settingKey,
    settingValue,
    userId,
    agentId
  }: AgentSetting) {
    try {
      // Check if setting exists
      const { data: existingSettings } = await this.supabase
        .from('ai_agent_settings')
        .select('id')
        .eq('organization_id', this.organizationId)
        .eq('setting_key', settingKey)
        .is('user_id', userId || null)
        .is('agent_id', agentId || null)
        .maybeSingle();
      
      if (existingSettings) {
        // Update existing setting
        const { data, error } = await this.supabase
          .from('ai_agent_settings')
          .update({
            setting_value: settingValue,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSettings.id)
          .select()
          .single();
          
        if (error) {
          console.error('Failed to update agent setting:', error);
          return null;
        }
        
        return data;
      } else {
        // Create new setting
        const { data, error } = await this.supabase
          .from('ai_agent_settings')
          .insert({
            id: uuidv4(),
            organization_id: this.organizationId,
            user_id: userId || null,
            agent_id: agentId || null,
            setting_key: settingKey,
            setting_value: settingValue,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
          
        if (error) {
          console.error('Failed to create agent setting:', error);
          return null;
        }
        
        return data;
      }
    } catch (error) {
      console.error('Error updating agent setting:', error);
      return null;
    }
  }
  
  /**
   * Get agent settings
   */
  async getSettings(agentId?: string, userId?: string) {
    try {
      let query = this.supabase
        .from('ai_agent_settings')
        .select('*')
        .eq('organization_id', this.organizationId);
      
      if (agentId) {
        query = query.eq('agent_id', agentId);
      }
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Failed to get agent settings:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error getting agent settings:', error);
      return [];
    }
  }
  
  /**
   * Delete a memory by ID
   */
  async deleteMemory(memoryId: string) {
    try {
      const { error } = await this.supabase
        .from('ai_memories')
        .delete()
        .eq('id', memoryId)
        .eq('organization_id', this.organizationId);
        
      if (error) {
        console.error('Failed to delete memory:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting memory:', error);
      return false;
    }
  }
}
