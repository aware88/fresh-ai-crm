# AI Email Preferences System

## Overview

The AI Email Preferences System allows users to configure email handling preferences through natural conversation with AI. This system ensures that **ALL AI agents and analysis** throughout the platform respect user-defined preferences, creating a personalized and consistent experience.

## 🎯 Key Features

### Conversational Setup
- **Natural Language Configuration**: Users can set preferences by talking to AI
- **Intelligent Understanding**: AI converts requests into structured rules
- **Real-time Application**: Preferences are immediately applied to the system
- **Smart Suggestions**: AI provides helpful configuration recommendations

### Email Processing Control
- **Email Filtering**: Skip or prioritize emails based on content, sender, or type
- **Routing Rules**: Automatically escalate or route emails to human review
- **Exclusion Lists**: Completely exclude certain emails from AI processing
- **Content Customization**: Modify response content based on email context

### Style & Behavior
- **Response Styles**: Professional, friendly, formal, casual, technical
- **Tone Control**: Helpful, direct, empathetic, enthusiastic, cautious
- **Length Preferences**: Brief, optimal, detailed, comprehensive
- **Global Instructions**: Custom instructions that apply to all AI interactions

## 🏗️ Architecture

### Core Components

1. **AIPreferencesService** (`src/lib/ai/ai-preferences-service.ts`)
   - Central service used by ALL AI systems
   - Determines if emails should be processed
   - Provides AI instructions based on user preferences
   - Caches preferences for performance

2. **AIEmailPreferencesChat** (`src/components/email/AIEmailPreferencesChat.tsx`)
   - Conversational interface for setting preferences
   - Real-time chat with AI assistant
   - Visual preview of preference effects
   - Manual approval system for suggested changes

3. **Database Schema** (`user_ai_email_preferences`)
   - Structured storage of user preferences
   - JSONB fields for flexible rule definitions
   - Full audit trail and versioning
   - Row-level security for data protection

### Integration Points

The system integrates with **ALL** existing AI processing:

- **Email Analysis**: Respects filtering and exclusion rules
- **Response Generation**: Applies style and content preferences
- **Agent System**: All agents check preferences before processing
- **Queue Processing**: Preferences determine processing priority
- **Hub Service**: Central AI hub enforces all preference rules

## 🚀 Installation & Setup

### 1. Run Database Migration

```bash
# Option A: Use the automated setup script (Recommended)
node scripts/setup-ai-preferences.js

# Option B: Manual database migration
psql -d your_database -f sql-migrations/create-ai-email-preferences-table.sql
```

### 2. Restart Application

The system is automatically active once the database migration is complete. No additional configuration required.

### 3. User Access

Users can access the system at `/settings/email-ai` in the "Conversational Setup" section.

## 💬 Usage Examples

### Setting Up Email Filters

```
User: "Don't send AI responses to promotional emails"

AI: I'll create a filter to skip promotional emails. This will:
• Skip AI processing for emails with promotional keywords
• Prevent automatic responses to marketing emails

[Apply Settings] button appears
```

### Configuring Response Style

```
User: "Use a friendly tone for customer support emails"

AI: I'll set up friendly responses for customer support. This will:
• Use conversational, warm language
• Maintain helpfulness while being approachable

[Apply Settings] button appears
```

### Setting Exclusion Rules

```
User: "Never process emails from competitors automatically"

AI: I'll exclude competitor emails from AI processing. This will:
• Flag emails from competitor domains for manual review
• Ensure sensitive communications get human attention

[Apply Settings] button appears
```

### Priority Handling

```
User: "Mark all urgent emails as high priority"

AI: I'll set up urgency detection. This will:
• Detect urgent keywords (urgent, ASAP, emergency)
• Process urgent emails immediately
• Escalate for faster human review if needed

[Apply Settings] button appears
```

## 🔧 Technical Implementation

### How Preferences Are Applied

1. **Email Received** → System processes incoming email
2. **Preference Check** → `aiPreferencesService.shouldProcessEmail()` is called
3. **Decision Made** → System determines: process, skip, or escalate
4. **Instructions Applied** → If processing, AI gets custom instructions
5. **Response Generated** → AI follows user's style and content preferences

### Key Functions

```typescript
// Check if email should be processed (CRITICAL - called by all AI systems)
const decision = await aiPreferencesService.shouldProcessEmail(userId, emailContext);

// Get AI instructions for processing
const instructions = await aiPreferencesService.getAIInstructions(userId, emailContext);

// Save preferences from chat conversation
await aiPreferencesService.savePreferencesFromChat(userId, preferences, message);
```

### Performance Optimizations

- **5-minute caching** of user preferences
- **Indexed JSONB queries** for rule matching
- **Lazy loading** of preferences service
- **Background processing** for complex rule evaluation

## 📊 Preference Types

### Email Filters
```json
{
  "id": "filter1",
  "name": "Skip promotional emails",
  "condition": "subject_contains_any(['promotional', 'sale', 'discount'])",
  "action": "skip_ai_processing",
  "description": "Don't process promotional emails with AI",
  "active": true
}
```

### Response Rules
```json
{
  "id": "rule1",
  "name": "High priority urgent emails",
  "trigger": "subject_contains(['urgent', 'ASAP'])",
  "behavior": "high_priority_processing",
  "custom_instructions": "Process immediately and include urgency in response",
  "escalate_to_human": true,
  "active": true
}
```

### Exclusion Rules
```json
{
  "id": "excl1",
  "name": "No AI for competitor emails",
  "condition": "sender_domain_in(['competitor1.com', 'competitor2.com'])",
  "action": "flag_for_manual_review",
  "reason": "Competitive intelligence - requires human handling",
  "active": true
}
```

### Content Rules
```json
{
  "id": "content1",
  "name": "Include pricing for product inquiries",
  "trigger": "email_type = 'product_inquiry'",
  "action": "include_pricing_info",
  "template_additions": "Always include current pricing and availability",
  "active": true
}
```

## 🛡️ Security & Privacy

### Data Protection
- **Row Level Security (RLS)** - Users can only access their own preferences
- **Encrypted Storage** - Sensitive preference data is protected
- **Audit Logging** - All changes are tracked with timestamps
- **Organization Isolation** - Multi-tenant data separation

### Permission Model
- **User Level**: Users can only modify their own preferences
- **Organization Admin**: Can view (not modify) org member preferences
- **System Admin**: Full access for support and maintenance

## 🔍 Monitoring & Analytics

### Available Metrics
- **Total Rules**: Number of active preference rules per user
- **Application Rate**: How often preferences affect email processing
- **User Adoption**: Percentage of users with custom preferences
- **Performance Impact**: Processing time impact of preference evaluation

### API Endpoints
- `GET /api/email/ai-preferences/stats` - User preference statistics
- `POST /api/email/ai-preferences-chat` - Conversational preference setup
- `POST /api/email/ai-preferences/apply` - Manual preference application

## 🐛 Troubleshooting

### Common Issues

1. **Preferences Not Applied**
   - Check if user has active preferences: `aiPreferencesService.getUserPreferences(userId)`
   - Verify preference rules are correctly formatted
   - Check AI processing logs for preference application

2. **Chat Not Working**
   - Ensure OpenAI API key is configured
   - Check network connectivity to API endpoints
   - Verify user authentication session

3. **Database Errors**
   - Ensure migration was run successfully
   - Check RLS policies are correctly applied
   - Verify user has proper permissions

### Debug Mode

Enable debug logging by setting:
```bash
DEBUG=ai-preferences:*
```

## 🔮 Future Enhancements

### Planned Features
- **Machine Learning**: Learn from user modifications to improve suggestions
- **Template Library**: Pre-built preference templates for common use cases
- **Bulk Import/Export**: Import preferences from CSV or other systems
- **Advanced Analytics**: Deep insights into preference effectiveness
- **A/B Testing**: Test different preference configurations

### Extension Points
- **Custom Rule Types**: Support for custom business logic
- **Integration Hooks**: Webhooks for preference change notifications
- **External Data Sources**: Integration with CRM systems for contact-based rules
- **Multi-language Support**: Localized preference interface

## 📚 Additional Resources

- [AI Hub Service Documentation](./ai-hub-service.md)
- [Email Processing Pipeline](./email-processing.md)
- [Agent System Integration](./agent-system.md)
- [Database Schema Reference](./database-schema.md)

---

## 🎉 Success! 

Your AI Email Preferences System is now fully implemented and ready to use. Users can configure their email preferences through natural conversation, and ALL AI systems will automatically respect these preferences.

**Key Benefits:**
- ✅ Natural language preference setup
- ✅ Automatic application across all AI systems  
- ✅ Real-time preference enforcement
- ✅ User-specific customization
- ✅ Enterprise-grade security and performance 