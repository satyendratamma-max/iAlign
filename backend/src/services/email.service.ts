import nodemailer from 'nodemailer';
import logger from '../config/logger';

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

// Email configuration from environment variables
const emailConfig = {
  enabled: process.env.EMAIL_ENABLED === 'true',
  service: process.env.EMAIL_SERVICE || 'smtp', // 'smtp', 'sendgrid', 'gmail', etc.
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  from: process.env.EMAIL_FROM || 'noreply@ialign.com',
};

// Create transporter
let transporter: nodemailer.Transporter | null = null;

if (emailConfig.enabled && emailConfig.auth.user && emailConfig.auth.pass) {
  try {
    transporter = nodemailer.createTransport({
      host: emailConfig.host,
      port: emailConfig.port,
      secure: emailConfig.secure,
      auth: {
        user: emailConfig.auth.user,
        pass: emailConfig.auth.pass,
      },
    });

    // Verify connection configuration
    transporter.verify((error) => {
      if (error) {
        logger.error('Email transporter verification failed:', error);
      } else {
        logger.info('Email service is ready to send messages');
      }
    });
  } catch (error) {
    logger.error('Failed to create email transporter:', error);
  }
} else {
  logger.warn('Email service is disabled or not properly configured');
}

/**
 * Send an email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  // If email is disabled or transporter is not configured, log and return
  if (!emailConfig.enabled) {
    logger.info('Email not sent (service disabled):', {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  if (!transporter) {
    logger.warn('Email not sent (transporter not configured):', {
      to: options.to,
      subject: options.subject,
    });
    return false;
  }

  try {
    const mailOptions = {
      from: options.from || emailConfig.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('Email sent successfully:', {
      messageId: info.messageId,
      to: options.to,
      subject: options.subject,
    });

    return true;
  } catch (error) {
    logger.error('Error sending email:', {
      error,
      to: options.to,
      subject: options.subject,
    });
    return false;
  }
};

/**
 * Send a test email to verify configuration
 */
export const sendTestEmail = async (to: string): Promise<boolean> => {
  return sendEmail({
    to,
    subject: 'iAlign Email Service Test',
    html: `
      <h2>Email Service Test</h2>
      <p>This is a test email from the iAlign Resource Planning System.</p>
      <p>If you received this email, your email configuration is working correctly!</p>
      <hr/>
      <p style="color: #666; font-size: 12px;">
        Sent at: ${new Date().toLocaleString()}
      </p>
    `,
  });
};

/**
 * Send bulk emails (with rate limiting if needed)
 */
export const sendBulkEmails = async (
  recipients: Array<{ email: string; name: string }>,
  subject: string,
  htmlTemplate: (name: string) => string
): Promise<{ sent: number; failed: number }> => {
  const results = { sent: 0, failed: 0 };

  for (const recipient of recipients) {
    const success = await sendEmail({
      to: recipient.email,
      subject,
      html: htmlTemplate(recipient.name),
    });

    if (success) {
      results.sent++;
    } else {
      results.failed++;
    }

    // Add delay to avoid rate limiting (if needed)
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  logger.info('Bulk email sending completed:', results);
  return results;
};

export default {
  sendEmail,
  sendTestEmail,
  sendBulkEmails,
};
