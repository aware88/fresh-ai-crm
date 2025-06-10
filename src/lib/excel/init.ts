/**
 * Initialization functions for Excel data
 */
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import * as XLSX from 'xlsx';

/**
 * Create a default Excel file with personality data
 */
export const createDefaultExcelFile = async (filePath: string) => {
  try {
    // Create a simple workbook with personality data
    const workbook = XLSX.utils.book_new();

    // Create a worksheet with personality types and traits
    const personalityData = [
      ['Personality Type', 'Description', 'Communication Style', 'Decision Making', 'Strengths'],
      ['Analytical', 'Logical, methodical, and detail-oriented', 'Precise and data-driven', 'Based on facts and logic', 'Problem-solving, attention to detail'],
      ['Driver', 'Results-oriented, direct, and decisive', 'Direct and to the point', 'Quick and decisive', 'Leadership, efficiency, goal achievement'],
      ['Amiable', 'Supportive, diplomatic, and patient', 'Warm and relationship-focused', 'Consensus-seeking', 'Team building, mediation, listening'],
      ['Expressive', 'Enthusiastic, creative, and sociable', 'Animated and persuasive', 'Intuitive and spontaneous', 'Innovation, motivation, networking']
    ];

    // Create a worksheet for personality traits
    const personalityWorksheet = XLSX.utils.aoa_to_sheet(personalityData);

    // Add the worksheet to the workbook
    XLSX.utils.book_append_sheet(workbook, personalityWorksheet, 'Personality Types');

    // Create a worksheet for communication tips
    const communicationData = [
      ['Personality Type', 'Do', 'Don\'t'],
      ['Analytical', 'Provide detailed information and data', 'Rush them or be vague'],
      ['Driver', 'Be direct and focus on results', 'Waste time with small talk'],
      ['Amiable', 'Show personal interest and be supportive', 'Be confrontational or pushy'],
      ['Expressive', 'Be enthusiastic and allow time for discussion', 'Cut them off or be too rigid']
    ];

    const communicationWorksheet = XLSX.utils.aoa_to_sheet(communicationData);
    XLSX.utils.book_append_sheet(workbook, communicationWorksheet, 'Communication Tips');

    // Write the workbook to a file
    XLSX.writeFile(workbook, filePath);
    console.log(`Default Excel file created at: ${filePath}`);
    return true;
  } catch (error) {
    console.error('Error creating default Excel file:', error);
    return false;
  }
};

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
    
    // Check if excel data file exists - if not, create a default one
    const excelFilePath = path.join(dataDir, 'excel_personality_data.xlsx');
    let exists = fs.existsSync(excelFilePath);
    
    // If the file doesn't exist, create a default one
    if (!exists) {
      console.log('Excel file does not exist, creating default file...');
      const created = await createDefaultExcelFile(excelFilePath);
      exists = created;
    }
    
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
