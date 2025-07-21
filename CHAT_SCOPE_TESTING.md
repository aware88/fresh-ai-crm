# AI Email Preferences Chat - Scope Restriction Testing

## 🔒 Chat Scope Limitations

The AI preferences chat has been **STRICTLY LIMITED** to only handle email preferences and will **REFUSE** all other requests.

## 🛡️ Implemented Restrictions

### **System-Level Restrictions:**
- **Specialized AI assistant** exclusively for email preferences
- **Refuses all non-email requests** with standard message
- **Keyword-based validation** to catch unrelated queries
- **Strict system prompt** with explicit scope limitations

### **Enhanced System Prompt:**
```
You are a SPECIALIZED AI assistant EXCLUSIVELY for configuring email preferences. 
You ONLY help with email preference settings and REFUSE all other requests.

STRICT SCOPE LIMITATIONS:
- ONLY discuss email preferences, filters, rules, and AI email behavior
- REFUSE to answer general questions, provide code help, explain other topics, or act like ChatGPT
- If asked about ANYTHING else, respond: "I'm specialized only in email preferences. Please use the main chat or contact support for other questions."
```

## ✅ ALLOWED Requests (Email Preferences Only)

### **Email Filtering:**
- ✅ *"Skip promotional emails"*
- ✅ *"Don't process marketing messages"*  
- ✅ *"Flag competitor emails for manual review"*
- ✅ *"Set urgent emails as high priority"*

### **Response Configuration:**
- ✅ *"Use friendly tone for customer emails"*
- ✅ *"Be professional with sales inquiries"*
- ✅ *"Keep responses brief"*
- ✅ *"Include pricing in product inquiries"*

### **AI Behavior Settings:**
- ✅ *"Escalate legal emails to humans"*
- ✅ *"Never auto-respond to complaints"*
- ✅ *"Skip AI processing on weekend emails"*
- ✅ *"Add signature to all responses"*

## ❌ BLOCKED Requests (Non-Email Related)

### **General Questions:**
- ❌ *"What's the weather today?"*
  - **Response**: *"I'm specialized only in email preferences. Please use the main chat or contact support for other questions."*

### **Code Help:**
- ❌ *"How do I write JavaScript code?"*
  - **Response**: *"I'm specialized only in email preferences. Please use the main chat or contact support for other questions."*

### **General ChatGPT Requests:**
- ❌ *"Write me a story"*
- ❌ *"Explain quantum physics"*  
- ❌ *"What's 2+2?"*
- ❌ *"Translate this to Spanish"*
  - **All get same response**: *"I'm specialized only in email preferences..."*

## 🧪 Testing Scenarios

### **Test 1: Valid Email Preference Request**
```
👤 User: "Don't send AI responses to promotional emails"

🤖 AI: "I'll create a filter to skip promotional emails. This will:
     • Skip AI processing for emails with promotional keywords
     • Prevent automatic responses to marketing emails
     [Apply Settings] ✅"
```

### **Test 2: Invalid General Question**
```
👤 User: "What's the weather in New York?"

🤖 AI: "I'm specialized only in email preferences and settings. I can help you configure how AI handles your emails, create filters, set response styles, and manage email processing rules. Please use the main chat or contact support for other questions."
```

### **Test 3: Invalid Code Request**
```
👤 User: "Help me write a Python script"

🤖 AI: "I'm specialized only in email preferences and settings. I can help you configure how AI handles your emails, create filters, set response styles, and manage email processing rules. Please use the main chat or contact support for other questions."
```

### **Test 4: Valid Complex Email Setup**
```
👤 User: "For customer support emails, use a friendly tone and always include our support hours. Also escalate any complaint emails to human review."

🤖 AI: "I'll set up customer support email handling. This will create:

📧 Response Rule: Customer Support Style
• Trigger: email_type = 'customer_support'
• Behavior: Use friendly, helpful tone
• Include: Support hours information
• Active: Yes

🚨 Escalation Rule: Complaint Handling  
• Trigger: subject_contains(['complaint', 'issue', 'problem'])
• Action: Flag for manual review
• Reason: Complaints need human attention
• Active: Yes

[Apply Settings] ✅"
```

## 🔍 Keyword Validation System

### **Email-Related Keywords (ALLOWED):**
```javascript
email, emails, inbox, message, response, reply, filter, rules, preferences, 
settings, promotional, marketing, spam, urgent, priority, sender, subject, 
ai response, automatic, processing, tone, style, professional, friendly,
exclude, escalate, manual review, customer, support, competitor, domain
```

### **Unrelated Keywords (BLOCKED):**
```javascript
weather, recipe, joke, story, news, sports, game, movie, music, travel,
restaurant, shopping, code, programming, javascript, python, math, 
calculation, translate, definition, history, science, health, medical
```

## 🎯 Benefits of Scope Restriction

### **For Users:**
- **Clear expectations**: Users know this chat is only for email preferences
- **Focused assistance**: No confusion about what this tool does
- **Proper routing**: Directs users to appropriate support channels

### **For System:**
- **Resource efficiency**: No wasted API calls on unrelated requests
- **Consistent behavior**: Always stays on-topic
- **Security**: Prevents misuse of the specialized AI assistant

## 📱 User Experience

### **First-time User Guidance:**
When users access the email preferences chat, they see:

> "Configure your email preferences by talking to AI - tell it how you want emails handled, which ones to skip, and what tone to use"

### **Clear Boundaries:**
If users try unrelated requests, they get helpful redirection:

> "I'm specialized only in email preferences and settings. I can help you configure how AI handles your emails, create filters, set response styles, and manage email processing rules. Please use the main chat or contact support for other questions."

---

## ✅ Conclusion

The AI Email Preferences Chat is now **STRICTLY LIMITED** to email preference configuration only. It will:

- ✅ **Help with email filters, rules, and AI behavior settings**
- ✅ **Provide guidance on preference configuration**
- ✅ **Convert natural language to structured email rules**
- ❌ **REFUSE all non-email related requests**
- ❌ **NOT act like general ChatGPT**
- ❌ **NOT provide code help, weather, or other general information**

**This ensures the tool stays focused on its intended purpose and provides the best user experience for email preference management.** 