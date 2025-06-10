const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Ensure the data directory exists
const dataDir = path.join(__dirname, '..', 'src', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

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
const filePath = path.join(dataDir, 'excel_personality_data.xlsx');
XLSX.writeFile(workbook, filePath);

console.log(`Excel file created at: ${filePath}`);
