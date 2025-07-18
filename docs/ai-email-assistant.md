# AI Email Assistant Documentation

## 🤖 Overview

The AI Email Assistant is a sophisticated system that helps users compose email replies by generating contextual drafts, learning from user modifications, and continuously improving its suggestions over time.

## 🎯 Key Features

### Smart Draft Generation
- **Contextual Analysis**: AI analyzes incoming emails and generates appropriate replies
- **User History**: Learns from previous emails and user writing patterns
- **Style Adaptation**: Adapts to user's preferred communication style
- **Confidence Scoring**: Provides confidence metrics for generated content

### Interactive Editing
- **Side Panel Interface**: Edit drafts in a dedicated workspace
- **Real-time Changes**: Track modifications as they happen
- **Change Highlighting**: Visual indicators for modified sections
- **User Notes**: Optional explanations for why changes were made

### Machine Learning Pipeline
- **Pattern Recognition**: Identifies user preferences and common modifications
- **Continuous Learning**: Improves suggestions based on user feedback
- **Performance Metrics**: Tracks accuracy and user satisfaction
- **Privacy Controls**: User-controlled data retention and sharing

## 🏗️ Architecture

### Frontend Components

#### Settings Page (`/settings/email-ai`)
```typescript
interface AIEmailSettings {
  aiDraftEnabled: boolean;
  aiDraftAutoGenerate: boolean;
  aiDraftPosition: 'sidebar' | 'modal' | 'inline';
  responseStyle: 'professional' | 'friendly' | 'formal' | 'casual';
  responseLength: 'concise' | 'detailed' | 'custom';
  includeContext: boolean;
  learningEnabled: boolean;
  trackChanges: boolean;
  saveUserNotes: boolean;
  dataRetention: 'forever' | '1year' | '6months' | '3months';
  shareForImprovement: boolean;
}
```

#### AI Draft Window (`/src/components/email/AIDraftWindow.tsx`)
- **Draft Display**: Shows AI-generated subject and body
- **Edit Interface**: Allows real-time editing with change tracking
- **User Notes**: Optional field for explaining modifications
- **Action Buttons**: Generate, regenerate, and send functionality

### Backend APIs

#### Draft Generation (`/api/emails/ai-draft`)
```typescript
POST /api/emails/ai-draft
{
  emailId: string;
  originalEmail: {
    subject: string;
    body: string;
    from: string;
    to: string;
  };
  settings: AIEmailSettings;
}

Response: {
  success: boolean;
  id: string;
  subject: string;
  body: string;
  tone: string;
  confidence: number;
}
```

#### Learning Data (`/api/emails/ai-learning`)
```typescript
POST /api/emails/ai-learning
{
  emailId: string;
  originalDraft: { subject: string; body: string; };
  finalDraft: { subject: string; body: string; };
  changes: Change[];
  userNotes?: string;
  draftId: string;
}

Response: {
  success: boolean;
  learningId: string;
  metrics: LearningMetrics;
}
```

### Database Schema

#### Core Tables

##### `user_ai_email_settings`
- User preferences and configuration
- Privacy and data retention settings
- AI behavior customization

##### `ai_email_drafts`
- Generated draft content and metadata
- Confidence scores and model information
- User feedback and usage tracking

##### `ai_learning_data`
- Learning session records
- Original vs final content comparison
- User notes and feedback

##### `ai_learning_changes`
- Individual edit records
- Change categorization and analysis
- Position and context tracking

##### `ai_learning_insights`
- AI-generated insights from user behavior
- Pattern recognition results
- Improvement recommendations

##### `user_ai_scores`
- Performance metrics per user
- Improvement tracking over time
- Preference analysis

## 🚀 Getting Started

### 1. Enable AI Assistant
1. Navigate to `/settings/email-ai`
2. Toggle "AI Draft Assistant" to enabled
3. Configure your preferences:
   - **Draft Position**: Choose sidebar, modal, or inline
   - **Response Style**: Select professional, friendly, formal, or casual
   - **Learning Settings**: Enable/disable change tracking and user notes

### 2. Using the Assistant
1. Open an email in the email detail view
2. Click "Show AI Draft" button
3. Review the generated draft in the side panel
4. Edit as needed - all changes are tracked
5. Optionally add notes explaining your changes
6. Click "Send" when ready

### 3. Privacy Controls
- **Data Retention**: Choose how long learning data is stored
- **Change Tracking**: Enable/disable modification logging
- **User Notes**: Toggle note-taking feature
- **Sharing**: Control whether data is used for system improvement

## 🔧 Configuration

### Environment Variables
```bash
# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o
OPENAI_TEMPERATURE=0.7
OPENAI_MAX_TOKENS=1000

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### AI Model Configuration
The system uses OpenAI's GPT models with customizable parameters:
- **Temperature**: Controls creativity (0.0-1.0)
- **Max Tokens**: Maximum response length
- **Model**: GPT model version (gpt-4o recommended)

## 📊 Analytics & Insights

### User Metrics
- **Draft Usage**: How often AI drafts are used
- **Modification Rate**: Percentage of drafts that are edited
- **Satisfaction Score**: User feedback on draft quality
- **Time Savings**: Estimated time saved using AI assistance

### Learning Insights
- **Common Patterns**: Frequently made modifications
- **Style Preferences**: User's preferred communication style
- **Improvement Areas**: Where AI can be enhanced
- **Success Metrics**: Accuracy and user satisfaction trends

## 🔒 Privacy & Security

### Data Protection
- **User Control**: Users control their data retention and sharing
- **Encryption**: All data encrypted in transit and at rest
- **Access Control**: Row-level security ensures data isolation
- **Audit Trail**: Complete logging of data access and modifications

### Compliance
- **GDPR Ready**: User consent and data portability
- **Data Minimization**: Only necessary data is collected
- **Right to Deletion**: Users can delete their learning data
- **Transparency**: Clear information about data usage

## 🛠️ Development

### Adding New Features
1. **Database Changes**: Update schema in migration files
2. **API Endpoints**: Add new routes in `/api/emails/`
3. **Frontend Components**: Update UI components as needed
4. **Settings Integration**: Add new options to settings page

### Testing
```bash
# Run AI assistant tests
npm run test:ai-assistant

# Test API endpoints
npm run test:api

# Integration tests
npm run test:integration
```

### Debugging
- **Console Logs**: Check browser console for client-side issues
- **API Logs**: Monitor Supabase logs for backend issues
- **OpenAI Logs**: Check OpenAI API usage and errors
- **Database Queries**: Use Supabase dashboard for query analysis

## 📈 Performance Optimization

### Caching Strategy
- **Draft Caching**: Cache recent drafts to reduce API calls
- **User Preferences**: Cache settings in localStorage
- **Model Responses**: Cache similar requests to improve speed

### Rate Limiting
- **API Limits**: Respect OpenAI API rate limits
- **User Limits**: Implement per-user rate limiting
- **Batch Processing**: Process multiple requests efficiently

## 🔮 Future Enhancements

### Planned Features
- **Multi-language Support**: Generate drafts in multiple languages
- **Template System**: Pre-defined response templates
- **Sentiment Analysis**: Analyze email tone and respond appropriately
- **Integration Expansion**: Support for more email providers
- **Advanced Analytics**: Deeper insights into usage patterns

### Roadmap
- **Q1 2024**: Multi-language support and template system
- **Q2 2024**: Advanced analytics and sentiment analysis
- **Q3 2024**: Integration with additional email providers
- **Q4 2024**: Mobile app support and offline capabilities

## 🐛 Troubleshooting

### Common Issues

#### AI Not Generating Drafts
- Check OpenAI API key configuration
- Verify user has AI assistant enabled in settings
- Ensure email content is not empty or too short

#### Changes Not Being Tracked
- Verify learning is enabled in user settings
- Check database connectivity
- Ensure proper authentication

#### Poor Draft Quality
- Review user's writing style history
- Check if sufficient learning data exists
- Verify AI model configuration

### Support
For technical support or feature requests:
- Create an issue in the GitHub repository
- Contact the development team
- Check the FAQ section for common questions

## 📚 API Reference

### Endpoints

#### Generate Draft
```http
POST /api/emails/ai-draft
Content-Type: application/json
Authorization: Bearer {token}

{
  "emailId": "uuid",
  "originalEmail": {
    "subject": "string",
    "body": "string",
    "from": "email",
    "to": "email"
  },
  "settings": {
    "responseStyle": "professional",
    "responseLength": "concise",
    "includeContext": true
  }
}
```

#### Save Learning Data
```http
POST /api/emails/ai-learning
Content-Type: application/json
Authorization: Bearer {token}

{
  "emailId": "uuid",
  "originalDraft": {
    "subject": "string",
    "body": "string"
  },
  "finalDraft": {
    "subject": "string",
    "body": "string"
  },
  "changes": [
    {
      "type": "modified",
      "section": "body",
      "original": "string",
      "modified": "string",
      "timestamp": "datetime"
    }
  ],
  "userNotes": "string",
  "draftId": "uuid"
}
```

### Response Formats

#### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "subject": "string",
    "body": "string",
    "confidence": 0.95,
    "tone": "professional"
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Missing required field: emailId",
    "details": {}
  }
}
```

---

*This documentation is continuously updated as the AI Email Assistant evolves. Last updated: December 2024* 