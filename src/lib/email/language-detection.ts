/**
 * Language Detection Utilities
 * Extracted from email-learning-service for better modularity
 */

export function detectLanguage(text: string): string {
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Slovenian indicators
  const slovenianWords = ['je', 'in', 'za', 'na', 'se', 'da', 'ki', 'so', 'bo', 'ali', 'kot', 'od', 'do', 'pri', 'z', 'v', 'o', 'pa', 'če', 'lahko', 'sem', 'si', 'ga', 'mu', 'ji', 'jo', 'jim', 'jih', 'hvala', 'prosim', 'lep', 'pozdrav', 'sporočilo'];
  const englishWords = ['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use', 'thank', 'you', 'please', 'regards', 'message'];
  
  const words = cleanText.split(/\s+/).filter(w => w.length > 1);
  
  let slovenianCount = 0;
  let englishCount = 0;
  
  for (const word of words) {
    if (slovenianWords.includes(word)) slovenianCount++;
    if (englishWords.includes(word)) englishCount++;
  }
  
  // Slovenian specific patterns
  if (text.includes('č') || text.includes('ž') || text.includes('š') || 
      text.includes('ć') || text.includes('đ') || text.includes('ije') ||
      text.includes('konec') || text.includes('dimenzije') || text.includes('vrečo')) {
    slovenianCount += 3;
  }
  
  if (slovenianCount > englishCount) return 'sl';
  if (englishCount > slovenianCount) return 'en';
  return 'mixed'; // Default for unclear cases
}

export function getLanguageInfo(language: string) {
  const languageConfig = {
    'sl': {
      name: 'Slovenian',
      formalityMarkers: ['spoštovani', 'lep pozdrav', 'se priporočam'],
      commonGreetings: ['pozdravljeni', 'dober dan', 'hvala'],
      responsePatterns: ['se zahvaljujem', 'prosim', 'lahko']
    },
    'en': {
      name: 'English',
      formalityMarkers: ['dear', 'sincerely', 'best regards'],
      commonGreetings: ['hello', 'good morning', 'thank you'],
      responsePatterns: ['thank you', 'please', 'could you']
    },
    'mixed': {
      name: 'Mixed/Unknown',
      formalityMarkers: [],
      commonGreetings: [],
      responsePatterns: []
    }
  };
  
  return languageConfig[language as keyof typeof languageConfig] || languageConfig.mixed;
}