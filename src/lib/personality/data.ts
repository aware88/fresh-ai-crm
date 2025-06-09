import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// Define the type for personality data
export interface PersonalityProfile {
  'Personality Type': string;
  'Tone': string;
  'Message Do': string;
  'Message Dont': string;
  'Content Needs': string;
  'Topic': string;
  'Description': string;
  'Tone-out': string;
  'Personality': string;
  'Direction': string;
  'Stance': string;
  'Expression Type-Do': string;
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
    formattedData += `PROFILE ${index + 1}: ${profile['Personality Type']}\n`;
    formattedData += `Tone: ${profile['Tone']}\n`;
    formattedData += `Message Do: ${profile['Message Do']}\n`;
    formattedData += `Message Don't: ${profile['Message Dont']}\n`;
    formattedData += `Content Needs: ${profile['Content Needs']}\n`;
    formattedData += `Topic: ${profile['Topic']}\n`;
    formattedData += `Description: ${profile['Description']}\n`;
    formattedData += `Personality: ${profile['Personality']}\n`;
    formattedData += `Direction: ${profile['Direction']}\n`;
    formattedData += `Stance: ${profile['Stance']}\n`;
    formattedData += `Expression Type: ${profile['Expression Type-Do']}\n`;
    formattedData += `Style: ${profile['Style']}\n\n`;
  });
  
  return formattedData;
};
