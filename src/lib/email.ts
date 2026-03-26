import { BrevoClient } from '@getbrevo/brevo';

// Initialize Brevo client
const apiKey = process.env.BREVO_API_KEY;
let brevo: BrevoClient | null = null;

if (apiKey) {
  brevo = new BrevoClient({ apiKey });
  console.log('✅ Brevo client initialized successfully');
} else {
  console.log('⚠️ BREVO_API_KEY not found - email service disabled');
}

interface SendEmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

/**
 * Send a password reset email using Brevo
 */
export async function sendPasswordResetEmail({
  to,
  resetUrl,
  userName,
}: PasswordResetEmailParams): Promise<SendEmailResult> {
  console.log('📧 Attempting to send password reset email to:', to);
  
  if (!brevo) {
    console.error('❌ Brevo client not initialized - BREVO_API_KEY missing');
    return {
      success: false,
      error: 'Email service not configured - BREVO_API_KEY missing',
    };
  }

  // Use the verified sender email from Brevo
  const senderEmail = process.env.EMAIL_FROM || 'contact@jazelwebagency.com';
  const senderName = process.env.EMAIL_FROM_NAME || 'Jazel Golf';
  
  console.log('📧 Sender:', senderName, '<' + senderEmail + '>');
  console.log('📧 Recipient:', to);

  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Jazel Golf</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #06402B 0%, #0d7377 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Jazel Golf</h1>
          <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 40px 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hello ${userName || 'Golfer'},
          </p>
          
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            We received a request to reset your password for your Jazel Golf Scorecard account. Click the button below to create a new password:
          </p>
          
          <!-- Reset Button -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #06402B 0%, #0d7377 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(6, 64, 43, 0.4);">
              Reset My Password
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            Or copy and paste this link into your browser:
          </p>
          <p style="color: #06402B; font-size: 13px; word-break: break-all; background-color: #e8f5ed; padding: 12px; border-radius: 6px; border: 1px solid #c5e6d1;">
            ${resetUrl}
          </p>
          
          <!-- Expiration Warning -->
          <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 15px; margin: 25px 0;">
            <p style="color: #92400e; font-size: 14px; margin: 0;">
              ⚠️ This link will expire in <strong>1 hour</strong> for your security.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 20px 0;">
            If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
          </p>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Jazel Golf Scorecard • Morocco Golf Courses
          </p>
          <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0; text-align: center;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    console.log('📧 Calling Brevo sendTransacEmail API...');
    
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{
        email: to,
        name: userName || to,
      }],
      subject: 'Reset Your Password - Jazel Golf Scorecard',
      htmlContent: emailHtml,
    });

    console.log('📧 Brevo API response:', JSON.stringify(response, null, 2));
    
    if (response.data) {
      console.log('✅ Password reset email sent successfully! MessageId:', response.data.messageId);
      return {
        success: true,
        messageId: response.data.messageId,
      };
    } else {
      console.error('❌ Brevo response missing data:', response);
      return {
        success: false,
        error: 'Invalid response from email service',
      };
    }
  } catch (error: unknown) {
    console.error('❌ Brevo API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Send a welcome email to new users
 */
export async function sendWelcomeEmail({
  to,
  userName,
}: {
  to: string;
  userName?: string;
}): Promise<SendEmailResult> {
  if (!brevo) {
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  const senderEmail = process.env.EMAIL_FROM || 'a4dd04001@smtp-brevo.com';
  const senderName = process.env.EMAIL_FROM_NAME || 'Jazel Golf';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://jazel-golf-score-card.vercel.app';
  
  const emailHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Jazel Golf</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <div style="background: linear-gradient(135deg, #06402B 0%, #0d7377 100%); padding: 30px 20px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Welcome to Jazel Golf!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
            Hello ${userName || 'Golfer'},
          </p>
          <p style="color: #555; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
            Welcome to Jazel Golf Scorecard - your companion for tracking golf rounds across Morocco's beautiful courses!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${appUrl}" style="display: inline-block; background: linear-gradient(135deg, #06402B 0%, #0d7377 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 8px; font-size: 16px; font-weight: 600;">
              Start Playing Now
            </a>
          </div>
        </div>
        <div style="background-color: #f9fafb; padding: 25px 30px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 13px; margin: 0; text-align: center;">
            © ${new Date().getFullYear()} Jazel Golf Scorecard • Morocco Golf Courses
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const response = await brevo.transactionalEmails.sendTransacEmail({
      sender: {
        name: senderName,
        email: senderEmail,
      },
      to: [{
        email: to,
        name: userName || to,
      }],
      subject: 'Welcome to Jazel Golf Scorecard!',
      htmlContent: emailHtml,
    });

    return {
      success: true,
      messageId: response.data?.messageId,
    };
  } catch (error: unknown) {
    console.error('Error sending welcome email:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email';
    return {
      success: false,
      error: errorMessage,
    };
  }
}
