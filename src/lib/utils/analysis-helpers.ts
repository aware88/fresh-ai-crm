/**
 * Analysis helper functions for advanced evolution detection and AI agents
 */

/**
 * Calculate statistical significance of a value compared to historical data
 */
export function calculateStatisticalSignificance(
  historicalValues: number[],
  currentValue: number
): number {
  if (historicalValues.length < 2) return 0;
  
  const mean = historicalValues.reduce((sum, val) => sum + val, 0) / historicalValues.length;
  const variance = historicalValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / historicalValues.length;
  const standardDeviation = Math.sqrt(variance);
  
  if (standardDeviation === 0) return 0;
  
  const zScore = Math.abs(currentValue - mean) / standardDeviation;
  
  // Convert z-score to significance (0-1 scale)
  // z-score > 2 = ~95% confidence, > 1.5 = ~87% confidence
  return Math.min(zScore / 2, 1);
}

/**
 * Analyze text sentiment on a scale of -1 to 1
 */
export async function analyzeTextSentiment(text: string): Promise<number> {
  // Simple sentiment analysis using keyword matching
  // In production, you would use a proper sentiment analysis service/model
  
  const positiveWords = [
    'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'good', 'nice', 'happy',
    'pleased', 'satisfied', 'love', 'like', 'awesome', 'perfect', 'brilliant',
    'outstanding', 'superb', 'magnificent', 'delighted', 'thrilled'
  ];
  
  const negativeWords = [
    'bad', 'terrible', 'awful', 'horrible', 'disappointing', 'frustrated', 'angry',
    'upset', 'sad', 'hate', 'dislike', 'poor', 'worst', 'pathetic', 'useless',
    'annoying', 'irritating', 'disgusting', 'appalling', 'dreadful'
  ];
  
  const neutralWords = [
    'okay', 'fine', 'alright', 'decent', 'fair', 'average', 'normal', 'standard',
    'regular', 'typical', 'usual', 'common', 'ordinary'
  ];
  
  const words = text.toLowerCase().split(/\s+/);
  const totalWords = words.length;
  
  let positiveScore = 0;
  let negativeScore = 0;
  let neutralScore = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) positiveScore++;
    if (negativeWords.includes(word)) negativeScore++;
    if (neutralWords.includes(word)) neutralScore++;
  });
  
  // Normalize scores
  const positiveRatio = positiveScore / totalWords;
  const negativeRatio = negativeScore / totalWords;
  
  // Calculate sentiment on -1 to 1 scale
  let sentiment = positiveRatio - negativeRatio;
  
  // Apply some dampening for very short texts
  if (totalWords < 10) {
    sentiment *= 0.5;
  }
  
  // Ensure within bounds
  return Math.max(-1, Math.min(1, sentiment));
}

/**
 * Extract communication patterns from text
 */
export function extractCommunicationPatterns(text: string): {
  formality: number;
  urgency: number;
  questionFrequency: number;
  technicalDepth: number;
  emotionalIntensity: number;
} {
  const words = text.toLowerCase().split(/\s+/);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  // Formality analysis
  const formalWords = ['please', 'thank you', 'regards', 'sincerely', 'respectfully', 'dear', 'sir', 'madam'];
  const informalWords = ['hey', 'hi', 'yeah', 'ok', 'cool', 'awesome', 'thanks', 'bye'];
  
  const formalCount = words.filter(word => formalWords.includes(word)).length;
  const informalCount = words.filter(word => informalWords.includes(word)).length;
  
  const formality = formalCount > informalCount ? 
    Math.min(1, formalCount / Math.max(words.length / 50, 1)) :
    Math.max(0, 1 - (informalCount / Math.max(words.length / 50, 1)));
  
  // Urgency analysis
  const urgentWords = ['urgent', 'asap', 'immediately', 'quickly', 'rush', 'emergency', 'critical', 'deadline'];
  const urgentCount = words.filter(word => urgentWords.includes(word)).length;
  const hasMultipleExclamations = (text.match(/!/g) || []).length > 2;
  const hasAllCaps = /[A-Z]{4,}/.test(text);
  
  let urgency = urgentCount / Math.max(words.length / 100, 1);
  if (hasMultipleExclamations) urgency += 0.2;
  if (hasAllCaps) urgency += 0.15;
  urgency = Math.min(1, urgency);
  
  // Question frequency
  const questionMarks = (text.match(/\?/g) || []).length;
  const questionFrequency = questionMarks / Math.max(sentences.length, 1);
  
  // Technical depth
  const technicalWords = [
    'api', 'integration', 'database', 'server', 'client', 'protocol', 'framework',
    'algorithm', 'architecture', 'deployment', 'configuration', 'authentication',
    'authorization', 'encryption', 'ssl', 'https', 'json', 'xml', 'rest', 'soap',
    'microservices', 'scalability', 'performance', 'optimization', 'caching',
    'load balancing', 'redundancy', 'backup', 'recovery', 'monitoring', 'logging'
  ];
  
  const technicalCount = words.filter(word => 
    technicalWords.some(techWord => word.includes(techWord))
  ).length;
  
  const technicalDepth = Math.min(1, technicalCount / Math.max(words.length / 30, 1));
  
  // Emotional intensity
  const intensityWords = [
    'love', 'hate', 'amazing', 'terrible', 'fantastic', 'awful', 'incredible', 'horrible',
    'brilliant', 'stupid', 'wonderful', 'disgusting', 'perfect', 'worst', 'best',
    'excited', 'disappointed', 'thrilled', 'devastated', 'ecstatic', 'furious'
  ];
  
  const intensityCount = words.filter(word => intensityWords.includes(word)).length;
  const emotionalIntensity = Math.min(1, intensityCount / Math.max(words.length / 50, 1));
  
  return {
    formality: Math.round(formality * 100) / 100,
    urgency: Math.round(urgency * 100) / 100,
    questionFrequency: Math.round(questionFrequency * 100) / 100,
    technicalDepth: Math.round(technicalDepth * 100) / 100,
    emotionalIntensity: Math.round(emotionalIntensity * 100) / 100
  };
}

/**
 * Calculate trend direction from a series of values
 */
export function calculateTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' | 'volatile' {
  if (values.length < 2) return 'stable';
  
  const first = values[0];
  const last = values[values.length - 1];
  const change = (last - first) / Math.max(Math.abs(first), 0.001);
  
  // Calculate variance to detect volatility
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const coefficientOfVariation = Math.sqrt(variance) / Math.abs(mean);
  
  if (coefficientOfVariation > 0.3) {
    return 'volatile';
  } else if (change > 0.1) {
    return 'increasing';
  } else if (change < -0.1) {
    return 'decreasing';
  } else {
    return 'stable';
  }
}

/**
 * Detect language patterns in text
 */
export function detectLanguagePatterns(text: string): {
  decisionLanguage: number;
  buyingLanguage: number;
  problemLanguage: number;
  praiseLanguage: number;
} {
  const words = text.toLowerCase();
  
  // Decision-making language
  const decisionPhrases = [
    'i will', 'we will', 'i need', 'we need', 'i must', 'we must',
    'i decide', 'we decide', 'i choose', 'we choose', 'approved',
    'authorization', 'budget allocated', 'move forward', 'proceed'
  ];
  
  const decisionCount = decisionPhrases.filter(phrase => words.includes(phrase)).length;
  const decisionLanguage = Math.min(1, decisionCount * 0.25);
  
  // Buying language
  const buyingPhrases = [
    'purchase', 'buy', 'cost', 'price', 'quote', 'proposal', 'contract',
    'agreement', 'payment', 'invoice', 'billing', 'subscription', 'license',
    'order', 'checkout', 'cart', 'payment method'
  ];
  
  const buyingCount = buyingPhrases.filter(phrase => words.includes(phrase)).length;
  const buyingLanguage = Math.min(1, buyingCount * 0.2);
  
  // Problem language
  const problemPhrases = [
    'problem', 'issue', 'error', 'bug', 'not working', 'broken', 'failed',
    'help', 'support', 'assistance', 'troubleshoot', 'fix', 'resolve'
  ];
  
  const problemCount = problemPhrases.filter(phrase => words.includes(phrase)).length;
  const problemLanguage = Math.min(1, problemCount * 0.2);
  
  // Praise language
  const praisePhrases = [
    'great job', 'excellent', 'amazing', 'fantastic', 'love it',
    'impressed', 'exceeded expectations', 'outstanding', 'remarkable',
    'thank you', 'grateful', 'appreciate'
  ];
  
  const praiseCount = praisePhrases.filter(phrase => words.includes(phrase)).length;
  const praiseLanguage = Math.min(1, praiseCount * 0.25);
  
  return {
    decisionLanguage: Math.round(decisionLanguage * 100) / 100,
    buyingLanguage: Math.round(buyingLanguage * 100) / 100,
    problemLanguage: Math.round(problemLanguage * 100) / 100,
    praiseLanguage: Math.round(praiseLanguage * 100) / 100
  };
}

/**
 * Calculate confidence intervals for a set of values
 */
export function calculateConfidenceInterval(
  values: number[], 
  confidenceLevel: number = 0.95
): { lower: number; upper: number; confidence: number } {
  if (values.length < 2) {
    return { lower: 0, upper: 1, confidence: 0 };
  }
  
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
  const standardError = Math.sqrt(variance / values.length);
  
  // Use t-distribution approximation
  const alpha = 1 - confidenceLevel;
  const tValue = 2; // Simplified - use 2 for ~95% confidence
  
  const marginOfError = tValue * standardError;
  
  return {
    lower: Math.max(0, mean - marginOfError),
    upper: Math.min(1, mean + marginOfError),
    confidence: confidenceLevel
  };
}

/**
 * Normalize values to 0-1 scale
 */
export function normalizeValue(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

/**
 * Calculate weighted average
 */
export function calculateWeightedAverage(values: number[], weights: number[]): number {
  if (values.length !== weights.length || values.length === 0) return 0;
  
  const weightedSum = values.reduce((sum, val, index) => sum + (val * weights[index]), 0);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  
  return totalWeight > 0 ? weightedSum / totalWeight : 0;
} 