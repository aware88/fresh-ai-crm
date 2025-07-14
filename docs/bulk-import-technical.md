# Bulk Import Technical Documentation

This document provides technical details about the bulk import implementation in Fresh AI CRM.

## Architecture Overview

The bulk import system consists of the following components:

1. **Frontend Components**
   - `UnifiedDataUploader`: Main component for file upload and entity selection
   - `BulkImportGuide`: Component providing detailed guidance on file formats
   - UI feedback elements for upload status and results

2. **API Endpoints**
   - `/api/bulk-import/[entityType]`: Dynamic route handler for different entity types
   - `/api/files/extract-content`: Endpoint for PDF content extraction

3. **Utility Functions**
   - File parsing utilities for different file formats
   - Data normalization and validation functions

## File Parsing Implementation

### File Parser Module

The `fileParser.ts` module provides functions to parse different file formats:

```typescript
// Main parsing functions
parseExcelFile(buffer: ArrayBuffer): Promise<any[]>
parseCsvFile(content: string): Promise<any[]>
parseWordDocument(buffer: ArrayBuffer): Promise<any[]>
```

### Excel Parsing

Excel files are parsed using the `xlsx` library:

```typescript
export async function parseExcelFile(buffer: ArrayBuffer): Promise<any[]> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];
  
  // Convert to JSON with headers
  const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
  
  // Process data and normalize headers
  return processSheetData(data);
}
```

### CSV Parsing

CSV files are parsed using the `csv-parse` library:

```typescript
export async function parseCsvFile(content: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    }, (err, records) => {
      if (err) reject(err);
      else resolve(normalizeData(records));
    });
  });
}
```

### Word Document Parsing

Word documents are parsed using the `mammoth` library with multiple extraction strategies:

```typescript
export async function parseWordDocument(buffer: ArrayBuffer): Promise<any[]> {
  // Convert Word document to HTML
  const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
  const html = result.value;
  
  // Try to extract tables first
  const tableData = extractTablesFromHtml(html);
  if (tableData.length > 0) {
    return tableData;
  }
  
  // Fall back to key-value extraction
  return extractKeyValuePairsFromHtml(html);
}
```

#### Table Extraction

```typescript
function extractTablesFromHtml(html: string): any[] {
  const $ = cheerio.load(html);
  const tables = $('table');
  
  if (tables.length === 0) return [];
  
  // Process the first table found
  const rows = $(tables[0]).find('tr').toArray();
  const headers = $(rows[0]).find('th, td').map((i, el) => $(el).text().trim()).get();
  
  const data = [];
  for (let i = 1; i < rows.length; i++) {
    const rowData = {};
    const cells = $(rows[i]).find('td').toArray();
    
    cells.forEach((cell, index) => {
      if (index < headers.length) {
        rowData[normalizeHeader(headers[index])] = $(cell).text().trim();
      }
    });
    
    data.push(rowData);
  }
  
  return data;
}
```

#### Key-Value Extraction

```typescript
function extractKeyValuePairsFromHtml(html: string): any[] {
  const $ = cheerio.load(html);
  const paragraphs = $('p').toArray();
  
  const record = {};
  paragraphs.forEach(p => {
    const text = $(p).text().trim();
    const match = text.match(/^([^:]+):\s*(.+)$/);
    
    if (match) {
      const key = normalizeHeader(match[1].trim());
      const value = match[2].trim();
      record[key] = value;
    }
  });
  
  return Object.keys(record).length > 0 ? [record] : [];
}
```

## API Implementation

### Bulk Import API

The dynamic route handler for bulk imports (`/api/bulk-import/[entityType]/route.ts`):

```typescript
export async function POST(
  request: NextRequest,
  { params }: { params: { entityType: string } }
) {
  try {
    // Authentication and validation
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Get entity type from route params
    const { entityType } = params;
    if (!['contacts', 'suppliers', 'products', 'prices'].includes(entityType)) {
      return NextResponse.json(
        { error: `Invalid entity type: ${entityType}` },
        { status: 400 }
      );
    }
    
    // Process form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }
    
    // Parse file based on extension
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    let data: any[] = [];
    
    if (fileExtension === 'csv') {
      const fileContent = await file.text();
      data = await parseCsvFile(fileContent);
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const fileBuffer = await file.arrayBuffer();
      data = await parseExcelFile(fileBuffer);
    } else if (fileExtension === 'docx' || fileExtension === 'doc') {
      const fileBuffer = await file.arrayBuffer();
      data = await parseWordDocument(fileBuffer);
    } else {
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload a CSV, Excel, or Word file.' },
        { status: 400 }
      );
    }
    
    // Process data based on entity type
    const result = await processEntityData(entityType, data, session.user.id);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}
```

## Database Schema

### Entity Tables

Each entity type has its own table in the database:

- `contacts`: Stores contact information
- `suppliers`: Stores supplier information
- `products`: Stores product information
- `prices`: Stores price information for products

### File Metadata

File metadata is stored in the `files` table:

```sql
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  size INTEGER NOT NULL,
  type TEXT NOT NULL,
  path TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);
```

## Error Handling

The bulk import system implements comprehensive error handling:

1. **Validation Errors**: Missing required fields, invalid data formats
2. **Processing Errors**: Issues during file parsing or data processing
3. **Database Errors**: Problems inserting or updating records

Errors are collected and returned to the frontend for display to the user.

## Security Considerations

1. **Authentication**: All API endpoints require authentication
2. **Authorization**: Users can only access their own data
3. **File Validation**: Files are validated for type and size
4. **Input Sanitization**: All input data is sanitized before processing

## Performance Optimization

1. **Batch Processing**: Large datasets are processed in batches
2. **Asynchronous Operations**: File parsing and database operations are performed asynchronously
3. **Memory Management**: Streaming is used for large files to minimize memory usage

## Integration Points

The bulk import system integrates with other components:

1. **File Storage**: Files are stored in Supabase Storage
2. **Database**: Processed data is stored in the appropriate tables
3. **PDF Processing**: PDF content extraction for product and price data
4. **Metakocka Integration**: Data can be synced with Metakocka

## Testing

The bulk import system includes tests for:

1. **Unit Tests**: Individual parsing functions
2. **Integration Tests**: End-to-end import workflows
3. **Error Handling Tests**: Validation and error scenarios

## Future Enhancements

1. **Template Generation**: Generate template files for each entity type
2. **Advanced Validation**: More sophisticated data validation rules
3. **Bulk Export**: Export data in various formats
4. **Import History**: Track import history and allow rollbacks
5. **Custom Field Mapping**: Allow users to map custom fields
