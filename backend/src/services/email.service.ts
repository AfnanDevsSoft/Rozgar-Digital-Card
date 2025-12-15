/**
 * Email Notification Service
 */

import nodemailer from 'nodemailer';

interface EmailOptions {
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

/**
 * Send email
 */
export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
    try {
        await transporter.sendMail({
            from: process.env.SMTP_USER || 'noreply@healthcard.com',
            to: options.to,
            subject: options.subject,
            text: options.text,
            html: options.html
        });
        console.log(`📧 Email sent to: ${options.to}`);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
};

/**
 * Send report ready notification
 */
export const sendReportNotification = async (
    userEmail: string,
    userName: string,
    labName: string,
    testName: string,
    portalUrl: string
): Promise<boolean> => {
    const subject = '🏥 Your Lab Report is Ready';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #1a73e8; padding-bottom: 20px; }
        .header h1 { color: #1a73e8; margin: 0; }
        .content { padding: 20px 0; }
        .info-box { background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
        .label { color: #666; }
        .value { font-weight: bold; }
        .button { display: inline-block; background: #1a73e8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🏥 Digital Health Card</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Great news! Your lab report has been uploaded and is now available for viewing.</p>
          
          <div class="info-box">
            <div class="info-row">
              <span class="label">Lab:</span>
              <span class="value">${labName}</span>
            </div>
            <div class="info-row">
              <span class="label">Test:</span>
              <span class="value">${testName}</span>
            </div>
            <div class="info-row">
              <span class="label">Date:</span>
              <span class="value">${new Date().toLocaleDateString()}</span>
            </div>
          </div>
          
          <p>You can view and download your report by logging into your account:</p>
          
          <center>
            <a href="${portalUrl}" class="button">View Report</a>
          </center>
        </div>
        <div class="footer">
          <p>This is an automated message from Digital Health Card System.</p>
          <p>Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({ to: userEmail, subject, html });
};

/**
 * Send welcome email with credentials
 */
export const sendWelcomeEmail = async (
    userEmail: string,
    userName: string,
    serialNumber: string,
    tempPassword: string,
    portalUrl: string
): Promise<boolean> => {
    const subject = '🎉 Welcome to Digital Health Card';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background-color: #f5f5f5; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; padding: 30px; }
        .header { text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; }
        .header h1 { color: #16a34a; margin: 0; }
        .content { padding: 20px 0; }
        .credentials { background: #f0fdf4; border: 2px solid #16a34a; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .credential-row { margin: 10px 0; }
        .label { color: #666; display: block; font-size: 12px; }
        .value { font-size: 18px; font-weight: bold; color: #1f2937; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin: 15px 0; }
        .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
        .footer { text-align: center; color: #999; font-size: 12px; margin-top: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Welcome!</h1>
        </div>
        <div class="content">
          <p>Dear <strong>${userName}</strong>,</p>
          <p>Your Digital Health Card has been created successfully. Here are your login credentials:</p>
          
          <div class="credentials">
            <div class="credential-row">
              <span class="label">Serial Number</span>
              <span class="value">${serialNumber}</span>
            </div>
            <div class="credential-row">
              <span class="label">Temporary Password</span>
              <span class="value">${tempPassword}</span>
            </div>
          </div>
          
          <div class="warning">
            ⚠️ Please change your password after your first login for security.
          </div>
          
          <p>Present your serial number at any partner lab to receive discounts on your medical tests.</p>
          
          <center>
            <a href="${portalUrl}" class="button">Login to Portal</a>
          </center>
        </div>
        <div class="footer">
          <p>Keep this email safe for your records.</p>
        </div>
      </div>
    </body>
    </html>
  `;

    return sendEmail({ to: userEmail, subject, html });
};
