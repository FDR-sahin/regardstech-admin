import nodemailer, { SendMailOptions } from 'nodemailer';
import { db, dbManager } from '../config/db.js';
import { IEmailRecord, ISmtpSettings } from '../models/types.js';

export function getEffectiveSmtpConfig(): {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  isConfigured: boolean;
} {
  const dbSettings = db.smtpSettings;
  const host = dbSettings?.host || process.env.SMTP_HOST || '';
  const port = parseInt(String(dbSettings?.port || process.env.SMTP_PORT || '587'), 10);
  const secure = dbSettings?.secure !== undefined
    ? Boolean(dbSettings.secure)
    : (port === 465 || process.env.SMTP_SECURE === 'true');
  const user = dbSettings?.user || process.env.SMTP_USER || '';
  const pass = dbSettings?.pass || process.env.SMTP_PASS || '';
  const fromName = dbSettings?.fromName || process.env.SMTP_FROM_NAME || 'Regards Tech';
  const fromEmail = dbSettings?.fromEmail || process.env.EMAIL_FROM || 'regardstech24@gmail.com';
  
  const isConfigured = Boolean(host && user && pass);

  return { host, port, secure, user, pass, fromName, fromEmail, isConfigured };
}

export function getRequestOrigin(req?: any): string {
  if (req) {
    const forwardedProto = req.headers?.['x-forwarded-proto'];
    const forwardedHost = req.headers?.['x-forwarded-host'];
    if (forwardedHost) {
      const proto = typeof forwardedProto === 'string' ? forwardedProto.split(',')[0].trim() : 'https';
      const host = typeof forwardedHost === 'string' ? forwardedHost.split(',')[0].trim() : forwardedHost;
      return `${proto}://${host}`;
    }

    if (req.headers?.origin && typeof req.headers.origin === 'string') {
      return req.headers.origin.replace(/\/+$/, '');
    }

    if (req.headers?.referer && typeof req.headers.referer === 'string') {
      try {
        const u = new URL(req.headers.referer);
        return u.origin;
      } catch {
        // ignore
      }
    }

    const host = req.get ? req.get('host') : req.headers?.host;
    if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
      const proto = req.protocol || 'https';
      return `${proto}://${host}`;
    }
  }

  if (process.env.APP_URL && process.env.APP_URL.startsWith('http')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }

  if (req && req.get) {
    return `${req.protocol}://${req.get('host')}`;
  }

  return 'http://localhost:3000';
}

function getTransporter() {
  const cfg = getEffectiveSmtpConfig();
  if (cfg.isConfigured) {
    return nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      tls: {
        // Prevent rejection on some self-signed or modern mailservers
        rejectUnauthorized: false
      }
    });
  }
  return null;
}

function wrapInHtmlEnvelope(title: string, innerBody: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- Preheader text to prevent spam snippet triggers -->
  <div style="display: none; max-height: 0px; overflow: hidden; mso-hide: all; font-size: 1px; line-height: 1px; max-width: 0px; opacity: 0;">
    ${title} · Official communication from Regards Tech Enterprise Security.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 24px 12px; margin: 0 auto;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
          <tr>
            <td style="padding: 28px 30px;">
              ${innerBody}
            </td>
          </tr>
        </table>
        <!-- Compliant CAN-SPAM Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 580px; margin-top: 14px;">
          <tr>
            <td style="text-align: center; font-size: 11px; color: #94a3b8; line-height: 1.5; padding: 6px 16px;">
              Regards Tech Enterprise · Dhaka, Bangladesh & Global Engineering<br/>
              Official Domain: <a href="https://regardstech.com" style="color: #4f46e5; text-decoration: none;">regardstech.com</a><br/>
              This transactional message was dispatched regarding your administrator account security.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function dispatchMail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const cfg = getEffectiveSmtpConfig();
  const transporter = getTransporter();

  // ANTI-SPAM COMPLIANCE:
  // When sending via Gmail or custom SMTP, sender address MUST match the authenticated SMTP user.
  // Mismatched sender causes DMARC/SPF authentication failure and sends messages directly to Spam!
  const senderEmail = (cfg.user && cfg.user.includes('@')) ? cfg.user : cfg.fromEmail;
  const fromFormatted = `"${cfg.fromName}" <${senderEmail}>`;
  const replyTo = cfg.user || cfg.fromEmail;

  const fullHtml = html ? wrapInHtmlEnvelope(subject, html) : wrapInHtmlEnvelope(subject, `<p style="font-size: 14px; color: #1e293b; line-height: 1.6;">${text.replace(/\n/g, '<br/>')}</p>`);

  if (transporter) {
    try {
      const mailOptions: SendMailOptions = {
        from: fromFormatted,
        to,
        replyTo,
        subject,
        text,
        html: fullHtml,
        headers: {
          'X-Auto-Response-Suppress': 'All',
          'Auto-Submitted': 'auto-generated',
          'X-Report-Abuse': 'Please report abuse to security@regardstech.com'
        }
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`[EmailService] SMTP email delivered to ${to}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err: any) {
      console.error(`[EmailService] SMTP delivery failed to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    const reason = 'SMTP credentials not configured (Host, User, or Password missing in Settings / .env). Stored in Outbox Simulator.';
    console.log(`[EmailService] Notice: ${reason} To: ${to}, Subject: "${subject}"`);
    return { success: false, error: reason };
  }
}

export class EmailService {
  public static async verifyConnection(): Promise<{ success: boolean; message: string }> {
    const cfg = getEffectiveSmtpConfig();
    if (!cfg.isConfigured) {
      return {
        success: false,
        message: 'SMTP is not configured. Please supply SMTP Host, User Email, and Password / App Password.'
      };
    }

    try {
      const transporter = getTransporter();
      if (!transporter) throw new Error('Could not create SMTP transporter instance');
      await transporter.verify();
      return {
        success: true,
        message: `Connected successfully to SMTP server ${cfg.host}:${cfg.port} as ${cfg.user}`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `SMTP Connection error: ${err.message || 'Authentication or server error'}`
      };
    }
  }

  public static async sendTestEmail(to: string): Promise<{ success: boolean; message: string; record: IEmailRecord }> {
    const subject = 'Regards Tech - SMTP Live Test Email';
    const content = `Hello,\n\nThis is a confirmation test email dispatched from your Regards Tech Admin Panel.\nYour SMTP settings are working properly!\nDispatched at: ${new Date().toISOString()}`;
    const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; max-width: 500px;">
        <h2 style="color: #2563eb; margin-top: 0;">Regards Tech - SMTP Test Successful!</h2>
        <p>This email confirms that your outgoing mail server is connected and delivering emails properly.</p>
        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 13px;">
          Timestamp: ${new Date().toLocaleString()}<br/>
          Recipient: ${to}
        </div>
      </div>
    `;

    const record: IEmailRecord = {
      id: `em_${Date.now()}_test`,
      to,
      subject,
      type: 'notification',
      content,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    const result = await dispatchMail(to, subject, content, html);
    if (!result.success) {
      record.status = 'failed';
      record.deliveryError = result.error;
    }

    if (!db.outbox) db.outbox = [];
    db.outbox.unshift(record);
    if (db.outbox.length > 100) db.outbox.pop();
    dbManager.save();

    return {
      success: result.success,
      message: result.success
        ? `Test email delivered to ${to} (MessageId: ${result.messageId})`
        : `Could not send test email: ${result.error}`,
      record
    };
  }

  public static async sendVerificationEmail(to: string, name: string, token: string, baseUrl?: string): Promise<IEmailRecord> {
    const expiresAt = new Date(Date.now() + 24 * 3600000).toISOString();
    
    // Safely parse host origin (avoid accidental OTP numbers or malformed URLs)
    let appHost = 'http://localhost:3000';
    if (baseUrl && typeof baseUrl === 'string' && (baseUrl.startsWith('http://') || baseUrl.startsWith('https://'))) {
      appHost = baseUrl.replace(/\/+$/, '');
    } else if (process.env.APP_URL && (process.env.APP_URL.startsWith('http://') || process.env.APP_URL.startsWith('https://'))) {
      appHost = process.env.APP_URL.replace(/\/+$/, '');
    }
    const verificationUrl = `${appHost}/api/auth/verify-link?token=${token}`;

    const content = `Hello ${name},\n\nA Regards Tech administrator account has been created for your email by the Super Administrator.\n\nPlease verify your email and activate your account by clicking the link below:\n\n${verificationUrl}\n\nThis verification link is valid for 24 hours. Once verified, you can immediately sign in to your administrator dashboard.\n\nWarm regards,\nRegards Tech Administration`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <div style="border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 18px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 20px; font-weight: 700;">Regards Tech</h2>
          <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px;">Enterprise Administration Portal · regardstech.com</p>
        </div>
        <p style="font-size: 15px; margin: 0 0 14px 0; color: #0f172a;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; margin: 0 0 16px 0; color: #334155;">
          A Regards Tech administrator account has been created for your email by the Super Administrator.
        </p>
        <p style="font-size: 14px; margin: 0 0 20px 0; color: #334155;">
          Please click the button below to verify your email address and activate your administrator access:
        </p>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${verificationUrl}" target="_blank" style="background-color: #4f46e5; color: #ffffff; padding: 14px 34px; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; display: inline-block; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);">
            Verify My Account
          </a>
        </div>
        <p style="font-size: 13px; color: #475569; margin: 18px 0 0 0; text-align: center;">
          Just 1-click on the button above to instantly verify and proceed to login.
        </p>
        <p style="font-size: 12px; color: #94a3b8; margin: 24px 0 0 0; border-top: 1px dashed #e2e8f0; padding-top: 14px;">
          If the button does not open automatically, copy and paste this verification URL into your browser:<br/>
          <a href="${verificationUrl}" style="color: #4f46e5; word-break: break-all; text-decoration: underline;">${verificationUrl}</a>
        </p>
        <div style="margin-top: 20px; font-size: 11px; color: #94a3b8;">
          This link is unique to your administrator profile and expires in 24 hours.
        </div>
      </div>
    `;

    const record: IEmailRecord = {
      id: `em_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      to,
      subject: 'Verify your Regards Tech administrator account',
      type: 'verification',
      tokenOrCode: token,
      content,
      sentAt: new Date().toISOString(),
      expiresAt,
      status: 'sent'
    };

    const result = await dispatchMail(to, record.subject, content, html);
    if (!result.success) {
      record.status = 'outbox_only';
      record.deliveryError = result.error;
    }

    if (!db.outbox) db.outbox = [];
    db.outbox.unshift(record);
    if (db.outbox.length > 100) db.outbox.pop();
    dbManager.save();

    console.log(`[EmailService] 1-Click Verification email processed for ${to} (SMTP: ${result.success ? 'Delivered' : 'Outbox only'})`);
    return record;
  }

  public static async sendPasswordResetOtp(to: string, name: string, otp: string): Promise<IEmailRecord> {
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
    const content = `Hello ${name},\n\nA password reset request was initiated for your Regards Tech administrator account.\n\nYour 6-Digit One-Time Password (OTP) is:\n\n>>> ${otp} <<<\n\nThis OTP is valid for 10 minutes. For security reasons, do not share this code with anyone. If you did not request this, please contact Super Admin immediately.`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Regards Tech</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Security & Account Recovery</p>
        </div>
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          A password reset request was initiated for your Regards Tech administrator account (<strong>${to}</strong>). Enter the 6-digit code below to set your new password:
        </p>
        <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1e3a8a;">${otp}</span>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">This OTP code expires in 10 minutes</p>
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 24px 0 0 0;">
          If you did not request a password reset, you can safely disregard this email. Your password will remain unchanged.
        </p>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #94a3b8;">
          Regards Tech Global Engineering · <a href="https://regardstech.com" style="color: #2563eb; text-decoration: none;">regardstech.com</a>
        </div>
      </div>
    `;

    const record: IEmailRecord = {
      id: `em_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      to,
      subject: `Your Regards Tech password reset code: ${otp}`,
      type: 'otp',
      tokenOrCode: otp,
      content,
      sentAt: new Date().toISOString(),
      expiresAt,
      status: 'sent'
    };

    const result = await dispatchMail(to, record.subject, content, html);
    if (!result.success) {
      record.status = 'outbox_only';
      record.deliveryError = result.error;
    }

    if (!db.outbox) db.outbox = [];
    db.outbox.unshift(record);
    if (db.outbox.length > 100) db.outbox.pop();
    dbManager.save();

    console.log(`[EmailService] Password reset OTP sent to ${to}: ${otp} (SMTP: ${result.success ? 'Delivered' : 'Outbox only'})`);
    return record;
  }

  public static async sendLoginOtp(to: string, name: string, otp: string): Promise<IEmailRecord> {
    const expiresAt = new Date(Date.now() + 10 * 60000).toISOString();
    const content = `Hello ${name},\n\nA login attempt was initiated for your Regards Tech administrator account.\n\nYour 6-Digit Login Security OTP is:\n\n>>> ${otp} <<<\n\nThis OTP is valid for 10 minutes. Enter this code on the login screen to access your admin dashboard.`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 28px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 14px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 22px; font-weight: 700; letter-spacing: -0.02em;">Regards Tech</h2>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Two-Factor Authentication (2FA)</p>
        </div>
        <p style="font-size: 15px; color: #1e293b; margin: 0 0 16px 0;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6; margin: 0 0 20px 0;">
          A sign-in request was initiated for your Regards Tech administrator account (<strong>${to}</strong>). Enter your 6-digit security code below to complete your login:
        </p>
        <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #1d4ed8;">${otp}</span>
          <p style="margin: 8px 0 0 0; font-size: 12px; color: #3b82f6;">Valid for 10 minutes · One-Time Use</p>
        </div>
        <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 24px 0 0 0;">
          If this was not you, someone may be attempting to access your account. Please change your password immediately.
        </p>
        <div style="border-top: 1px solid #e2e8f0; margin-top: 24px; padding-top: 16px; font-size: 12px; color: #94a3b8;">
          Regards Tech Global Engineering · <a href="https://regardstech.com" style="color: #2563eb; text-decoration: none;">regardstech.com</a>
        </div>
      </div>
    `;

    const record: IEmailRecord = {
      id: `em_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      to,
      subject: `Your Regards Tech verification code: ${otp}`,
      type: 'otp',
      tokenOrCode: otp,
      content,
      sentAt: new Date().toISOString(),
      expiresAt,
      status: 'sent'
    };

    const result = await dispatchMail(to, record.subject, content, html);
    if (!result.success) {
      record.status = 'outbox_only';
      record.deliveryError = result.error;
    }

    if (!db.outbox) db.outbox = [];
    db.outbox.unshift(record);
    if (db.outbox.length > 100) db.outbox.pop();
    dbManager.save();

    console.log(`[EmailService] Login OTP sent to ${to}: ${otp} (SMTP: ${result.success ? 'Delivered' : 'Outbox only'})`);
    return record;
  }

  public static async sendContactReply(
    to: string,
    clientName: string,
    originalSubject: string,
    replyNote: string,
    adminName: string = 'Regards Tech Team'
  ): Promise<{ record: IEmailRecord; delivered: boolean; error?: string }> {
    const cleanSubject = originalSubject
      ? (originalSubject.toLowerCase().startsWith('re:') ? originalSubject : `Re: ${originalSubject}`)
      : 'Response from Regards Tech';

    const content = `Hello ${clientName},\n\nThank you for getting in touch with Regards Tech.\n\n${replyNote}\n\nWarm regards,\n${adminName}\nRegards Tech Client Services\nWebsite: https://regardstech.com`;

    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; line-height: 1.6;">
        <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 18px;">
          <h2 style="margin: 0; color: #0f172a; font-size: 18px; font-weight: 700;">Regards Tech</h2>
          <p style="margin: 3px 0 0 0; color: #64748b; font-size: 12px;">Innovative Insights, Outstanding Outcomes · regardstech.com</p>
        </div>
        <p style="font-size: 15px; margin: 0 0 14px 0; color: #0f172a;">Hello <strong>${clientName}</strong>,</p>
        <p style="font-size: 14px; margin: 0 0 14px 0; color: #334155;">Thank you for contacting Regards Tech. Here is our response to your message:</p>
        <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 14px 18px; margin: 16px 0; border-radius: 4px; font-size: 14px; color: #0f172a; white-space: pre-wrap; line-height: 1.6;">${replyNote}</div>
        <p style="font-size: 13px; color: #64748b; margin: 24px 0 0 0; line-height: 1.5;">
          Warm regards,<br/>
          <strong>${adminName}</strong><br/>
          Regards Tech Client Services<br/>
          <a href="https://regardstech.com" style="color: #2563eb; text-decoration: none;">https://regardstech.com</a>
        </p>
      </div>
    `;

    const record: IEmailRecord = {
      id: `em_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      to,
      subject: cleanSubject,
      type: 'notification',
      content,
      sentAt: new Date().toISOString(),
      status: 'sent'
    };

    const result = await dispatchMail(to, cleanSubject, content, html);
    if (!result.success) {
      record.status = 'outbox_only';
      record.deliveryError = result.error;
    }

    if (!db.outbox) db.outbox = [];
    db.outbox.unshift(record);
    if (db.outbox.length > 100) db.outbox.pop();
    dbManager.save();

    console.log(`[EmailService] Contact reply sent to ${to} (${clientName}) - SMTP: ${result.success ? 'Delivered' : 'Outbox only'}`);
    return { record, delivered: result.success, error: result.error };
  }
}
