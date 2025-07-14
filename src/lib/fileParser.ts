import * as XLSX from 'xlsx';
import { parse } from 'csv-parse';
import * as cheerio from 'cheerio';

/**
 * Parse Excel file from buffer
 */
export async function parseExcelFile(buffer: ArrayBuffer): Promise<any[]> {
  try {
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    
    // Convert to JSON with headers
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    // Process data and normalize headers
    return processSheetData(data);
  } catch (error) {
    console.error('Error parsing Excel file:', error);
    throw new Error('Failed to parse Excel file');
  }
}

/**
 * Parse CSV file from content string
 */
export async function parseCsvFile(content: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) {
        console.error('Error parsing CSV file:', err);
        reject(new Error('Failed to parse CSV file'));
      } else {
        resolve(normalizeData(records));
      }
    });
  });
}

/**
 * Parse Word document from buffer
 * Note: This is a simplified implementation since mammoth is not installed
 */
export async function parseWordDocument(buffer: ArrayBuffer): Promise<any[]> {
  try {
    // For now, return empty array since mammoth library is not installed
    // This prevents build errors while maintaining the API
    console.warn('Word document parsing not fully implemented - mammoth library required');
    return [];
  } catch (error) {
    console.error('Error parsing Word document:', error);
    throw new Error('Failed to parse Word document');
  }
}

/**
 * Process sheet data from Excel
 */
function processSheetData(data: any[]): any[] {
  if (data.length === 0) return [];
  
  const headers = data[0];
  const rows = data.slice(1);
  
  return rows.map(row => {
    const obj: any = {};
    headers.forEach((header: string, index: number) => {
      if (header && row[index] !== undefined) {
        obj[normalizeHeader(header)] = row[index];
      }
    });
    return obj;
  });
}

/**
 * Normalize data by cleaning up field names
 */
function normalizeData(records: any[]): any[] {
  return records.map(record => {
    const normalized: any = {};
    Object.keys(record).forEach(key => {
      const normalizedKey = normalizeHeader(key);
      normalized[normalizedKey] = record[key];
    });
    return normalized;
  });
}

/**
 * Normalize header names to consistent format
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

/**
 * Extract tables from HTML (for Word document parsing)
 */
function extractTablesFromHtml(html: string): any[] {
  const $ = cheerio.load(html);
  const tables = $('table');
  
  if (tables.length === 0) return [];
  
  const tableData: any[] = [];
  
  tables.each((_, table) => {
    const rows = $(table).find('tr');
    const headers: string[] = [];
    
    // Extract headers from first row
    rows.first().find('th, td').each((_, cell) => {
      headers.push($(cell).text().trim());
    });
    
    // Extract data rows
    rows.slice(1).each((_, row) => {
      const rowData: any = {};
      $(row).find('td').each((index, cell) => {
        if (headers[index]) {
          rowData[normalizeHeader(headers[index])] = $(cell).text().trim();
        }
      });
      if (Object.keys(rowData).length > 0) {
        tableData.push(rowData);
      }
    });
  });
  
  return tableData;
}

/**
 * Extract key-value pairs from HTML (fallback for Word documents)
 */
function extractKeyValuePairsFromHtml(html: string): any[] {
  const $ = cheerio.load(html);
  const text = $.text();
  const lines = text.split('\n').filter(line => line.trim());
  
  const data: any[] = [];
  const currentRecord: any = {};
  
  lines.forEach(line => {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.substring(0, colonIndex).trim();
      const value = line.substring(colonIndex + 1).trim();
      if (key && value) {
        currentRecord[normalizeHeader(key)] = value;
      }
    }
  });
  
  if (Object.keys(currentRecord).length > 0) {
    data.push(currentRecord);
  }
  
  return data;
} 