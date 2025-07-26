# Withcar Email Fetching Script

This script is designed to fetch and analyze emails from Withcar's Italian email account for communication pattern analysis and AI training preparation.

## Purpose

The script fetches:
- **100 sent emails** - to analyze Withcar's writing style, communication patterns, and response strategies
- **100 received emails** - to understand customer issues, common inquiries, and communication context

This data will be used to:
1. Train AI models with Withcar's communication style
2. Identify common customer issues and patterns
3. Prepare for production deployment with better understanding of their business context
4. Analyze response time patterns and communication effectiveness

## Prerequisites

1. **Email Account Connected**: Ensure Withcar's Italian email account is connected to the CRM
2. **Server Running**: The Next.js development server must be running (`npm run dev`)
3. **Authentication**: You must be logged in to the CRM with appropriate permissions

## Usage

### Method 1: Using npm script (Recommended)
```bash
npm run fetch:withcar-emails
```

### Method 2: Direct execution
```bash
node scripts/fetch-withcar-emails.js
```

## What the Script Does

### 1. Account Discovery
- Automatically searches for Withcar email accounts
- Looks for accounts containing "withcar", ".it" domain, or similar patterns
- Lists all available accounts if Withcar account is not found

### 2. Email Fetching
- Fetches up to 100 sent emails from the "Sent" folder
- Fetches up to 100 received emails from the "Inbox" folder
- Supports both Gmail API and IMAP protocols
- Handles different folder naming conventions (Gmail vs IMAP)

### 3. Data Processing
For each email, the script extracts and processes:
- **Basic Info**: Subject, sender, recipient, date
- **Content**: Full body content and plain text version
- **Analysis Data**: Word count, language detection, attachment info
- **Metadata**: Folder location, read status

### 4. Language Detection
- Simple Italian language detection using common Italian words
- Helps identify the primary language of communication
- Useful for training language-specific AI models

### 5. File Output
The script creates three files in `data/withcar-emails/`:

#### Sent Emails: `withcar-sent-emails-YYYY-MM-DD.json`
```json
{
  "metadata": {
    "fetchDate": "2024-01-15T10:30:00.000Z",
    "totalEmails": 100,
    "source": "withcar-italian-account",
    "purpose": "communication-pattern-analysis"
  },
  "emails": [
    {
      "id": "email-id",
      "subject": "Re: Order inquiry",
      "from": "withcar@example.it",
      "to": "customer@example.com",
      "date": "2024-01-15T09:15:00.000Z",
      "body": "Full HTML content...",
      "bodyText": "Plain text version...",
      "wordCount": 150,
      "language": "italian",
      "hasAttachments": false,
      "attachmentCount": 0,
      "folder": "sent"
    }
  ]
}
```

#### Received Emails: `withcar-received-emails-YYYY-MM-DD.json`
Similar structure but contains emails received by Withcar.

#### Analysis Report: `withcar-analysis-report-YYYY-MM-DD.json`
```json
{
  "summary": {
    "totalSentEmails": 100,
    "totalReceivedEmails": 100,
    "totalEmails": 200,
    "analysisDate": "2024-01-15T10:30:00.000Z"
  },
  "sentEmailsAnalysis": {
    "averageWordCount": 125.5,
    "languageDistribution": {
      "italian": 85,
      "unknown": 15
    },
    "subjectPatterns": {
      "withRe": 45,
      "withFwd": 5,
      "questions": 12,
      "urgent": 3
    },
    "timeDistribution": {
      "9": 15,
      "10": 25,
      "14": 20
    }
  },
  "receivedEmailsAnalysis": {
    // Similar structure for received emails
  },
  "recommendations": [
    "Analyze writing style consistency in sent emails",
    "Identify common customer issues from received emails",
    "Review response time patterns",
    "Examine language usage for AI training"
  ]
}
```

## Analysis Insights

### Sent Emails Analysis
- **Writing Style**: Consistency in tone, formality, and structure
- **Response Patterns**: How Withcar typically responds to different types of inquiries
- **Language Usage**: Italian language patterns and business terminology
- **Communication Timing**: When emails are typically sent

### Received Emails Analysis
- **Customer Issues**: Common problems and inquiries
- **Communication Patterns**: How customers typically reach out
- **Language Preferences**: Customer language usage
- **Inquiry Types**: Categories of customer requests

## Next Steps After Running the Script

1. **Review the Data**
   - Examine the generated JSON files
   - Review the analysis report for insights

2. **Analyze Communication Patterns**
   - Identify common response templates
   - Note writing style characteristics
   - Document typical customer issues

3. **Prepare AI Training Data**
   - Use sent emails to train response generation
   - Use received emails to understand customer context
   - Create training datasets based on the analysis

4. **Production Preparation**
   - Document communication standards
   - Prepare response templates
   - Set up monitoring for similar patterns

5. **Disconnect Email Account**
   - Once analysis is complete, safely disconnect the Withcar email account
   - Ensure all necessary data has been extracted and analyzed

## Troubleshooting

### Account Not Found
If the script can't find the Withcar account:
1. Check that the email account is properly connected
2. Verify the account email contains "withcar" or ".it"
3. Check the console output for available accounts
4. Manually modify the account detection logic if needed

### API Errors
If email fetching fails:
1. Ensure the development server is running
2. Check authentication status
3. Verify API endpoints are working
4. Check network connectivity

### Empty Results
If no emails are fetched:
1. Verify the email account has emails in the specified folders
2. Check folder names (Gmail uses "sent", IMAP might use "Sent")
3. Ensure proper permissions for email access

## Security Notes

- The script only reads email data, it doesn't modify or delete anything
- All data is stored locally in JSON files
- Ensure the `data/withcar-emails/` directory is not committed to version control
- Consider encrypting sensitive email data if needed

## File Structure

```
data/withcar-emails/
├── withcar-sent-emails-2024-01-15.json
├── withcar-received-emails-2024-01-15.json
└── withcar-analysis-report-2024-01-15.json
```

Remember to add `data/` to your `.gitignore` file to prevent accidentally committing sensitive email data. 