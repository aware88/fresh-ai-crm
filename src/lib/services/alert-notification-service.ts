import { createServerClient } from '@/lib/supabase/server';
import { InventoryAlertWithProduct } from '@/types/inventory';

interface AlertNotification {
  alert: InventoryAlertWithProduct;
  currentQuantity: number;
  timestamp: string;
}

export class AlertNotificationService {
  /**
   * Send email notification for a triggered alert
   */
  static async sendAlertNotification(userId: string, alert: AlertNotification) {
    try {
      const supabase = await createServerClient();
      
      // Get user's email preferences
      const { data: userPrefs } = await supabase
        .from('user_preferences')
        .select('email_notifications')
        .eq('user_id', userId)
        .single();
      
      // Check if email notifications are enabled
      if (!userPrefs?.email_notifications) {
        console.log(`Email notifications disabled for user ${userId}`);
        return false;
      }
      
      // Get user's email
      const { data: user } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', userId)
        .single();
      
      if (!user?.email) {
        throw new Error('User email not found');
      }
      
      // Prepare email content
      const emailContent = this.prepareAlertEmail(alert);
      
      // Send email using your email service (e.g., SendGrid, Resend, etc.)
      const emailSent = await this.sendEmail({
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.body,
      });
      
      if (emailSent) {
        await this.logNotification(userId, alert.alert.id, 'email');
      }
      
      return emailSent;
    } catch (error) {
      console.error('Error sending alert notification:', error);
      return false;
    }
  }
  
  /**
   * Send SMS notification for a triggered alert
   */
  static async sendSmsNotification(userId: string, alert: AlertNotification) {
    // Similar implementation to sendAlertNotification but for SMS
    // This is a placeholder for SMS notification logic
    console.log(`SMS notification would be sent for alert ${alert.alert.id}`);
    return true;
  }
  
  /**
   * Prepare email content for an alert
   */
  private static prepareAlertEmail(alert: AlertNotification) {
    const { alert: alertData, currentQuantity } = alert;
    const productName = alertData.product_name || 'Unknown Product';
    const productSku = alertData.product_sku || 'N/A';
    
    const subject = `🚨 Inventory Alert: ${productName} is low on stock`;
    
    const body = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Inventory Alert</h2>
        <p>The following product is running low on stock:</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <h3 style="margin-top: 0;">${productName}</h3>
          <p><strong>SKU:</strong> ${productSku}</p>
          <p><strong>Current Quantity:</strong> ${currentQuantity}</p>
          <p><strong>Threshold:</strong> ${alertData.threshold_quantity}</p>
        </div>
        
        <p>Please take the necessary action to restock this item.</p>
        
        <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b;">
          <p>This is an automated message. Please do not reply to this email.</p>
          <p>You can manage your notification preferences in your account settings.</p>
        </div>
      </div>
    `;
    
    return { subject, body };
  }
  
  /**
   * Send email using your email service
   */
  private static async sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    // Replace this with your actual email sending logic
    // Example using Resend (https://resend.com/overview)
    try {
      const resendApiKey = process.env.RESEND_API_KEY;
      if (!resendApiKey) {
        console.warn('RESEND_API_KEY not configured. Email not sent.');
        return false;
      }
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: 'inventory@yourdomain.com',
          to: [to],
          subject,
          html,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to send email: ${JSON.stringify(error)}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
  
  /**
   * Log notification in the database
   */
  private static async logNotification(userId: string, alertId: string, type: 'email' | 'sms') {
    const supabase = await createServerClient();
    
    await supabase.from('notification_logs').insert([{
      user_id: userId,
      alert_id: alertId,
      type,
      sent_at: new Date().toISOString(),
    }]);
  }
}
