/**
 * Initialization functions for personality profile data
 */
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Ensure all required directories and files exist for personality profile data
 */
export const initializeProfileData = async () => {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      await fsPromises.mkdir(dataDir, { recursive: true });
    }
    
    // Check if profile data file exists
    const profileFilePath = path.join(dataDir, 'personality_profiles.csv');
    const exists = fs.existsSync(profileFilePath);
    
    console.log('Profile data directory initialized successfully');
    return {
      initialized: true,
      profileExists: exists,
      profilePath: profileFilePath
    };
  } catch (error) {
    console.error('Error initializing profile data:', error);
    return {
      initialized: false,
      profileExists: false,
      error: error
    };
  }
};
