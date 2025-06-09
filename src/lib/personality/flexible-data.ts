import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';

// Path to the data files
const personalityProfilesPath = path.join(process.cwd(), 'src/data/personality_profiles.csv');
const mockDataPath = path.join(process.cwd(), 'src/data/mock_personality_data.csv');
const excelDataPath = path.join(process.cwd(), 'src/data/excel_personality_data.xlsx');

/**
 * Flexible data record type that can handle any schema
 */
export interface FlexibleDataRecord {
  [key: string]: string;
}

/**
 * Function to load data from a CSV file with any schema
 * @param filePath Path to the CSV file
 * @returns Array of records with flexible schema
 */
export const loadCsvData = (filePath: string): FlexibleDataRecord[] => {
  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.warn(`CSV file not found: ${filePath}`);
      return [];
    }

    // Read and parse CSV file
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
    });

    return records as FlexibleDataRecord[];
  } catch (error) {
    console.error(`Error loading CSV data from ${filePath}:`, error);
    return [];
  }
};

/**
 * Function to load data from an Excel file with multiple sheets
 * @param filePath Path to the Excel file
 * @returns Object with sheet names as keys and arrays of records as values
 */
export const loadExcelData = (): { [sheetName: string]: FlexibleDataRecord[] } => {
  try {
    // Check if file exists
    if (!fs.existsSync(excelDataPath)) {
      console.warn(`Excel file not found: ${excelDataPath}`);
      return {};
    }

    // Read Excel file
    const workbook = XLSX.readFile(excelDataPath);
    const result: { [sheetName: string]: FlexibleDataRecord[] } = {};

    // Process each sheet
    workbook.SheetNames.forEach(sheetName => {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      result[sheetName] = jsonData as FlexibleDataRecord[];
    });

    return result;
  } catch (error) {
    console.error(`Error loading Excel data from ${excelDataPath}:`, error);
    return {};
  }
};

/**
 * Function to get all available data (CSV and Excel) formatted for the OpenAI prompt
 */
export const getAllFormattedDataForPrompt = (): string => {
  let formattedData = '';
  
  // Load data from all sources
  const profilesData = loadCsvData(personalityProfilesPath);
  const mockData = loadCsvData(mockDataPath);
  const excelData = loadExcelData();
  
  // Format CSV personality profiles if available
  if (profilesData.length > 0) {
    formattedData += 'PERSONALITY PROFILES REFERENCE:\n\n';
    profilesData.forEach((profile, index) => {
      formattedData += `PROFILE ${index + 1}:\n`;
      // Dynamically include all fields from the profile
      Object.entries(profile).forEach(([key, value]) => {
        formattedData += `${key}: ${value}\n`;
      });
      formattedData += '\n';
    });
  }
  
  // Format CSV mock data if available
  if (mockData.length > 0) {
    formattedData += 'MOCK PERSONALITY PROFILES REFERENCE:\n\n';
    mockData.forEach((profile, index) => {
      formattedData += `MOCK PROFILE ${index + 1}:\n`;
      // Dynamically include all fields from the profile
      Object.entries(profile).forEach(([key, value]) => {
        formattedData += `${key}: ${value}\n`;
      });
      formattedData += '\n';
    });
  }
  
  // Format Excel data if available
  if (Object.keys(excelData).length > 0) {
    Object.entries(excelData).forEach(([sheetName, profiles]) => {
      formattedData += `EXCEL DATA - ${sheetName.toUpperCase()} SHEET REFERENCE:\n\n`;
      profiles.forEach((profile, index) => {
        formattedData += `${sheetName.toUpperCase()} PROFILE ${index + 1}:\n`;
        // Dynamically include all fields from the profile
        Object.entries(profile).forEach(([key, value]) => {
          formattedData += `${key}: ${value}\n`;
        });
        formattedData += '\n';
      });
    });
  }
  
  return formattedData;
};

/**
 * Function to get a limited subset of data for the OpenAI prompt to avoid token limits
 * @param maxProfilesPerSource Maximum number of profiles to include from each source
 */
export const getLimitedFormattedDataForPrompt = (maxProfilesPerSource: number = 3): string => {
  let formattedData = '';
  
  // Load data from all sources
  const profilesData = loadCsvData(personalityProfilesPath);
  const mockData = loadCsvData(mockDataPath);
  const excelData = loadExcelData();
  
  // Format CSV personality profiles if available (limited)
  if (profilesData.length > 0) {
    const limitedProfiles = profilesData.slice(0, maxProfilesPerSource);
    formattedData += 'PERSONALITY PROFILES REFERENCE:\n\n';
    limitedProfiles.forEach((profile, index) => {
      formattedData += `PROFILE ${index + 1}:\n`;
      // Dynamically include all fields from the profile
      Object.entries(profile).forEach(([key, value]) => {
        formattedData += `${key}: ${value}\n`;
      });
      formattedData += '\n';
    });
  }
  
  // Format CSV mock data if available (limited)
  if (mockData.length > 0) {
    const limitedMockData = mockData.slice(0, maxProfilesPerSource);
    formattedData += 'MOCK PERSONALITY PROFILES REFERENCE:\n\n';
    limitedMockData.forEach((profile, index) => {
      formattedData += `MOCK PROFILE ${index + 1}:\n`;
      // Dynamically include all fields from the profile
      Object.entries(profile).forEach(([key, value]) => {
        formattedData += `${key}: ${value}\n`;
      });
      formattedData += '\n';
    });
  }
  
  // Format Excel data if available (limited)
  if (Object.keys(excelData).length > 0) {
    Object.entries(excelData).forEach(([sheetName, profiles]) => {
      const limitedSheetProfiles = profiles.slice(0, maxProfilesPerSource);
      formattedData += `EXCEL DATA - ${sheetName.toUpperCase()} SHEET REFERENCE:\n\n`;
      limitedSheetProfiles.forEach((profile, index) => {
        formattedData += `${sheetName.toUpperCase()} PROFILE ${index + 1}:\n`;
        // Dynamically include all fields from the profile
        Object.entries(profile).forEach(([key, value]) => {
          formattedData += `${key}: ${value}\n`;
        });
        formattedData += '\n';
      });
    });
  }
  
  return formattedData;
};
