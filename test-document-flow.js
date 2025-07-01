/**
 * Test script for document processing flow
 * 
 * This script demonstrates how to use the document processing API endpoints:
 * 1. Upload a document (already implemented in UI)
 * 2. Process the document with AI (POST /api/suppliers/documents/process)
 * 3. Review and approve/reject the document (PUT /api/suppliers/documents/process)
 * 4. Get documents pending review (GET /api/suppliers/documents/process)
 */

// Example curl commands for testing the API endpoints

// 1. Process a document with AI (as a service)
// Replace YOUR_SERVICE_TOKEN with the actual service token
// Replace DOCUMENT_ID with an actual document ID
console.log(`
# Process a document with AI (as a service)
curl -X POST \\
  http://localhost:3000/api/suppliers/documents/process \\
  -H 'Content-Type: application/json' \\
  -H 'X-Service-Token: YOUR_SERVICE_TOKEN' \\
  -d '{
    "documentId": "DOCUMENT_ID",
    "status": "processing",
    "extractedData": {
      "products": [
        {
          "name": "Test Product",
          "sku": "TP-001",
          "description": "A test product",
          "category": "Test"
        }
      ],
      "pricing": [
        {
          "product_name": "Test Product",
          "price": 100,
          "currency": "USD",
          "unit_price": true,
          "quantity": 1,
          "unit": "each"
        }
      ],
      "metadata": {
        "document_date": "2025-06-22",
        "reference_number": "REF-001",
        "additional_notes": "Test document"
      }
    }
  }'
`);

// 2. Update document status to pending_review (as a service)
console.log(`
# Update document status to pending_review (as a service)
curl -X POST \\
  http://localhost:3000/api/suppliers/documents/process \\
  -H 'Content-Type: application/json' \\
  -H 'X-Service-Token: YOUR_SERVICE_TOKEN' \\
  -d '{
    "documentId": "DOCUMENT_ID",
    "status": "pending_review"
  }'
`);

// 3. Get documents pending review (as a user)
console.log(`
# Get documents pending review (as a user)
curl -X GET \\
  http://localhost:3000/api/suppliers/documents/process?status=pending_review
`);

// 4. Approve a document (as a user)
console.log(`
# Approve a document (as a user)
curl -X PUT \\
  http://localhost:3000/api/suppliers/documents/process \\
  -H 'Content-Type: application/json' \\
  -d '{
    "documentId": "DOCUMENT_ID",
    "approved": true
  }'
`);

// 5. Reject a document (as a user)
console.log(`
# Reject a document (as a user)
curl -X PUT \\
  http://localhost:3000/api/suppliers/documents/process \\
  -H 'Content-Type: application/json' \\
  -d '{
    "documentId": "DOCUMENT_ID",
    "approved": false
  }'
`);

console.log(`
# Note: Replace DOCUMENT_ID with an actual document ID from your database
# Replace YOUR_SERVICE_TOKEN with the actual service token from your environment variables
`);
