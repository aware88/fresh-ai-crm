import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EmailRenderer from './EmailRenderer';

const sampleEmailHTML = `
<div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; font-family: Arial, sans-serif;">
  <div style="background: white; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: #2563eb; color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center;">
      <h1 style="margin: 0; font-size: 24px; font-weight: bold;">🎉 Instantly AI Reply Agent</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Never reply to emails again, let the Reply Agent do it for you.</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">Hey Tim,</p>
      
      <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">
        In its first week, Instantly's new AI Reply Agent generated over <strong style="color: #2563eb;">313,000 replies</strong> for our users.
      </p>
      
      <p style="color: #333; line-height: 1.6; margin-bottom: 25px;">
        That's <strong>7,800+ hours saved</strong>, or 325 workdays of manual follow-up, completely automated.
      </p>
      
      <!-- Stats Chart -->
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0; text-align: center;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0; font-size: 18px;">AI Reply Agent Usage</h3>
        <div style="background: #2563eb; height: 8px; border-radius: 4px; margin: 10px 0; position: relative;">
          <div style="background: #60a5fa; height: 8px; width: 75%; border-radius: 4px;"></div>
        </div>
        <p style="color: #64748b; margin: 10px 0 0 0; font-size: 14px;">313,321 Total Replies Generated</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="#" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);">
          Try Reply Agent Now →
        </a>
      </div>
      
      <!-- Features -->
      <div style="border-top: 1px solid #e2e8f0; padding-top: 25px; margin-top: 25px;">
        <h3 style="color: #1e293b; margin: 0 0 15px 0;">Key Features:</h3>
        <ul style="color: #64748b; line-height: 1.8; margin: 0; padding-left: 20px;">
          <li>✅ Automatic email responses</li>
          <li>✅ Context-aware AI replies</li>
          <li>✅ Customizable response templates</li>
          <li>✅ Multi-language support</li>
        </ul>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #f8fafc; padding: 20px; border-radius: 0 0 10px 10px; text-align: center; border-top: 1px solid #e2e8f0;">
      <p style="color: #64748b; margin: 0; font-size: 14px;">
        Best regards,<br>
        <strong>The Instantly Team</strong>
      </p>
    </div>
  </div>
</div>
`;

const samplePlainText = `
Hey Tim,

In its first week, Instantly's new AI Reply Agent generated over 313,000 replies for our users.

That's 7,800+ hours saved, or 325 workdays of manual follow-up, completely automated.

AI Reply Agent Usage
313,321 Total Replies Generated

Key Features:
- Automatic email responses
- Context-aware AI replies  
- Customizable response templates
- Multi-language support

Best regards,
The Instantly Team
`;

export function EmailRenderingDemo() {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">📧 Enhanced Email Rendering</h2>
        <p className="text-gray-600">Compare Gmail-like rendering vs plain text display</p>
      </div>
      
      <div className="grid md:grid-cols-2 gap-6">
        {/* Enhanced Rendering */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">✨ Enhanced Rendering (New)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <EmailRenderer content={sampleEmailHTML} />
            </div>
          </CardContent>
        </Card>
        
        {/* Plain Text */}
        <Card>
          <CardHeader>
            <CardTitle className="text-gray-600">📝 Plain Text (Old)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
              <div className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {samplePlainText}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">🎯 Key Improvements</h3>
        <ul className="text-blue-700 space-y-1 text-sm">
          <li>• <strong>Preserved Styling:</strong> Colors, gradients, and visual design maintained</li>
          <li>• <strong>Responsive Layout:</strong> Adapts to different screen sizes</li>
          <li>• <strong>Rich Typography:</strong> Proper fonts, spacing, and hierarchy</li>
          <li>• <strong>Interactive Elements:</strong> Buttons and links work as expected</li>
          <li>• <strong>Security:</strong> Dangerous scripts removed while preserving appearance</li>
        </ul>
      </div>
    </div>
  );
}

export default EmailRenderingDemo; 