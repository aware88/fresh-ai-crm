/**
 * AI Learning Notification Service
 * Provides emotional, engaging notifications for AI learning events
 */

import { NotificationService } from './notification-service';

export interface AILearningStats {
  patternsLearned: number;
  confidenceScore: number;
  emailsProcessed: number;
  responseTemplates: number;
  languagesDetected: string[];
  processingTimeMs: number;
}

export class AINotificationService {
  private notificationService: NotificationService;

  constructor() {
    this.notificationService = new NotificationService();
  }

  /**
   * Send initial learning complete notification with emotional hook
   */
  async sendInitialLearningComplete(
    userId: string,
    organizationId: string,
    stats: AILearningStats
  ) {
    const title = "🎉 Your AI assistant just learned your voice!";
    
    // Generate personalized message based on stats
    let message = '';
    
    if (stats.patternsLearned > 50) {
      message = `Wow! I've analyzed ${stats.emailsProcessed.toLocaleString()} emails and discovered ${stats.patternsLearned} unique patterns in your communication style. `;
      message += `I'm now ready to draft emails that sound exactly like you - with ${Math.round(stats.confidenceScore * 100)}% confidence! `;
      message += `Let's make email magical! ✨`;
    } else if (stats.patternsLearned > 20) {
      message = `I've successfully learned your email style from ${stats.emailsProcessed.toLocaleString()} messages! `;
      message += `With ${stats.patternsLearned} patterns identified, I can now draft responses in your voice. `;
      message += `Ready to save hours on email? 🚀`;
    } else if (stats.patternsLearned > 5) {
      message = `AI learning complete! I've analyzed ${stats.emailsProcessed.toLocaleString()} emails and found ${stats.patternsLearned} key patterns. `;
      message += `I'm ready to help you respond faster while maintaining your unique style. Let's go! 💪`;
    } else {
      message = `Initial learning complete! I've processed ${stats.emailsProcessed.toLocaleString()} emails to understand your style. `;
      message += `As we work together, I'll keep learning and improving. Ready to start? 🌟`;
    }

    // Add language detection note if multilingual
    if (stats.languagesDetected.length > 1) {
      message += ` (I noticed you communicate in ${stats.languagesDetected.join(' and ')} - I've got you covered in both!)`;
    }

    await this.notificationService.createNotification({
      user_id: userId,
      organization_id: organizationId,
      title,
      message,
      type: 'success',
      action_url: '/dashboard/email',
      metadata: {
        category: 'ai',
        event: 'initial_learning_complete',
        stats
      }
    });
  }

  /**
   * Send weekly learning update notification
   */
  async sendWeeklyLearningUpdate(
    userId: string,
    organizationId: string,
    stats: {
      newPatterns: number;
      improvedPatterns: number;
      totalEmails: number;
      accuracyImprovement: number;
      weekNumber: number;
    }
  ) {
    const title = "🧠 AI Brain Upgrade Complete!";
    
    let message = '';
    
    if (stats.newPatterns > 0 && stats.improvedPatterns > 0) {
      message = `This week I learned ${stats.newPatterns} new response patterns and improved ${stats.improvedPatterns} existing ones from your ${stats.totalEmails} emails. `;
      
      if (stats.accuracyImprovement > 0) {
        message += `Draft accuracy improved by ${stats.accuracyImprovement}%! 📈 `;
      }
      
      message += `Your AI is getting smarter every week!`;
    } else if (stats.newPatterns > 0) {
      message = `Discovered ${stats.newPatterns} new patterns this week! Your AI keeps evolving with your communication style. `;
      message += `Week ${stats.weekNumber} of continuous learning complete. 🎯`;
    } else if (stats.improvedPatterns > 0) {
      message = `Refined ${stats.improvedPatterns} response patterns for even better accuracy. `;
      message += `Your AI assistant is fine-tuning to perfection! ⚡`;
    } else {
      // No significant changes - skip notification
      return;
    }

    await this.notificationService.createNotification({
      user_id: userId,
      organization_id: organizationId,
      title,
      message,
      type: 'success',
      action_url: '/dashboard/email',
      metadata: {
        category: 'ai',
        event: 'weekly_learning_update',
        stats
      }
    });
  }

  /**
   * Send milestone achievement notification
   */
  async sendMilestoneAchieved(
    userId: string,
    organizationId: string,
    milestone: {
      type: 'emails_processed' | 'patterns_learned' | 'time_saved' | 'accuracy_reached';
      value: number;
      unit?: string;
    }
  ) {
    let title = '';
    let message = '';

    switch (milestone.type) {
      case 'emails_processed':
        if (milestone.value >= 10000) {
          title = "🏆 10,000 Emails Mastered!";
          message = "Your AI has now processed over 10,000 emails! That's enterprise-level learning. You're basically email royalty now! 👑";
        } else if (milestone.value >= 5000) {
          title = "🎊 5,000 Email Milestone!";
          message = "Half way to email mastery! Your AI has learned from 5,000 emails and counting. The patterns are getting crystal clear!";
        } else if (milestone.value >= 1000) {
          title = "🎯 1,000 Emails Analyzed!";
          message = "Your AI assistant has now studied 1,000 of your emails. The learning curve is accelerating! 📊";
        } else if (milestone.value >= 100) {
          title = "✨ First 100 Emails Complete!";
          message = "Milestone reached! Your AI has learned from 100 emails. Watch as it gets better with every message!";
        }
        break;

      case 'patterns_learned':
        if (milestone.value >= 100) {
          title = "🧠 100 Patterns Mastered!";
          message = `Your AI now knows ${milestone.value} unique response patterns. It's practically reading your mind at this point! 🔮`;
        } else if (milestone.value >= 50) {
          title = "📚 50 Patterns Learned!";
          message = "Half a hundred patterns identified! Your AI is becoming a true extension of your communication style.";
        }
        break;

      case 'time_saved':
        title = "⏰ Time Savings Milestone!";
        message = `You've saved approximately ${milestone.value} ${milestone.unit || 'hours'} with AI-powered drafts! That's time back in your day for what matters most. 🎈`;
        break;

      case 'accuracy_reached':
        if (milestone.value >= 95) {
          title = "🎖️ 95% Accuracy Achieved!";
          message = "Your AI drafts are now 95% accurate! That's near-perfect replication of your writing style. Impressive! 🌟";
        } else if (milestone.value >= 90) {
          title = "📈 90% Accuracy Milestone!";
          message = "Breaking through the 90% accuracy barrier! Your AI is now drafting with exceptional precision.";
        }
        break;
    }

    if (title && message) {
      await this.notificationService.createNotification({
        user_id: userId,
        organization_id: organizationId,
        title,
        message,
        type: 'success',
        action_url: '/dashboard/email',
        metadata: {
          category: 'ai',
          event: 'milestone_achieved',
          milestone
        }
      });
    }
  }

  /**
   * Send learning quality notification
   */
  async sendLearningQualityUpdate(
    userId: string,
    organizationId: string,
    quality: 'low' | 'medium' | 'high',
    suggestion?: string
  ) {
    if (quality === 'high') {
      // Don't send notification for high quality - it's expected
      return;
    }

    const title = quality === 'low' 
      ? "💡 Improve Your AI's Learning"
      : "📊 AI Learning Tip";

    let message = '';
    
    if (quality === 'low') {
      message = "Your AI needs more data to learn effectively. ";
      message += suggestion || "Try syncing more sent emails or waiting a week for more email activity.";
      message += " The more emails I analyze, the better I become! 🚀";
    } else {
      message = "Good progress on AI learning! ";
      message += suggestion || "Keep using the AI drafts and providing feedback to improve accuracy.";
      message += " We're on the right track! 📈";
    }

    await this.notificationService.createNotification({
      user_id: userId,
      organization_id: organizationId,
      title,
      message,
      type: 'info',
      action_url: '/settings/email-accounts',
      metadata: {
        category: 'ai',
        event: 'learning_quality_update',
        quality
      }
    });
  }

  /**
   * Send notification when AI learning is triggered
   */
  async sendLearningStarted(
    userId: string,
    organizationId: string,
    trigger: 'initial' | 'weekly' | 'manual' | 'threshold'
  ) {
    // Only notify for manual triggers to avoid spam
    if (trigger !== 'manual') {
      return;
    }

    const title = "🔄 AI Learning in Progress";
    const message = "I'm analyzing your recent emails to improve my responses. This will take about 30-60 seconds. I'll notify you when complete!";

    await this.notificationService.createNotification({
      user_id: userId,
      organization_id: organizationId,
      title,
      message,
      type: 'info',
      action_url: '/dashboard/email',
      metadata: {
        category: 'ai',
        event: 'learning_started',
        trigger
      }
    });
  }
}

export const aiNotificationService = new AINotificationService();