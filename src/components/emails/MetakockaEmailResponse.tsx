import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Sparkles, Save } from 'lucide-react';
import { 
  getEmailTemplates, 
  applyTemplateWithMetakockaContext, 
  generateEmailAIResponse 
} from '@/lib/integrations/metakocka/email-response-api';

interface MetakockaEmailResponseProps {
  emailId: string;
  onResponseGenerated?: (response: string) => void;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

export function MetakockaEmailResponse({ emailId, onResponseGenerated }: MetakockaEmailResponseProps) {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [generatedResponse, setGeneratedResponse] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  // Function to fetch email templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const templatesData = await getEmailTemplates();
      setTemplates(templatesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching templates');
    } finally {
      setLoading(false);
    }
  };

  // Function to apply a template
  const handleApplyTemplate = async () => {
    if (!selectedTemplateId) {
      setError('Please select a template');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await applyTemplateWithMetakockaContext(selectedTemplateId, emailId);
      
      // Set the generated response from the template
      setGeneratedResponse(result.body);
      
      // Notify parent component if callback is provided
      if (onResponseGenerated) {
        onResponseGenerated(result.body);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error applying template');
    } finally {
      setLoading(false);
    }
  };

  // Function to generate AI response
  const handleGenerateAIResponse = async () => {
    if (!customPrompt) {
      setError('Please enter a prompt for the AI');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const result = await generateEmailAIResponse(emailId, customPrompt);
      
      // Set the generated response
      setGeneratedResponse(result.response);
      
      // Notify parent component if callback is provided
      if (onResponseGenerated) {
        onResponseGenerated(result.response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generating AI response');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">AI Email Response</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="template">Use Template</Label>
          <div className="flex gap-2">
            <Select
              value={selectedTemplateId}
              onValueChange={setSelectedTemplateId}
              disabled={loading}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select a template" />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button 
              onClick={handleApplyTemplate} 
              disabled={!selectedTemplateId || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="ml-2">Apply</span>
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="prompt">Custom AI Prompt</Label>
          <Textarea
            id="prompt"
            placeholder="Enter a prompt for the AI, e.g., 'Write a professional response to this email about invoice payment'"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            disabled={loading}
            className="min-h-[100px]"
          />
          <Button 
            onClick={handleGenerateAIResponse} 
            disabled={!customPrompt || loading}
            className="w-full"
            variant="default"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Generate AI Response
          </Button>
        </div>
        
        {generatedResponse && (
          <div className="space-y-2">
            <Label htmlFor="response">Generated Response</Label>
            <Textarea
              id="response"
              value={generatedResponse}
              onChange={(e) => setGeneratedResponse(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
        )}
      </CardContent>
      {generatedResponse && (
        <CardFooter className="flex justify-end">
          <Button 
            onClick={() => {
              if (onResponseGenerated) {
                onResponseGenerated(generatedResponse);
              }
            }}
            variant="default"
          >
            <Send className="h-4 w-4 mr-2" />
            Use Response
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
