/**
 * Email Service for BackstagePass
 *
 * Uses Nodemailer for SMTP-based transactional emails (e.g. Gmail).
 * Set SMTP_HOST, SMTP_USER, SMTP_PASS in environment variables.
 */

export {
  sendEmail,
  sendEmailWithRetry,
  isEmailServiceConfigured,
  getEmailServiceStatus,
} from './client'
