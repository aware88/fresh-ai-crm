import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Define the type for personality data
export interface PersonalityProfile {
  'Personality_Type': string;
  'Traits': string;
  'Sales_Strategy': string;
  'Messaging_Do': string;
  'Messaging_Dont': string;
  'Common_Biases': string;
  'Trigger': string;
  'Description': string;
  'Example': string;
  'Personality': string;
  'Objection': string;
  'Reframe': string;
  'Framework': string;
  'Best_For': string;
  'Style': string;
}

// Path to the CSV file
const csvFilePath = path.join(process.cwd(), 'src/data/personality_profiles.csv');

// Function to load personality profiles from CSV
export const loadPersonalityProfiles = (): PersonalityProfile[] => {
  try {
    // Check if file exists
    if (!fs.existsSync(csvFilePath)) {
      console.warn('Personality profiles CSV file not found');
      return [];
    }

    // Read and parse CSV file
    const fileContent = fs.readFileSync(csvFilePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records as PersonalityProfile[];
  } catch (error) {
    console.error('Error loading personality profiles:', error);
    return [];
  }
};

// Function to get all personality data as a formatted string for the OpenAI prompt
export const getPersonalityDataForPrompt = (): string => {
  const profiles = loadPersonalityProfiles();
  
  if (profiles.length === 0) {
    return '';
  }

  // Format the data for inclusion in the prompt
  let formattedData = 'PERSONALITY PROFILES REFERENCE:\n\n';
  
  profiles.forEach((profile, index) => {
    formattedData += `PROFILE ${index + 1}: ${profile['Personality_Type']}\n`;
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
