// Remove direct filesystem dependencies for Next.js compatibility
// import { parse } from 'csv-parse/sync';
// import * as XLSX from 'xlsx';

/**
 * This file has been modified to use mock data instead of reading from the filesystem
 * to make it compatible with Next.js client components.
 */

/**
 * Flexible data record type that can handle any schema
 */
export interface FlexibleDataRecord {
  [key: string]: string;
}

/**
 * Mock function to provide personality profile data
 * @returns Array of records with personality profile data
 */
export const loadCsvData = (filePath: string): FlexibleDataRecord[] => {
  // Return mock data based on the requested file path
  if (filePath.includes('personality_profiles')) {
    return [
      {
        "Profile_ID": "P001",
        "Personality_Type": "Analytical",
        "Communication_Style": "Logical, data-driven",
        "Decision_Making": "Rational, evidence-based",
        "Values": "Accuracy, efficiency, logic",
        "Messaging_Do": "Provide data, be precise, focus on ROI",
        "Messaging_Dont": "Use emotional appeals, be vague",
        "Sales_Strategy": "Present facts, detailed analysis",
        "Framework": "DISC: C, MBTI: INTJ"
      },
      {
        "Profile_ID": "P002",
        "Personality_Type": "Relational",
        "Communication_Style": "Warm, personal",
        "Decision_Making": "Consensus-based, emotional",
        "Values": "Harmony, connection, teamwork",
        "Messaging_Do": "Be friendly, tell stories, emphasize relationships",
        "Messaging_Dont": "Be cold, rush decisions",
        "Sales_Strategy": "Build rapport, focus on testimonials",
        "Framework": "DISC: S, MBTI: ESFJ"
      },
      {
        "Profile_ID": "P003",
        "Personality_Type": "Driver",
        "Communication_Style": "Direct, results-oriented",
        "Decision_Making": "Quick, decisive",
        "Values": "Efficiency, results, control",
        "Messaging_Do": "Be concise, focus on outcomes",
        "Messaging_Dont": "Provide too much detail, be indecisive",
        "Sales_Strategy": "Bottom-line focus, competitive advantages",
        "Framework": "DISC: D, MBTI: ENTJ"
      }
    ];
  } else if (filePath.includes('mock_personality_data')) {
    return [
      {
        "Profile_ID": "M001",
        "Personality_Type": "Expressive",
        "Communication_Style": "Enthusiastic, animated",
        "Decision_Making": "Intuitive, spontaneous",
        "Values": "Recognition, creativity, fun",
        "Messaging_Do": "Be engaging, use visuals, be innovative",
        "Messaging_Dont": "Be boring, use too much data",
        "Sales_Strategy": "Exciting presentations, focus on innovation",
        "Framework": "DISC: I, MBTI: ENFP"
      }
    ];
  }
  
  return [];
};

/**
 * Mock function to provide Excel data with multiple sheets
 * @returns Object with sheet names as keys and arrays of records as values
 */
export const loadExcelData = (): { [sheetName: string]: FlexibleDataRecord[] } => {
  // Return mock Excel data
  return {
    "CustomerTypes": [
      {
        "Type_ID": "CT001",
        "Type_Name": "Enterprise",
        "Communication_Preference": "Formal, scheduled meetings",
        "Decision_Process": "Committee-based, multiple stakeholders",
        "Value_Drivers": "ROI, scalability, enterprise support",
        "Best_Approach": "Case studies, detailed implementation plans"
      },
      {
        "Type_ID": "CT002",
        "Type_Name": "SMB",
        "Communication_Preference": "Direct, solution-focused",
        "Decision_Process": "Owner/founder driven, quick",
        "Value_Drivers": "Cost-effectiveness, ease of use",
        "Best_Approach": "Demos, quick wins, competitive pricing"
      }
    ],
    "IndustryInsights": [
      {
        "Industry": "Technology",
        "Communication_Style": "Technical, innovation-focused",
        "Pain_Points": "Rapid change, talent acquisition",
        "Value_Proposition": "Cutting-edge solutions, integration capabilities"
      },
      {
        "Industry": "Healthcare",
        "Communication_Style": "Compliance-focused, patient-centered",
        "Pain_Points": "Regulatory burden, data security",
        "Value_Proposition": "HIPAA compliance, improved patient outcomes"
      }
    ]
  };
};

/**
 * Function to get all available data (CSV and Excel) formatted for the OpenAI prompt
 */
export const getAllFormattedDataForPrompt = (): string => {
  let formattedData = '';
  
  // Load data from all sources
  const profilesData = loadCsvData('personality_profiles');
  const mockData = loadCsvData('mock_personality_data');
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
  const profilesData = loadCsvData('personality_profiles');
  const mockData = loadCsvData('mock_personality_data');
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
