import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FaEnvelope, FaSpinner, FaArrowLeft } from 'react-icons/fa';
import { Mail, Clock, User, Building, DollarSign, Zap, AlertCircle } from 'lucide-react';

interface TestEmailsClientProps {
  onAnalyzeEmail?: (emailId: string) => void;
  onSalesAgent?: (emailId: string) => void;
  isAnalyzing?: boolean;
  isSalesProcessing?: boolean;
}

interface TestEmail {
  id: string;
  from: string;
  fromName: string;
  company: string;
  subject: string;
  body: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  category: 'sales' | 'support' | 'partnership' | 'complaint' | 'inquiry';
  estimatedValue: string;
  urgency: 'urgent' | 'normal' | 'low';
}

const testEmails: TestEmail[] = [
  {
    id: 'test-1',
    from: 'sarah.johnson@techcorp.com',
    fromName: 'Sarah Johnson',
    company: 'TechCorp Solutions',
    subject: 'Urgent: Enterprise Software Solution Needed - $500K Budget',
    body: `Dear Fresh AI CRM Team,

I hope this email finds you well. I'm Sarah Johnson, Chief Technology Officer at TechCorp Solutions, a rapidly growing software company with over 500 employees across North America.

We're currently experiencing significant challenges with our customer relationship management processes, and after extensive research, your Fresh AI CRM solution appears to be exactly what we need.

**Our Current Situation:**
- Managing 10,000+ active customers manually
- Sales team of 50+ representatives struggling with lead tracking
- Customer support response times averaging 48 hours
- Revenue loss estimated at $2M annually due to poor customer management

**What We're Looking For:**
- Complete CRM overhaul for our entire organization
- AI-powered analytics and insights
- Integration with our existing Salesforce data
- 24/7 customer support
- Training for our entire team

**Budget & Timeline:**
We have allocated $500,000 for this project and need implementation within 90 days. Our board meeting is scheduled for next Friday, and I'd love to present your solution.

**Decision Making:**
I have full authority to make this purchase decision, and our CFO has already approved the budget. We're also considering two other vendors, but your AI capabilities seem superior.

**Pain Points:**
- Lost a major client last month due to poor follow-up
- Sales team missing quotas by 30%
- Customer churn rate at 15% (industry average is 8%)
- Manual data entry consuming 4 hours daily per sales rep

Could we schedule a demo call this week? I'm available Tuesday-Thursday between 2-4 PM EST. Also, please send me your enterprise pricing and implementation timeline.

Looking forward to your prompt response.

Best regards,
Sarah Johnson
Chief Technology Officer
TechCorp Solutions
Phone: (555) 123-4567
Email: sarah.johnson@techcorp.com
LinkedIn: linkedin.com/in/sarah-johnson-cto

P.S. - If we can close this deal by month-end, we'd be interested in a multi-year contract with additional modules.`,
    date: '2024-01-15T10:30:00Z',
    priority: 'high',
    category: 'sales',
    estimatedValue: '$500,000',
    urgency: 'urgent'
  },
  {
    id: 'test-2',
    from: 'mike.rodriguez@startupventures.com',
    fromName: 'Mike Rodriguez',
    company: 'Startup Ventures Inc',
    subject: 'Partnership Opportunity - SaaS Integration',
    body: `Hi there,

My name is Mike Rodriguez, and I'm the Head of Business Development at Startup Ventures Inc. We're a venture capital firm that has invested in over 200 SaaS companies.

I came across Fresh AI CRM through one of our portfolio companies, and I'm impressed with your product's capabilities. I'd like to explore a potential partnership opportunity.

**About Us:**
- $500M assets under management
- 200+ portfolio companies in our network
- Focus on B2B SaaS solutions
- Strong connections with enterprise clients

**Partnership Proposal:**
We're looking to create a preferred vendor program for our portfolio companies. This would involve:
- Volume discounts for our portfolio companies
- Co-marketing opportunities
- Joint webinars and content creation
- Referral commission structure

**Potential Value:**
- 50+ companies could potentially adopt your solution
- Combined ARR potential of $2-3M annually
- Access to our network of 500+ SaaS executives
- Speaking opportunities at our quarterly events

**Next Steps:**
I'd love to set up a call to discuss this further. Our quarterly portfolio meeting is coming up in 3 weeks, and I'd like to present this opportunity to our companies.

Some questions I have:
1. Do you have a partner program currently?
2. What kind of volume discounts can you offer?
3. Are you interested in co-marketing opportunities?
4. What's your typical sales cycle for mid-market companies?

I'm flexible on timing for a call. Let me know what works best for you.

Best,
Mike Rodriguez
Head of Business Development
Startup Ventures Inc
Direct: (555) 987-6543
Email: mike.rodriguez@startupventures.com`,
    date: '2024-01-14T14:20:00Z',
    priority: 'medium',
    category: 'partnership',
    estimatedValue: '$2-3M ARR',
    urgency: 'normal'
  },
  {
    id: 'test-3',
    from: 'angry.customer@retailchain.com',
    fromName: 'David Thompson',
    company: 'RetailChain Stores',
    subject: 'URGENT: System Down - Losing Money Every Minute!',
    body: `URGENT - SYSTEM FAILURE

This is David Thompson, IT Director at RetailChain Stores. Your system has been DOWN for the past 3 HOURS and we're losing money every minute!

**THE PROBLEM:**
- Our entire CRM system is inaccessible
- Sales team can't access customer data
- 50+ stores affected across 10 states
- Estimated loss: $50,000 per hour

**WHAT HAPPENED:**
- System went down at 11:30 AM EST
- No notification from your team
- Support ticket #RT-2024-0115 opened 2 hours ago - NO RESPONSE
- Called support line - 45 minute wait time

**IMPACT:**
- Black Friday weekend approaching
- 200+ sales reps can't work
- Customer complaints flooding in
- Management demanding answers

**IMMEDIATE NEEDS:**
1. System restoration within 1 hour
2. Explanation of what went wrong
3. Guarantee this won't happen again
4. Compensation for lost revenue

**ESCALATION:**
If this isn't resolved immediately, we'll be forced to:
- Activate our backup system
- Consider legal action for breach of SLA
- Evaluate alternative CRM providers
- Terminate our $200K annual contract

I need someone from your executive team to call me RIGHT NOW at (555) 444-7890.

This is completely unacceptable for a mission-critical system.

David Thompson
IT Director
RetailChain Stores
URGENT CONTACT: (555) 444-7890
Email: david.thompson@retailchain.com

P.S. - Your competitor called us yesterday offering a better deal. Right now, they're looking pretty good.`,
    date: '2024-01-15T14:45:00Z',
    priority: 'high',
    category: 'complaint',
    estimatedValue: '$200K at risk',
    urgency: 'urgent'
  },
  {
    id: 'test-4',
    from: 'lisa.chen@globalmanufacturing.com',
    fromName: 'Lisa Chen',
    company: 'Global Manufacturing Ltd',
    subject: 'Exploring CRM Options for Manufacturing Business',
    body: `Hello Fresh AI CRM Team,

I hope you're doing well. My name is Lisa Chen, and I'm the Operations Manager at Global Manufacturing Ltd. We're a mid-sized manufacturing company specializing in automotive parts.

**Company Background:**
- 25 years in business
- 150 employees
- $50M annual revenue
- Customers in US, Canada, and Mexico
- Currently using Excel spreadsheets for customer management

**Our Challenge:**
We've grown significantly over the past 5 years, and our current customer management system (basically Excel files) is no longer adequate. We're looking for a proper CRM solution.

**Specific Needs:**
- Customer contact management
- Order tracking and history
- Integration with our ERP system (SAP)
- Reporting and analytics
- Mobile access for sales team

**Current Pain Points:**
- Duplicate customer records
- Lost sales opportunities
- Inefficient follow-up processes
- No visibility into sales pipeline
- Manual reporting taking hours

**Budget Considerations:**
We're a cost-conscious organization. Our budget is around $20,000-30,000 annually. We need to see clear ROI within 12 months.

**Decision Process:**
- I'm gathering information from 3-4 vendors
- Will present recommendations to our executive team
- Decision expected within 60 days
- Implementation would start Q2 2024

**Questions:**
1. Do you have experience with manufacturing companies?
2. What's your pricing for 20-30 users?
3. Can you integrate with SAP?
4. What kind of training and support do you provide?
5. Do you offer a free trial?

I'd appreciate any information you can provide. A brief phone call would be helpful to understand if there's a good fit.

Thank you for your time.

Best regards,
Lisa Chen
Operations Manager
Global Manufacturing Ltd
Phone: (555) 333-2222
Email: lisa.chen@globalmanufacturing.com`,
    date: '2024-01-13T09:15:00Z',
    priority: 'medium',
    category: 'inquiry',
    estimatedValue: '$20-30K',
    urgency: 'normal'
  },
  {
    id: 'test-5',
    from: 'support@smallbusiness.com',
    fromName: 'Jennifer Wilson',
    company: 'Small Business Solutions',
    subject: 'Need Help with User Permissions and Training',
    body: `Hi Support Team,

I'm Jennifer Wilson from Small Business Solutions. We've been using Fresh AI CRM for about 6 months now, and overall we're happy with the system.

**Current Situation:**
- 10 users on the Professional plan
- Using it primarily for lead management
- Some team members still struggling with advanced features

**Support Needed:**
1. **User Permissions Issue:**
   - New employee can't access certain customer records
   - Admin panel seems confusing
   - Need help setting up role-based access

2. **Training Request:**
   - 3 new team members joined last month
   - They need basic CRM training
   - Prefer online training sessions

3. **Feature Questions:**
   - How to set up automated email sequences?
   - Best practices for lead scoring
   - Integration with our email marketing tool (Mailchimp)

**Timeline:**
- User permissions: Need fix this week
- Training: Flexible, within next 2 weeks
- Feature setup: Not urgent, but would like guidance

**Additional Context:**
We're growing quickly (30% this quarter) and may need to upgrade our plan soon. Currently evaluating whether to add more users or switch to Enterprise plan.

**Budget:**
- Willing to pay for premium support if needed
- Considering additional training packages
- Open to upgrading plan if it includes better support

Would it be possible to schedule a call this week to address the user permissions issue? The rest can wait, but this is blocking our new employee from being productive.

Thanks for your help!

Jennifer Wilson
Operations Coordinator
Small Business Solutions
Phone: (555) 222-1111
Email: jennifer.wilson@smallbusiness.com

P.S. - We'd be happy to provide a testimonial if you help us get this sorted out quickly.`,
    date: '2024-01-12T16:30:00Z',
    priority: 'medium',
    category: 'support',
    estimatedValue: 'Upsell potential',
    urgency: 'normal'
  }
];

export default function TestEmailsClient({ 
  onAnalyzeEmail, 
  onSalesAgent, 
  isAnalyzing, 
  isSalesProcessing 
}: TestEmailsClientProps) {
  const [selectedEmail, setSelectedEmail] = useState<TestEmail | null>(null);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'sales': return 'bg-blue-100 text-blue-800';
      case 'support': return 'bg-purple-100 text-purple-800';
      case 'partnership': return 'bg-green-100 text-green-800';
      case 'complaint': return 'bg-red-100 text-red-800';
      case 'inquiry': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sales': return <DollarSign className="h-4 w-4" />;
      case 'support': return <User className="h-4 w-4" />;
      case 'partnership': return <Building className="h-4 w-4" />;
      case 'complaint': return <AlertCircle className="h-4 w-4" />;
      case 'inquiry': return <Mail className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  if (selectedEmail) {
    return (
      <Card className="border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-start justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedEmail(null)}
              className="mb-4"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Back to Test Emails
            </Button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{selectedEmail.subject}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span><strong>{selectedEmail.fromName}</strong> ({selectedEmail.from})</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Building className="h-4 w-4" />
                    <span>{selectedEmail.company}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(selectedEmail.date).toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(selectedEmail.priority)}>
                    {selectedEmail.priority.toUpperCase()}
                  </Badge>
                  <Badge className={getCategoryColor(selectedEmail.category)}>
                    {getCategoryIcon(selectedEmail.category)}
                    <span className="ml-1">{selectedEmail.category.toUpperCase()}</span>
                  </Badge>
                  <Badge variant="outline">
                    <DollarSign className="h-3 w-3 mr-1" />
                    {selectedEmail.estimatedValue}
                  </Badge>
                  {selectedEmail.urgency === 'urgent' && (
                    <Badge className="bg-red-100 text-red-800">
                      <Zap className="h-3 w-3 mr-1" />
                      URGENT
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnalyzeEmail?.(selectedEmail.id)}
                  disabled={isAnalyzing || isSalesProcessing}
                >
                  {isAnalyzing ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Analyzing...
                    </>
                  ) : (
                    'Analyze'
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onSalesAgent?.(selectedEmail.id)}
                  disabled={isAnalyzing || isSalesProcessing}
                >
                  {isSalesProcessing ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    'Sales Agent'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          <ScrollArea className="h-[400px] w-full">
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                {selectedEmail.body}
              </pre>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaEnvelope className="h-5 w-5 text-blue-600" />
          Test Emails - Enhanced for AI Analysis
        </CardTitle>
        <p className="text-sm text-gray-600">
          These are detailed test emails designed to showcase AI analysis and sales agent capabilities.
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {testEmails.map((email) => (
            <div
              key={email.id}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedEmail(email)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{email.subject}</h4>
                    {email.urgency === 'urgent' && (
                      <Badge className="bg-red-100 text-red-800">
                        <Zap className="h-3 w-3 mr-1" />
                        URGENT
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span><strong>{email.fromName}</strong> ({email.company})</span>
                    <span>{new Date(email.date).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(email.priority)}>
                      {email.priority.toUpperCase()}
                    </Badge>
                    <Badge className={getCategoryColor(email.category)}>
                      {getCategoryIcon(email.category)}
                      <span className="ml-1">{email.category.toUpperCase()}</span>
                    </Badge>
                    <Badge variant="outline">
                      <DollarSign className="h-3 w-3 mr-1" />
                      {email.estimatedValue}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {email.body.substring(0, 120)}...
                  </p>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAnalyzeEmail?.(email.id);
                    }}
                    disabled={isAnalyzing || isSalesProcessing}
                  >
                    {isAnalyzing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Analyzing...
                      </>
                    ) : (
                      'Analyze'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSalesAgent?.(email.id);
                    }}
                    disabled={isAnalyzing || isSalesProcessing}
                  >
                    {isSalesProcessing ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      'Sales Agent'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 