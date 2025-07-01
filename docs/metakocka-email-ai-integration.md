# Metakocka Email/AI Integration Documentation

## Overview

The Metakocka Email/AI Integration enhances the CRM's email capabilities by incorporating Metakocka ERP data into the AI processing pipeline. This integration enables more intelligent, context-aware email responses that leverage product, contact, and sales document data from Metakocka.

## Key Features

### 1. Email Context Enrichment

Emails are automatically enriched with relevant Metakocka data, including:

- **Product Information**: Pricing, availability, specifications
- **Contact Details**: Purchase history, preferences, account status
- **Sales Documents**: Order status, invoice details, payment history
- **Inventory Data**: Stock levels, expected restocking dates

### 2. AI-Powered Response Generation

The AI system leverages Metakocka data to generate more accurate and helpful email responses:

- Answers to product availability questions include real-time inventory data
- Pricing inquiries include current pricing from Metakocka
- Order status questions include actual order tracking information
- Invoice inquiries include payment status and details

### 3. Email Templates with Metakocka Data

Email templates can include placeholders for Metakocka data, which are automatically populated when the template is used:

- `{{metakocka.product.price}}`: Current product price
- `{{metakocka.product.availability}}`: Product availability status
- `{{metakocka.contact.balance}}`: Customer account balance
- `{{metakocka.invoice.status}}`: Invoice payment status

### 4. Bidirectional References

The integration maintains bidirectional references between emails and Metakocka entities:

- Emails can be linked to specific Metakocka products, contacts, and documents
- Metakocka entities can reference related email communications
- Changes in Metakocka are reflected in email contexts and responses

## Architecture

### Components

1. **Email Processor**: Analyzes incoming emails and extracts relevant entities
2. **Metakocka Context Builder**: Fetches and structures Metakocka data for AI processing
3. **AI Response Generator**: Creates responses using the enriched context
4. **Template Engine**: Populates email templates with Metakocka data

### Data Flow

1. Email is received or composed in the CRM
2. Email Processor identifies relevant entities (products, contacts, etc.)
3. Metakocka Context Builder fetches related data from Metakocka
4. AI Response Generator uses the enriched context to create responses
5. User can review and send the AI-generated response

## API Endpoints

### Email Context Enrichment

```
GET /api/emails/:id/metakocka-context
```

Retrieves Metakocka context for a specific email.

**Parameters**:
- `id`: Email ID

**Response**:
```json
{
  "products": [...],
  "contacts": [...],
  "salesDocuments": [...],
  "inventory": [...]
}
```

### AI Response Generation

```
POST /api/ai/generate-response
```

Generates an AI response using Metakocka context.

**Request Body**:
```json
{
  "emailId": "email-123",
  "includeMetakockaData": true,
  "prompt": "Generate a response about product availability"
}
```

**Response**:
```json
{
  "response": "Thank you for your inquiry about Product X. According to our inventory system, we currently have 15 units in stock and can ship within 2 business days..."
}
```

### Template Population

```
POST /api/emails/templates/populate
```

Populates an email template with Metakocka data.

**Request Body**:
```json
{
  "templateId": "product_inquiry",
  "contactId": "contact-123",
  "includeMetakockaData": true
}
```

**Response**:
```json
{
  "subject": "Your Product Inquiry",
  "body": "Dear John, thank you for your interest in Product X. The current price is $99.99 and we have 15 units in stock..."
}
```

## Testing

### Test Script

The `test-email-metakocka-integration.js` script in the `tests/metakocka` directory tests all aspects of the email/AI integration:

1. Email context enrichment with Metakocka data
2. AI response generation with Metakocka context
3. Template population with Metakocka data
4. Full email processing flow with Metakocka integration

### Running the Test

```bash
cd tests/metakocka
cp email-metakocka-test.env.sample .env
# Update .env with your credentials and test data IDs
./run-email-metakocka-test.sh
```

### Manual Testing

To manually test the integration:

1. Compose an email to a contact with Metakocka mapping
2. Check that the context panel shows relevant Metakocka data
3. Click the "Generate AI Response" button
4. Verify that the generated response includes relevant Metakocka information
5. Try different email templates with Metakocka placeholders

## Troubleshooting

### Common Issues

1. **Missing Metakocka Context**
   - Verify that the email is linked to a contact with Metakocka mapping
   - Check that Metakocka credentials are valid
   - Ensure that the contact has related products or sales documents in Metakocka

2. **Incorrect Data in AI Responses**
   - Verify that the Metakocka data is up-to-date
   - Check for synchronization errors in the error logs
   - Ensure that the AI has access to the correct context

3. **Template Placeholders Not Working**
   - Verify that the placeholder syntax is correct
   - Check that the referenced Metakocka entity exists
   - Ensure that the template is configured to use Metakocka data

### Debugging

1. Use the `/api/emails/:id/metakocka-context` endpoint to check what context is available
2. Review the error logs for any Metakocka API errors
3. Check the AI response generation logs for context processing issues
4. Verify that the email is correctly linked to Metakocka entities

## Best Practices

1. **Context Optimization**
   - Link emails to specific Metakocka entities when possible
   - Use specific product or document references in emails
   - Keep Metakocka data synchronized regularly

2. **AI Response Customization**
   - Create specific prompts for different types of inquiries
   - Review and refine AI responses for accuracy
   - Provide feedback to improve the AI's understanding of Metakocka data

3. **Template Design**
   - Create templates for common Metakocka-related scenarios
   - Use conditional sections based on Metakocka data availability
   - Include fallback text for missing Metakocka data

## Future Enhancements

1. **Predictive Responses**
   - Anticipate customer needs based on Metakocka purchase history
   - Suggest relevant products based on inventory and customer preferences
   - Proactively address potential issues based on order status

2. **Advanced Context Building**
   - Incorporate more Metakocka data sources
   - Improve entity recognition in emails
   - Enhance context relevance scoring

3. **Multilingual Support**
   - Support Metakocka data in multiple languages
   - Generate responses in the customer's preferred language
   - Translate Metakocka-specific terminology correctly
