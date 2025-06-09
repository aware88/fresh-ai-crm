/**
 * Initialization functions for Excel data
 */
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

/**
 * Ensure all required directories and files exist for Excel data
 */
export const initializeExcelData = async () => {
  try {
    const dataDir = path.join(process.cwd(), 'src', 'data');
    
    // Create data directory if it doesn't exist
    if (!fs.existsSync(dataDir)) {
      await fsPromises.mkdir(dataDir, { recursive: true });
    }
    
    // Check if excel data file exists - we don't create an empty one as it wouldn't be valid Excel
    const excelFilePath = path.join(dataDir, 'excel_personality_data.xlsx');
    const exists = fs.existsSync(excelFilePath);
    
    console.log('Excel data directory initialized successfully');
    return {
      initialized: true,
      excelExists: exists,
      excelPath: excelFilePath
    };
  } catch (error) {
    console.error('Error initializing Excel data:', error);
    return {
      initialized: false,
      excelExists: false,
      error: error
    };
  }
};
