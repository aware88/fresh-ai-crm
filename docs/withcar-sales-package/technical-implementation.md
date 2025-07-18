# 🛠 Withcar AI System - Technical Implementation Guide

## 📋 **Pre-Implementation Checklist**

### **System Requirements**
- ✅ Metakocka API access (Company ID: 2889)
- ✅ Email system with forwarding capabilities
- ✅ Database access for product synchronization
- ✅ SSL certificates for secure communication
- ✅ Backup and monitoring systems

### **Required Information**
- **Primary Contact Email**: tim.mak88@gmail.com (testing)
- **Metakocka API Key**: d1233595-4309-4ff2-aaf0-5e2b2a191270
- **Product Database**: Excel catalog + Metakocka sync
- **Business Hours**: Monday-Friday 08:00-17:00, Saturday 08:00-12:00 (CET)
- **Support Languages**: Slovenian (primary), German, English, + 21 EU languages

---

## 🔧 **Step 1: Database Setup**

### **Required SQL Migrations**
Execute these SQL commands in your Supabase database:

```sql
-- 1. Create organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- 2. Create email_interaction_logs table
CREATE TABLE IF NOT EXISTS email_interaction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  email_id TEXT NOT NULL,
  sender_email TEXT NOT NULL,
  sender_name TEXT,
  subject TEXT NOT NULL,
  original_content TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  language_detected TEXT NOT NULL,
  sentiment_score DECIMAL(3,2),
  confidence_score DECIMAL(3,2),
  processing_time_ms INTEGER,
  products_mentioned TEXT[],
  upsell_suggestions JSONB,
  customer_satisfaction INTEGER,
  requires_human_review BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enhance email_queue table
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 5;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS scheduled_send_time TIMESTAMP WITH TIME ZONE;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS ai_processed BOOLEAN DEFAULT false;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS ai_confidence DECIMAL(3,2);
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS language_code TEXT;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS sentiment TEXT;
ALTER TABLE email_queue ADD COLUMN IF NOT EXISTS requires_human_review BOOLEAN DEFAULT false;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_interaction_logs_org_id ON email_interaction_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_interaction_logs_created_at ON email_interaction_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_priority ON email_queue(priority);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled_time ON email_queue(scheduled_send_time);
```

---

## 🚀 **Step 2: Run Setup Script**

Execute the Withcar organization setup script:

```bash
# Navigate to project directory
cd /Users/aware/fresh-ai-crm

# Install dependencies if needed
npm install

# Run Withcar setup script
node scripts/setup-withcar-organization.js
```

**Expected Output:**
```
🚀 Setting up Withcar organization...
📋 Step 1: Finding or creating Withcar organization...
✅ Created new Withcar organization with ID: [UUID]
⚙️ Step 2: Configuring organization settings...
✅ Configured 47 organization settings
🎉 Withcar organization setup complete!
```

---

## 📧 **Step 3: Email System Configuration**

### **Email Forwarding Setup**
Configure your email system to forward customer emails to the AI processor:

**Option 1: Direct Email Forwarding**
```
From: customer@example.com
To: info@withcar.si
Forward to: ai-processor@your-crm-system.com
```

**Option 2: Email Integration API**
```javascript
// Email webhook configuration
{
  "webhook_url": "https://your-crm-system.com/api/email/process",
  "organization_id": "withcar-org-id",
  "authentication": "Bearer your-api-key"
}
```

### **Email Processing Rules**
- **Immediate Processing**: Complaints, urgent inquiries
- **5-minute delay**: General customer service
- **1-minute delay**: Product inquiries
- **10-minute delay**: General information requests

---

## 🔌 **Step 4: Metakocka API Integration**

### **API Configuration**
```javascript
// Metakocka API Settings
{
  "company_id": "2889",
  "api_key": "d1233595-4309-4ff2-aaf0-5e2b2a191270",
  "base_url": "https://api.metakocka.si",
  "sync_interval": "15_minutes",
  "retry_attempts": 3,
  "timeout": 30000
}
```

### **Product Synchronization**
- **Real-time sync**: Stock levels, pricing
- **Daily sync**: Product catalog updates
- **Weekly sync**: Full product database refresh

---

## 🧠 **Step 5: AI Model Configuration**

### **OpenAI API Setup**
```javascript
// AI Configuration
{
  "model": "gpt-4o",
  "max_tokens": 1000,
  "temperature": 0.7,
  "top_p": 1.0,
  "frequency_penalty": 0.0,
  "presence_penalty": 0.0
}
```

### **Language Detection**
- **Primary**: Slovenian
- **Secondary**: German, English
- **Supported**: 24 EU languages
- **Fallback**: English

### **Automotive Intelligence**
- **VIN Decoding**: 17-character validation
- **Brand Recognition**: 50+ automotive brands
- **Model Matching**: 15,000+ vehicle combinations
- **Technical Specs**: Engine, transmission, market variants

---

## 🌍 **Step 6: Multilanguage Configuration**

### **Language Priority**
1. **Slovenian** (sl) - Primary market
2. **German** (de) - EU expansion priority
3. **English** (en) - International
4. **Italian** (it) - Regional expansion
5. **Croatian** (hr) - Regional expansion
6. **Hungarian** (hu) - Regional expansion

### **Cultural Adaptations**
- **Slovenian**: Formal address, local business practices
- **German**: Sehr formal, detailed technical information
- **English**: Professional but friendly
- **Italian**: Warm but professional
- **Croatian**: Similar to Slovenian practices

---

## 🔒 **Step 7: Security & Compliance**

### **GDPR Compliance**
- **Data Encryption**: TLS 1.3 for all communications
- **Data Retention**: 2 years for customer interactions
- **Right to Deletion**: Automated data purging
- **Data Portability**: Export functionality included

### **Security Measures**
- **API Authentication**: JWT tokens with expiration
- **Rate Limiting**: 100 requests per minute
- **Audit Logging**: All AI interactions logged
- **Backup Strategy**: Daily encrypted backups

---

## 📊 **Step 8: Monitoring & Analytics**

### **Key Performance Indicators**
- **Response Time**: Target < 5 seconds
- **Accuracy Rate**: Target > 95%
- **Customer Satisfaction**: Target > 90%
- **Automation Rate**: Target > 80%

### **Monitoring Tools**
- **Real-time Dashboard**: Email processing status
- **Performance Metrics**: Response times, accuracy
- **Error Tracking**: Failed processes, retry counts
- **Customer Feedback**: Satisfaction scores

---

## 🧪 **Step 9: Testing Protocol**

### **Test Scenarios**
1. **Product Inquiry** (Slovenian)
2. **VIN Decoding** (English)
3. **Complaint Handling** (German)
4. **Upselling Scenario** (Italian)
5. **Stock Inquiry** (Croatian)

### **Test Data**
```
Test Email 1:
From: test@withcar.si
Subject: Gumijasti tepihi za Audi A4
Content: "Pozdrav, potrebujem gumijaste tepihe za Audi A4 2019. Hvala!"

Expected Response: Product match + upselling + pricing + delivery info
```

### **Validation Criteria**
- ✅ Language detection accuracy
- ✅ Product matching precision
- ✅ Upselling relevance
- ✅ Response time < 5 seconds
- ✅ Professional tone maintained

---

## 🚦 **Step 10: Go-Live Checklist**

### **Pre-Launch Verification**
- [ ] Database migrations completed
- [ ] Organization settings configured
- [ ] Metakocka API integration tested
- [ ] Email forwarding configured
- [ ] AI model trained and tested
- [ ] Multilanguage responses verified
- [ ] Security protocols implemented
- [ ] Monitoring systems active
- [ ] Staff training completed
- [ ] Backup systems tested

### **Launch Procedure**
1. **Soft Launch**: 10% of emails for 24 hours
2. **Monitoring**: Real-time performance tracking
3. **Adjustment**: Fine-tune based on initial results
4. **Full Launch**: 100% automation after validation
5. **Optimization**: Continuous improvement based on feedback

---

## 📞 **Support & Maintenance**

### **24/7 Support During Launch**
- **Technical Support**: Real-time monitoring
- **Performance Tuning**: Optimization based on usage
- **Bug Fixes**: Immediate resolution of issues
- **Feature Enhancements**: Based on user feedback

### **Ongoing Maintenance**
- **Weekly Reports**: Performance and accuracy metrics
- **Monthly Reviews**: System optimization recommendations
- **Quarterly Updates**: New features and improvements
- **Annual Review**: Strategy and expansion planning

---

## 📋 **Troubleshooting Guide**

### **Common Issues & Solutions**

**Issue**: Low confidence scores
**Solution**: Increase training data, adjust temperature settings

**Issue**: Language detection errors
**Solution**: Improve language detection rules, add more training examples

**Issue**: Product matching failures
**Solution**: Update product database, refine matching algorithms

**Issue**: Email processing delays
**Solution**: Optimize API calls, increase server capacity

### **Emergency Contacts**
- **Technical Support**: 24/7 hotline
- **Project Manager**: Tim Mak (tim.mak88@gmail.com)
- **System Administrator**: [Your contact]
- **Escalation**: [Management contact]

---

## 🔄 **Continuous Improvement**

### **Monthly Optimization**
- **Performance Analysis**: Response times, accuracy rates
- **Customer Feedback**: Satisfaction surveys, reviews
- **Product Updates**: New automotive models, product categories
- **AI Training**: Continuous learning from interactions

### **Quarterly Enhancements**
- **Feature Additions**: New AI capabilities
- **Language Expansion**: Additional EU languages
- **Integration Updates**: New ERP systems, APIs
- **Market Expansion**: New country-specific features

**This technical implementation guide ensures a smooth, successful deployment of the Withcar AI system with comprehensive testing, monitoring, and optimization procedures.** 