import { useState } from 'react';

export interface EmailSettings {
  autoProcessEmails: boolean;
  showAnalysisFirst: boolean;
  useMetakockaContext: boolean;
  defaultResponseTemplate: string;
}

export function useEmailSettings() {
  const [settings, setSettings] = useState<EmailSettings>({
    autoProcessEmails: true,
    showAnalysisFirst: true,
    useMetakockaContext: true,
    defaultResponseTemplate: "Thank you for your email. I'll get back to you shortly."
  });

  const updateSettings = (newSettings: Partial<EmailSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    // In a real implementation, this would save to localStorage or a database
  };

  return {
    settings,
    updateSettings
  };
}
