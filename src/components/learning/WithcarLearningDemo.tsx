'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Brain, FileText, CheckCircle, Play } from 'lucide-react';

export default function WithcarLearningDemo() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedSamples, setProcessedSamples] = useState<string[]>([]);
  const { toast } = useToast();

  // Sample Withcar emails for demonstration
  const sampleEmails = [
    {
      id: 'sample-1',
      subject: 'Re: Issue with Car Floor Mats Order',
      type: 'customer_response',
      content: `Dear Marco,

Thank you for contacting us regarding your recent order of car floor mats.

I understand your concern about the delayed delivery, and I sincerely apologize for any inconvenience this may have caused. We truly value you as our customer and want to ensure your complete satisfaction.

After checking your order #WC-2024-1156, I can confirm that your premium all-weather floor mats were dispatched yesterday from our warehouse. You should receive them within 2-3 business days. I've also included a tracking number so you can monitor the shipment progress.

As a gesture of goodwill for the delay, I'm applying a 15% discount to your next order. This discount will be automatically applied to your account.

If you have any other questions or concerns, please don't hesitate to reach out. We're here to help and ensure you have the best possible experience with Withcar.

Best regards,
Sarah Mitchell
Customer Success Team
Withcar Italy`
    },
    {
      id: 'sample-2',
      subject: 'Re: Product Inquiry - Roof Rack System',
      type: 'sales',
      content: `Hello Alessandro,

Thank you for your interest in our roof rack systems for your BMW X3.

I'm excited to help you find the perfect solution! Based on your requirements, I recommend our Premium Universal Roof Rack System (Model WC-RR-2024), which is specifically designed for your vehicle model and offers excellent durability and style.

Here are the key features that make this system perfect for you:
• Easy installation with no drilling required
• Maximum load capacity of 80kg
• Aerodynamic design to reduce wind noise
• Compatible with various accessories (bike carriers, cargo boxes, etc.)

The complete system is available for €285, and we're currently offering free shipping on orders over €200. Plus, if you order this week, you'll receive a complimentary cargo net (€35 value).

I'd be happy to schedule a quick call to discuss your specific needs and answer any questions you might have. Would tomorrow afternoon work for you?

Looking forward to helping you enhance your BMW!

Best regards,
Roberto Fernandez
Sales Specialist
Withcar Italy`
    },
    {
      id: 'sample-3',
      subject: 'Re: Wrong Product Delivered - Seat Covers',
      type: 'dispute',
      content: `Dear Mrs. Rossi,

I sincerely apologize for the error in your recent order. Receiving the wrong seat covers for your Fiat 500 is completely unacceptable, and I understand your frustration.

I have immediately investigated this issue with our fulfillment team to ensure it doesn't happen again. Here's what I'm doing to resolve this right away:

1. A prepaid return label has been sent to your email for the incorrect seat covers
2. The correct beige leather seat covers (WC-SC-F500-BG) are being expedited to you today via express shipping
3. You'll receive them by tomorrow afternoon at no additional cost
4. As an apology for this inconvenience, I'm refunding the full shipping cost (€15) to your original payment method

I've also added a priority note to your customer profile to ensure all future orders receive extra attention and verification.

Your satisfaction is our top priority, and I'm committed to making this right. I'll personally monitor your replacement shipment and will update you with tracking information shortly.

Again, I deeply apologize for this error. If you need anything else or have any concerns, please contact me directly.

Warmest regards,
Giulia Romano
Customer Care Manager
Withcar Italy`
    }
  ];

  const processSampleEmails = async () => {
    try {
      setIsProcessing(true);
      setProcessedSamples([]);

      // Generate unique IDs to prevent duplicates
      const timestamp = Date.now();
      const response = await fetch('/api/learning/withcar-emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mode: 'batch',
          emails: sampleEmails.map((email, index) => ({
            id: `${email.id}-${timestamp}-${index}`, // Unique ID with timestamp
            content: email.content,
            subject: email.subject,
            type: email.type
          }))
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Processing failed');
      }

      toast({
        title: "Demo Processing Complete!",
        description: `Successfully processed ${data.processed} sample emails. The AI has learned Withcar's communication patterns.`,
      });

      setProcessedSamples(sampleEmails.map(e => e.id));

    } catch (error) {
      console.error('Error processing demo emails:', error);
      toast({
        title: "Demo Processing Failed",
        description: error instanceof Error ? error.message : "Failed to process sample emails",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-blue-600" />
            Withcar Learning Demo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <FileText className="h-4 w-4" />
            <AlertDescription>
              This demo will process 3 sample Withcar emails to teach the AI your communication style. 
              The patterns learned will then be used in future email drafts.
            </AlertDescription>
          </Alert>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="font-medium">Sample Emails Ready</p>
              <p className="text-sm text-gray-600">3 representative Withcar emails covering different scenarios</p>
            </div>
            <Button
              onClick={processSampleEmails}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <>
                  <Brain className="h-4 w-4 mr-2 animate-pulse" />
                  Processing...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Run Demo
                </>
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {sampleEmails.map((email) => (
              <div key={email.id} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{email.subject}</h4>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {email.type.replace('_', ' ')}
                    </Badge>
                    {processedSamples.includes(email.id) && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {email.content.substring(0, 150)}...
                </div>
                <div className="text-xs text-gray-500">
                  Length: {email.content.length} characters
                </div>
              </div>
            ))}
          </div>

          {processedSamples.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Demo Completed Successfully!</p>
                  <p className="text-sm text-green-700">
                    The AI has learned patterns from these emails and will now use them in future drafts.
                    Try generating an AI response to see the learned patterns in action!
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 