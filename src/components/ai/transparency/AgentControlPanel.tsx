/**
 * Agent Control Panel Component
 * 
 * Allows users to configure agent settings and behavior
 */

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { InfoIcon } from 'lucide-react';

interface AgentSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  user_id?: string;
  agent_id?: string;
}

export default function AgentControlPanel({ agentId }: { agentId: string }) {
  const [settings, setSettings] = useState<Record<string, any>>({
    activity_logging_enabled: true,
    thought_logging_enabled: true,
    memory_access_level: 'full',
    personality_tone: 'professional',
    assertiveness_level: 50,
    empathy_level: 70,
    response_detail_level: 'balanced'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState<Record<string, any>>({});
  
  const supabase = useSupabaseClient();
  const { toast } = useToast();
  
  // Fetch settings on component mount
  useEffect(() => {
    if (agentId) {
      fetchSettings();
    }
  }, [agentId]);
  
  // Fetch settings from the API
  const fetchSettings = async () => {
    setLoading(true);
    
    try {
      const params = new URLSearchParams();
      params.append('agentId', agentId);
      
      const response = await fetch(`/api/ai/transparency/settings?${params.toString()}`);
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Convert settings array to object
      const settingsObj = { ...settings };
      (data.settings || []).forEach((setting: AgentSetting) => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      setSettings(settingsObj);
      setOriginalSettings(JSON.parse(JSON.stringify(settingsObj)));
      setHasChanges(false);
    } catch (error) {
      toast({
        title: 'Error fetching settings',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Handle setting change
  const handleSettingChange = (key: string, value: any) => {
    setSettings({
      ...settings,
      [key]: value
    });
    setHasChanges(true);
  };
  
  // Save settings
  const saveSettings = async () => {
    setSaving(true);
    
    try {
      // Find changed settings
      const changedSettings = Object.keys(settings).filter(
        key => JSON.stringify(settings[key]) !== JSON.stringify(originalSettings[key])
      );
      
      // Update each changed setting
      for (const key of changedSettings) {
        const response = await fetch('/api/ai/transparency/settings', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            settingKey: key,
            settingValue: settings[key],
            agentId
          }),
        });
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(`Failed to update ${key}: ${data.error}`);
        }
      }
      
      setOriginalSettings(JSON.parse(JSON.stringify(settings)));
      setHasChanges(false);
      
      toast({
        title: 'Settings saved',
        description: 'Agent settings have been updated successfully',
        variant: 'default',
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };
  
  // Reset settings to original values
  const resetSettings = () => {
    setSettings(JSON.parse(JSON.stringify(originalSettings)));
    setHasChanges(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Agent Control Panel</h2>
        {hasChanges && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={resetSettings}
              disabled={saving}
            >
              Reset
            </Button>
            <Button
              variant="default"
              onClick={saveSettings}
              disabled={saving}
            >
              Save Changes
            </Button>
          </div>
        )}
      </div>
      
      <div className="flex flex-col gap-6">
        {/* Transparency Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Transparency Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label htmlFor="activity-logging" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Activity Logging
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Record all agent activities for later review</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="activity-logging"
                  checked={settings.activity_logging_enabled}
                  onCheckedChange={(checked) => handleSettingChange('activity_logging_enabled', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <label htmlFor="thought-logging" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Thought Process Logging
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Record detailed agent reasoning steps</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch
                  id="thought-logging"
                  checked={settings.thought_logging_enabled}
                  onCheckedChange={(checked) => handleSettingChange('thought_logging_enabled', checked)}
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="memory-access" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Memory Access Level
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Control how much past information the agent can access</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={settings.memory_access_level}
                  onValueChange={(value: string) => handleSettingChange('memory_access_level', value)}
                >
                  <SelectTrigger id="memory-access">
                    <SelectValue placeholder="Select memory access level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Memories</SelectItem>
                    <SelectItem value="recent">Recent Only</SelectItem>
                    <SelectItem value="tagged">Tagged Only</SelectItem>
                    <SelectItem value="none">No Memory Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Personality Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Personality Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="personality-tone" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Communication Tone
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How the agent should communicate with users</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={settings.personality_tone}
                  onValueChange={(value: string) => handleSettingChange('personality_tone', value)}
                >
                  <SelectTrigger id="personality-tone">
                    <SelectValue placeholder="Select tone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="assertiveness" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Assertiveness Level: {settings.assertiveness_level}%
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How direct and confident the agent should be</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Slider
                  id="assertiveness"
                  value={[settings.assertiveness_level]}
                  onValueChange={(values: number[]) => handleSettingChange('assertiveness_level', values[0])}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
              
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <label htmlFor="empathy" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Empathy Level: {settings.empathy_level}%
                    </label>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <InfoIcon className="h-4 w-4 text-gray-500" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>How well the agent recognizes and responds to emotions</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
                <Slider
                  id="empathy"
                  value={[settings.empathy_level]}
                  onValueChange={(values: number[]) => handleSettingChange('empathy_level', values[0])}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Response Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Response Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <label htmlFor="response-detail" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Response Detail Level
                  </label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <InfoIcon className="h-4 w-4 text-gray-500" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>How detailed the agent's responses should be</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={settings.response_detail_level}
                  onValueChange={(value: string) => handleSettingChange('response_detail_level', value)}
                >
                  <SelectTrigger id="response-detail">
                    <SelectValue placeholder="Select detail level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="concise">Concise</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="detailed">Detailed</SelectItem>
                    <SelectItem value="comprehensive">Comprehensive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
