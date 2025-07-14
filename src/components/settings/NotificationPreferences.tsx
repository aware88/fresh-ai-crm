"use client";

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Bell, Mail, AlertTriangle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface NotificationTemplate {
  id: string;
  type: string;
  title_template: string;
  message_template: string;
  action_url_template?: string;
  default_metadata: any;
  preference: {
    notification_type: string;
    email_enabled: boolean;
    in_app_enabled: boolean;
  };
}

interface NotificationCategory {
  [category: string]: NotificationTemplate[];
}

export default function NotificationPreferences() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<NotificationCategory>({});
  const [activeTab, setActiveTab] = useState('all');
  const [modifiedPreferences, setModifiedPreferences] = useState<Record<string, { email: boolean; inApp: boolean }>>({});

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/user/notification-preferences');
        
        if (!response.ok) {
          throw new Error('Failed to fetch notification preferences');
        }
        
        const data = await response.json();
        setCategories(data.categories || {});
        
        // Initialize modified preferences
        const initialModified: Record<string, { email: boolean; inApp: boolean }> = {};
        Object.values(data.categories || {}).forEach((templates) => {
          const templateArray = templates as NotificationTemplate[];
          templateArray.forEach(template => {
            initialModified[template.type] = {
              email: template.preference.email_enabled,
              inApp: template.preference.in_app_enabled
            };
          });
        });
        setModifiedPreferences(initialModified);
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        toast({
          title: 'Error',
          description: 'Failed to load notification preferences',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (session?.user) {
      fetchPreferences();
    }
  }, [session, toast]);

  // Handle preference toggle
  const handleToggle = (type: string, channel: 'email' | 'inApp', value: boolean) => {
    setModifiedPreferences(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [channel]: value
      }
    }));
  };

  // Save preferences
  const savePreferences = async () => {
    try {
      setSaving(true);
      
      // Convert modified preferences to array format for API
      const preferencesToSave = Object.entries(modifiedPreferences).map(([type, settings]) => ({
        notification_type: type,
        email_enabled: settings.email,
        in_app_enabled: settings.inApp
      }));
      
      const response = await fetch('/api/user/notification-preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ preferences: preferencesToSave })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save notification preferences');
      }
      
      toast({
        title: 'Success',
        description: 'Notification preferences saved successfully',
        variant: 'default'
      });
      
      // Update the UI with saved preferences
      const updatedCategories = { ...categories };
      Object.keys(updatedCategories).forEach(category => {
        updatedCategories[category] = updatedCategories[category].map(template => ({
          ...template,
          preference: {
            ...template.preference,
            email_enabled: modifiedPreferences[template.type]?.email ?? template.preference.email_enabled,
            in_app_enabled: modifiedPreferences[template.type]?.inApp ?? template.preference.in_app_enabled
          }
        }));
      });
      setCategories(updatedCategories);
      
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Check if any preferences have been modified
  const hasChanges = () => {
    return Object.entries(modifiedPreferences).some(([type, settings]) => {
      const categoryKey = Object.keys(categories).find(key => 
        categories[key].some(template => template.type === type)
      );
      
      if (!categoryKey) return false;
      
      const template = categories[categoryKey].find(t => t.type === type);
      if (!template) return false;
      
      return template.preference.email_enabled !== settings.email || 
             template.preference.in_app_enabled !== settings.inApp;
    });
  };

  // Get all available categories
  const allCategories = Object.keys(categories).sort();

  // Render loading skeleton
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Manage how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>Manage how you receive notifications</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Notifications</TabsTrigger>
            {allCategories.map(category => (
              <TabsTrigger key={category} value={category}>{category}</TabsTrigger>
            ))}
          </TabsList>
          <TabsContent value="all" className="space-y-6">
            {allCategories.map(category => (
              <div key={category} className="space-y-4">
                <h3 className="text-lg font-medium">{category} Notifications</h3>
                <div className="space-y-4">
                  {categories[category].map(template => (
                    <NotificationPreferenceItem
                      key={template.type}
                      template={template}
                      settings={modifiedPreferences[template.type]}
                      onToggle={handleToggle}
                    />
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>
          {allCategories.map(category => (
            <TabsContent key={category} value={category} className="space-y-4">
              {categories[category].map(template => (
                <NotificationPreferenceItem
                  key={template.type}
                  template={template}
                  settings={modifiedPreferences[template.type]}
                  onToggle={handleToggle}
                />
              ))}
            </TabsContent>
          ))}
        </Tabs>
        <div className="mt-6 flex justify-end">
          <Button 
            onClick={savePreferences} 
            disabled={saving || !hasChanges()}
          >
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : 'Save Preferences'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationPreferenceItemProps {
  template: NotificationTemplate;
  settings: { email: boolean; inApp: boolean };
  onToggle: (type: string, channel: 'email' | 'inApp', value: boolean) => void;
}

function NotificationPreferenceItem({ template, settings, onToggle }: NotificationPreferenceItemProps) {
  if (!settings) return null;
  
  // Format notification type for display
  const formatType = (type: string) => {
    return type
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get icon color from metadata
  const getIconColor = () => {
    const color = template.default_metadata?.color || 'gray';
    const colorMap: Record<string, string> = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      gray: 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || colorMap.gray;
  };
  
  return (
    <div className="flex items-center justify-between p-4 border rounded-md">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{formatType(template.type)}</h4>
          <Badge variant="outline" className={getIconColor()}>
            {template.type.split('_')[0]}
          </Badge>
        </div>
        <p className="text-sm text-gray-500 mt-1">{template.title_template}</p>
      </div>
      
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-gray-500" />
          <Switch
            checked={settings.email}
            onCheckedChange={(checked) => onToggle(template.type, 'email', checked)}
            aria-label="Email notifications"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-gray-500" />
          <Switch
            checked={settings.inApp}
            onCheckedChange={(checked) => onToggle(template.type, 'inApp', checked)}
            aria-label="In-app notifications"
          />
        </div>
      </div>
    </div>
  );
}
