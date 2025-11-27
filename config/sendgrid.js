require('dotenv').config();
const sgMail = require('@sendgrid/mail');

const SENDER_EMAIL = process.env.EMAIL_USER;

if (!SENDER_EMAIL) {
  throw new Error('EMAIL_USER must be set in your environment variables');
}
if (!process.env.SENDGRID_API_KEY) {
  throw new Error('SENDGRID_API_KEY must be set in your environment variables');
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send an email via SendGrid
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} text - Plain text content
 * @param {string} html - HTML content
 * @returns {Promise<{success: boolean, info?: any, error?: string}>}
 */
async function sendEmail(to, subject, text = '', html = '') {
  // Ensure at least some content
  if (!text && !html) {
    text = ' '; // minimal non-empty string
  }

  const msg = {
    to,
    from: SENDER_EMAIL,
    subject,
    text,
    html: html || `<p>${text}</p>`,
  };

  try {
    const info = await sgMail.send(msg);
    console.log(`Email sent to ${to}`);
    return { success: true, info };
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error.message);
    if (error.response?.body) console.error(error.response.body);
    return { success: false, error: error.message };
  }
}

module.exports = { sendEmail, SENDER_EMAIL };
