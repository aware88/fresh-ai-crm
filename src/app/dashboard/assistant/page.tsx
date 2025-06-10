import React from 'react';
import { CustomPromptWindow } from '@/components/ai/CustomPromptWindow';

export default function AIAssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assistant</h1>
        <p className="text-muted-foreground">
          Get help with customer disputes, email drafting, data analysis, and more
        </p>
      </div>
      
      <CustomPromptWindow />
    </div>
  );
}
