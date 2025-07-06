/**
 * Agent Control Panel Component
 * 
 * Allows users to configure agent settings and behavior
 */

import { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-nextjs';
import {
  Box,
  Heading,
  Text,
  Switch,
  FormControl,
  FormLabel,
  Stack,
  Card,
  CardHeader,
  CardBody,
  Divider,
  Select,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Button,
  useToast,
  Spinner,
  Flex,
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { InfoIcon } from '@chakra-ui/icons';

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
  const toast = useToast();
  
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
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
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
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error saving settings',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
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
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" />
      </Flex>
    );
  }
  
  return (
    <Box p={4}>
      <Flex justify="space-between" align="center" mb={4}>
        <Heading size="lg">Agent Control Panel</Heading>
        {hasChanges && (
          <Flex gap={2}>
            <Button
              variant="outline"
              onClick={resetSettings}
              isDisabled={saving}
            >
              Reset
            </Button>
            <Button
              colorScheme="blue"
              onClick={saveSettings}
              isLoading={saving}
            >
              Save Changes
            </Button>
          </Flex>
        )}
      </Flex>
      
      <Stack spacing={6}>
        {/* Transparency Settings */}
        <Card>
          <CardHeader pb={2}>
            <Heading size="md">Transparency Settings</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="activity-logging" mb="0">
                  Activity Logging
                  <Tooltip label="Record all agent activities for later review">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Switch
                  id="activity-logging"
                  isChecked={settings.activity_logging_enabled}
                  onChange={(e) => handleSettingChange('activity_logging_enabled', e.target.checked)}
                />
              </FormControl>
              
              <FormControl display="flex" alignItems="center">
                <FormLabel htmlFor="thought-logging" mb="0">
                  Thought Process Logging
                  <Tooltip label="Record detailed agent reasoning steps">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Switch
                  id="thought-logging"
                  isChecked={settings.thought_logging_enabled}
                  onChange={(e) => handleSettingChange('thought_logging_enabled', e.target.checked)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="memory-access">
                  Memory Access Level
                  <Tooltip label="Control what memories the agent can access">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Select
                  id="memory-access"
                  value={settings.memory_access_level}
                  onChange={(e) => handleSettingChange('memory_access_level', e.target.value)}
                >
                  <option value="full">Full Access</option>
                  <option value="limited">Limited Access</option>
                  <option value="minimal">Minimal Access</option>
                  <option value="none">No Access</option>
                </Select>
              </FormControl>
            </Stack>
          </CardBody>
        </Card>
        
        {/* Personality Settings */}
        <Card>
          <CardHeader pb={2}>
            <Heading size="md">Personality Settings</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel htmlFor="personality-tone">
                  Communication Tone
                  <Tooltip label="How the agent should sound in conversations">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Select
                  id="personality-tone"
                  value={settings.personality_tone}
                  onChange={(e) => handleSettingChange('personality_tone', e.target.value)}
                >
                  <option value="professional">Professional</option>
                  <option value="friendly">Friendly</option>
                  <option value="casual">Casual</option>
                  <option value="formal">Formal</option>
                  <option value="technical">Technical</option>
                </Select>
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="assertiveness">
                  Assertiveness Level: {settings.assertiveness_level}%
                  <Tooltip label="How direct and confident the agent should be">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Slider
                  id="assertiveness"
                  value={settings.assertiveness_level}
                  onChange={(val) => handleSettingChange('assertiveness_level', val)}
                  min={0}
                  max={100}
                  step={10}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
              
              <FormControl>
                <FormLabel htmlFor="empathy">
                  Empathy Level: {settings.empathy_level}%
                  <Tooltip label="How well the agent recognizes and responds to emotions">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Slider
                  id="empathy"
                  value={settings.empathy_level}
                  onChange={(val) => handleSettingChange('empathy_level', val)}
                  min={0}
                  max={100}
                  step={10}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
            </Stack>
          </CardBody>
        </Card>
        
        {/* Response Settings */}
        <Card>
          <CardHeader pb={2}>
            <Heading size="md">Response Settings</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              <FormControl>
                <FormLabel htmlFor="response-detail">
                  Response Detail Level
                  <Tooltip label="How detailed the agent's responses should be">
                    <InfoIcon ml={1} color="gray.500" />
                  </Tooltip>
                </FormLabel>
                <Select
                  id="response-detail"
                  value={settings.response_detail_level}
                  onChange={(e) => handleSettingChange('response_detail_level', e.target.value)}
                >
                  <option value="concise">Concise</option>
                  <option value="balanced">Balanced</option>
                  <option value="detailed">Detailed</option>
                  <option value="comprehensive">Comprehensive</option>
                </Select>
              </FormControl>
            </Stack>
          </CardBody>
        </Card>
      </Stack>
    </Box>
  );
}
