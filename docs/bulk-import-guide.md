# Bulk Import Guide

This document provides comprehensive guidance on using the bulk import feature in Fresh AI CRM to upload and process various data types.

## Supported File Formats

The bulk import system supports the following file formats:

| Format | Extensions | Best For |
|--------|------------|----------|
| Excel  | .xlsx, .xls | Structured data with multiple columns, multiple sheets |
| CSV    | .csv       | Simple tabular data with header row |
| Word   | .docx, .doc | Tables or structured text with key-value pairs |
| PDF    | .pdf       | Content extraction for product catalogs and price lists |

## General Guidelines

- Files should contain **headers in the first row** that identify each column
- Column headers are **case-insensitive** (e.g., "Name", "name", or "NAME" are all recognized)
- If required fields are missing, those records will be skipped with an error message
- The system will attempt to match columns to the appropriate fields based on header names
- For best results, use the template formats provided in the UI
- Maximum file size: **10MB**

## Entity-Specific Import Formats

### Contacts

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| name | Full name of the contact | Yes* | John Doe |
| email | Email address | Yes* | john@example.com |
| phone | Phone number | No | +1 555-123-4567 |
| company | Company or organization name | No | Acme Inc. |
| title | Job title or position | No | Sales Manager |
| address | Physical address | No | 123 Main St, City |
| notes | Additional notes or comments | No | Met at conference |

\* Either name or email is required for each contact

#### Example CSV Format
```
name,email,phone,company,title,address,notes
John Doe,john@example.com,+1 555-123-4567,Acme Inc.,CEO,123 Main St,Key decision maker
Jane Smith,jane@example.com,+1 555-987-6543,XYZ Corp.,CTO,456 Oak Ave,Technical contact
,support@company.com,+1 800-555-1234,Company LLC,Support,789 Pine St,General support email
```

### Suppliers

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| name | Name of the supplier | Yes | ABC Distributors |
| email | Contact email address | No | orders@abcdist.com |
| phone | Contact phone number | No | +1 555-789-0123 |
| website | Supplier website URL | No | https://abcdist.com |
| address | Physical address | No | 789 Industry Blvd |
| notes | Additional information | No | Preferred supplier |

#### Example CSV Format
```
name,email,phone,website,address,notes
ABC Distributors,orders@abcdist.com,+1 555-789-0123,https://abcdist.com,789 Industry Blvd,Preferred supplier
Global Supply Co.,contact@globalsupply.com,+1 555-456-7890,https://globalsupply.com,456 Commerce St,Net 30 terms
Local Manufacturers,info@localmfg.com,+1 555-321-6540,https://localmfg.com,123 Factory Rd,Local pickup available
```

### Products

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| name | Product name | Yes | Ergonomic Chair |
| sku | Stock keeping unit (unique identifier) | No | CHAIR-001 |
| description | Product description | No | Adjustable office chair |
| price | Base price (numeric value) | No | 199.99 |
| category | Product category | No | Office Furniture |

#### Example CSV Format
```
name,sku,description,price,category
Ergonomic Chair,CHAIR-001,Adjustable office chair with lumbar support,199.99,Office Furniture
Standing Desk,DESK-002,Electric height-adjustable desk,349.99,Office Furniture
Wireless Mouse,ACC-101,Bluetooth wireless mouse,29.99,Accessories
```

### Prices

| Field | Description | Required | Example |
|-------|-------------|----------|---------|
| product_id | Product ID in the system | Yes* | 123 |
| product_sku | Product SKU (alternative to product_id) | Yes* | CHAIR-001 |
| price | Price amount (numeric value) | Yes | 199.99 |
| currency | Currency code | No | USD |
| effective_date | Date when price becomes effective | No | 2025-07-15 |

\* Either product_id or product_sku is required for each price record

#### Example CSV Format
```
product_sku,price,currency,effective_date
CHAIR-001,199.99,USD,2025-07-15
DESK-002,349.99,USD,2025-07-15
ACC-101,29.99,USD,2025-07-15
```

## File Parsing Details

### Excel Files

- The system reads the first sheet by default
- If multiple sheets are present, you can specify which sheet to use in the UI
- All columns are read and mapped to the appropriate fields based on headers
- Empty rows are skipped

### CSV Files

- Must include a header row
- Values should be comma-separated
- Text values can be optionally quoted
- Empty rows are skipped

### Word Documents

Word documents are parsed using the following strategies:

1. **Table Extraction**: If the document contains tables, the system will extract data from the first table found. The first row is treated as headers.

2. **Key-Value Extraction**: If no tables are found, the system will look for structured text with key-value pairs (e.g., "Name: John Doe").

3. **HTML Conversion**: The document is first converted to HTML, then parsed to extract structured data.

### PDF Files

PDF files are processed for content extraction:

1. **Text Extraction**: The system extracts all text content from the PDF.

2. **Pattern Recognition**: The extracted text is analyzed to identify products, prices, and other structured data.

3. **Interactive Review**: Users can review the extracted content through the PDF Content Extractor component before importing it into the system.

## Error Handling

The bulk import system provides detailed error reporting:

- Records with missing required fields are skipped
- Invalid data formats are reported with specific error messages
- A summary of successful and failed imports is provided after processing

## Best Practices

1. **Use Templates**: Start with the provided templates to ensure your data is formatted correctly.

2. **Check Headers**: Ensure your file has headers that match the expected field names.

3. **Required Fields**: Make sure all required fields are populated for each record.

4. **Data Validation**: Review your data for consistency before uploading (e.g., valid email formats, numeric values for prices).

5. **File Size**: Keep files under the 10MB limit for optimal performance.

6. **Test Small Batches**: When importing large datasets, test with a small batch first to ensure the format is correct.

## Troubleshooting

| Issue | Possible Solution |
|-------|-------------------|
| "Unsupported file format" | Ensure you're uploading a supported file type (.xlsx, .xls, .csv, .docx, .doc) |
| "Missing required fields" | Check that all required fields are populated in your file |
| "Invalid data format" | Verify that the data matches the expected format (e.g., numeric values for prices) |
| "File too large" | Split your data into smaller files (under 10MB each) |
| "No data found" | Ensure your file contains data and is not corrupted |

## Integration with Other Features

The bulk import feature integrates with other system components:

- **PDF Content Extraction**: Extract product and price data from supplier PDFs
- **File Viewer**: View and manage uploaded files
- **Data Management**: Update and maintain imported data
- **Metakocka Integration**: Sync imported data with Metakocka (if configured)
