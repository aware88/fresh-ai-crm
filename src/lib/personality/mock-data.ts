import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { PersonalityProfile } from './data';

// Path to the mock data CSV file
const mockDataFilePath = path.join(process.cwd(), 'src/data/mock_personality_data.csv');

/**
 * Function to load mock personality data from CSV
 * @returns Array of personality profiles from mock data
 */
export const loadMockPersonalityData = (): PersonalityProfile[] => {
  try {
    // Check if file exists
    if (!fs.existsSync(mockDataFilePath)) {
      console.warn('Mock personality data CSV file not found');
      return [];
    }

    // Read and parse CSV file
    const fileContent = fs.readFileSync(mockDataFilePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records as PersonalityProfile[];
  } catch (error) {
    console.error('Error loading mock personality data:', error);
    return [];
  }
};

/**
 * Function to get mock personality data as a formatted string for the OpenAI prompt
 * @returns Formatted string of mock personality data
 */
export const getMockPersonalityDataForPrompt = (): string => {
  const profiles = loadMockPersonalityData();
  
  if (profiles.length === 0) {
    return '';
  }

  // Format the data for inclusion in the prompt
  let formattedData = 'MOCK PERSONALITY PROFILES REFERENCE:\n\n';
  
  profiles.forEach((profile, index) => {
    formattedData += `MOCK PROFILE ${index + 1}: ${profile['Personality_Type']}\n`;
    formattedData += `Traits: ${profile['Traits']}\n`;
    formattedData += `Sales Strategy: ${profile['Sales_Strategy']}\n`;
    formattedData += `Messaging Do: ${profile['Messaging_Do']}\n`;
    formattedData += `Messaging Don't: ${profile['Messaging_Dont']}\n`;
    formattedData += `Common Biases: ${profile['Common_Biases']}\n`;
    formattedData += `Trigger: ${profile['Trigger']}\n`;
    formattedData += `Description: ${profile['Description']}\n`;
    formattedData += `Example: ${profile['Example']}\n`;
    formattedData += `Personality: ${profile['Personality']}\n`;
    formattedData += `Objection: ${profile['Objection']}\n`;
    formattedData += `Reframe: ${profile['Reframe']}\n`;
    formattedData += `Framework: ${profile['Framework']}\n`;
    formattedData += `Best For: ${profile['Best_For']}\n`;
    formattedData += `Style: ${profile['Style']}\n\n`;
  });
  
  return formattedData;
};
