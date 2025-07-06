'use client';

import { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

interface EmailLanguageDetectionProps {
  content: string;
  onLanguageDetected?: (language: DetectedLanguage) => void;
}

interface DetectedLanguage {
  code: string;
  name: string;
  confidence: number;
}

export default function EmailLanguageDetection({ 
  content, 
  onLanguageDetected 
}: EmailLanguageDetectionProps) {
  const [detectedLanguage, setDetectedLanguage] = useState<DetectedLanguage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only detect language if we have sufficient content
    if (content && content.trim().length > 20) {
      detectLanguage(content);
    }
  }, [content]);

  const detectLanguage = async (text: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would call an API
      // For now, we'll simulate language detection with common patterns
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simple language detection simulation
      // In a real app, use a proper language detection library or API
      let detectedCode = 'en';
      let confidence = 0.9;
      
      // Very simple detection based on common words
      const lowerText = text.toLowerCase();
      
      if (lowerText.includes('hola') || lowerText.includes('gracias') || lowerText.includes('buenos días')) {
        detectedCode = 'es';
        confidence = 0.85;
      } else if (lowerText.includes('bonjour') || lowerText.includes('merci') || lowerText.includes('au revoir')) {
        detectedCode = 'fr';
        confidence = 0.87;
      } else if (lowerText.includes('guten tag') || lowerText.includes('danke') || lowerText.includes('auf wiedersehen')) {
        detectedCode = 'de';
        confidence = 0.82;
      } else if (lowerText.includes('ciao') || lowerText.includes('grazie') || lowerText.includes('arrivederci')) {
        detectedCode = 'it';
        confidence = 0.83;
      }
      
      // Map language codes to names
      const languageNames: Record<string, string> = {
        'en': 'English',
        'es': 'Spanish',
        'fr': 'French',
        'de': 'German',
        'it': 'Italian',
      };
      
      const result: DetectedLanguage = {
        code: detectedCode,
        name: languageNames[detectedCode] || 'Unknown',
        confidence,
      };
      
      setDetectedLanguage(result);
      onLanguageDetected?.(result);
    } catch (err: any) {
      console.error('Language detection failed:', err);
      setError('Failed to detect language');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center text-sm text-gray-500">
        <Globe className="h-4 w-4 mr-1" />
        <span>Detecting language...</span>
      </div>
    );
  }

  if (error) {
    return null; // Hide on error
  }

  if (!detectedLanguage) {
    return null;
  }

  return (
    <div className="flex items-center text-sm">
      <Globe className="h-4 w-4 mr-1 text-gray-500" />
      <span>
        Language: <span className="font-medium">{detectedLanguage.name}</span>
        {detectedLanguage.confidence > 0.8 && (
          <span className="text-xs text-gray-500 ml-1">
            ({Math.round(detectedLanguage.confidence * 100)}% confidence)
          </span>
        )}
      </span>
    </div>
  );
}
