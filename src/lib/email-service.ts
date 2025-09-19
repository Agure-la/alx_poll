import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface EmailNotification {
  to: string | string[];
  template: keyof typeof emailTemplates;
  data: Record<string, any>;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

export async function sendEmailNotification(notification: EmailNotification): Promise<EmailResult> {
  try {
    const template = emailTemplates[notification.template];
    if (!template) {
      throw new Error(`Unknown email template: ${notification.template}`);
    }

    const subject = template.subject(notification.data);
    const html = template.html(notification.data);

    const result = await resend.emails.send({
      from: 'Polly <noreply@polly.com>',
      to: notification.to,
      subject,
      html
    });

    return { success: true, id: result.data?.id };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Utility functions for common notifications
export async function notifyPollClosing(pollId: string) {
  // Implementation would fetch poll data and subscriber emails
  // This is a simplified example
}

export async function notifyNewPoll(pollId: string, subscriberEmails: string[]) {
  // Implementation would fetch poll data and send notifications
}

export async function notifyCommentReply(commentId: string, replyId: string) {
  // Implementation would fetch comment data and notify original commenter
}
const emailTemplates = {
  'poll-closing': {
    subject: (data: any) => `Poll "${data.pollTitle}" is closing soon!`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Poll Closing Soon</h2>
        <p>The poll "<strong>${data.pollTitle}</strong>" will close in ${data.timeRemaining}.</p>
        <p>Don't miss your chance to vote!</p>
        <a href="${data.pollUrl}" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Vote Now</a>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">Current results:</p>
        <ul>
          ${data.options.map((option: any) => `<li>${option.text}: ${option.votes} votes</li>`).join('')}
        </ul>
      </div>
    `
  },
  'poll-created': {
    subject: (data: any) => `New poll: "${data.pollTitle}"`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Poll Created</h2>
        <p>A new poll "<strong>${data.pollTitle}</strong>" has been created by ${data.creatorName}.</p>
        <p>${data.description}</p>
        <a href="${data.pollUrl}" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Poll</a>
        <p style="margin-top: 20px; color: #666; font-size: 14px;">Poll expires: ${data.expiresAt}</p>
      </div>
    `
  },
  'comment-reply': {
    subject: (data: any) => `New reply to your comment on "${data.pollTitle}"`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>New Reply</h2>
        <p><strong>${data.replyAuthor}</strong> replied to your comment on "<strong>${data.pollTitle}</strong>":</p>
        <blockquote style="border-left: 4px solid #007bff; padding-left: 16px; margin: 16px 0; color: #666;">
          ${data.replyContent}
        </blockquote>
        <a href="${data.pollUrl}#comments" style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Reply</a>
      </div>
    `
  },
  'poll-results': {
    subject: (data: any) => `Results for "${data.pollTitle}"`,
    html: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Poll Results</h2>
        <p>The poll "<strong>${data.pollTitle}</strong>" has ended. Here are the final results:</p>
        <div style="margin: 20px 0;">
          ${data.results.map((result: any) => `
            <div style="margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                <span><strong>${result.option}</strong></span>
                <span>${result.votes} votes (${result.percentage}%)</span>
              </div>
              <div style="background: #e9ecef; height: 8px; border-radius: 4px;">
                <div style="background: #007bff; height: 8px; border-radius: 4px; width: ${result.percentage}%;"></div>
              </div>
            </div>
          `).join('')}
        </div>
        <p>Total votes: <strong>${data.totalVotes}</strong></p>
        <a href="${data.pollUrl}/analytics" style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Analytics</a>
      </div>
    `
  }
};