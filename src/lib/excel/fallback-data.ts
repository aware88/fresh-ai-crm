/**
 * Fallback data for when Excel file cannot be accessed
 * This ensures the app works without requiring any file uploads
 */

export const fallbackPersonalityData = [
  ['Personality Type', 'Description', 'Communication Style', 'Decision Making', 'Strengths'],
  ['Analytical', 'Logical, methodical, and detail-oriented', 'Precise and data-driven', 'Based on facts and logic', 'Problem-solving, attention to detail'],
  ['Driver', 'Results-oriented, direct, and decisive', 'Direct and to the point', 'Quick and decisive', 'Leadership, efficiency, goal achievement'],
  ['Amiable', 'Supportive, diplomatic, and patient', 'Warm and relationship-focused', 'Consensus-seeking', 'Team building, mediation, listening'],
  ['Expressive', 'Enthusiastic, creative, and sociable', 'Animated and persuasive', 'Intuitive and spontaneous', 'Innovation, motivation, networking']
];

export const fallbackCommunicationData = [
  ['Personality Type', 'Do', 'Don\'t'],
  ['Analytical', 'Provide detailed information and data', 'Rush them or be vague'],
  ['Driver', 'Be direct and focus on results', 'Waste time with small talk'],
  ['Amiable', 'Show personal interest and be supportive', 'Be confrontational or pushy'],
  ['Expressive', 'Be enthusiastic and allow time for discussion', 'Cut them off or be too rigid']
];

/**
 * Get fallback personality data by sheet name
 */
export function getFallbackDataBySheet(sheetName: string): any[][] {
  if (sheetName === 'Personality Types') {
    return fallbackPersonalityData;
  } else if (sheetName === 'Communication Tips') {
    return fallbackCommunicationData;
  }
  return [['No data available']];
}

/**
 * Get all available fallback sheet names
 */
export function getFallbackSheetNames(): string[] {
  return ['Personality Types', 'Communication Tips'];
}
