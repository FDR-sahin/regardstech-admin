import { Response } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, dbManager } from '../config/db.js';
import { IAdmin, AdminRole, AdminPermissions } from '../models/types.js';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';
import { EmailService, getRequestOrigin } from '../services/emailService.js';
import { validatePassword } from './authController.js';

export class AdminController {
  // GET /api/admins
  static getAll(req: AuthenticatedRequest, res: Response) {
    const sanitized = db.admins.map(a => {
      const { passwordHash, resetPasswordOtp, ...safe } = a;
      return safe;
    });

    return res.json({
      success: true,
      count: sanitized.length,
      admins: sanitized
    });
  }

  // GET /api/admins/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const admin = db.admins.find(a => a.id === req.params.id);
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Administrator not found.' });
    }

    const { passwordHash, resetPasswordOtp, ...safe } = admin;
    return res.json({ success: true, admin: safe });
  }

  // POST /api/admins
  static async create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, password, role, permissions, sendVerificationEmail, isActive } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const existing = db.admins.find(a => a.email.toLowerCase() === cleanEmail);
      if (existing) {
        return res.status(400).json({ success: false, message: 'An administrator with this email already exists.' });
      }

      const val = validatePassword(password);
      if (!val.isValid) {
        return res.status(400).json({ success: false, message: val.message });
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const verificationToken = crypto.randomBytes(32).toString('hex');
      const shouldSendVerification = sendVerificationEmail !== false;

      const newAdmin: IAdmin = {
        id: `adm_${Date.now()}`,
        name: String(name).trim(),
        email: cleanEmail,
        passwordHash,
        role: (role === 'super_admin' ? 'super_admin' : 'admin') as AdminRole,
        permissions: permissions || {
          dashboard: { view: true },
          projects: { view: true, create: true, edit: true, delete: false },
          services: { view: true, create: false, edit: false, delete: false },
          blogs: { view: true, create: true, edit: true, delete: false, publish: false },
          testimonials: { view: true, create: false, edit: false, delete: false },
          messages: { view: true, markRead: true, delete: false },
          admins: { view: false, create: false, edit: false, delete: false },
          media: { view: true, upload: true, delete: false },
          auditLogs: { view: false }
        },
        isEmailVerified: !shouldSendVerification,
        verificationToken: shouldSendVerification ? verificationToken : undefined,
        verificationTokenExpires: shouldSendVerification ? Date.now() + 24 * 60 * 60 * 1000 : undefined,
        isActive: isActive !== false,
        avatarUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.admins.push(newAdmin);
      dbManager.save();

      if (shouldSendVerification) {
        const origin = getRequestOrigin(req);
        await EmailService.sendVerificationEmail(newAdmin.email, newAdmin.name, verificationToken, origin);
      }

      logAudit(req, 'ADMIN_CREATED', 'Admins', `Created admin "${newAdmin.name}" (${newAdmin.email})`, newAdmin.id, 'success');

      const { passwordHash: _, ...safeAdmin } = newAdmin;
      return res.status(201).json({
        success: true,
        message: shouldSendVerification
          ? 'Administrator created. Verification email dispatched.'
          : 'Administrator created successfully.',
        admin: safeAdmin
      });
    } catch (err) {
      console.error('Create admin error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create administrator.' });
    }
  }

  // PUT /api/admins/:id
  static update(req: AuthenticatedRequest, res: Response) {
    try {
      const admin = db.admins.find(a => a.id === req.params.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found.' });
      }

      const { name, email, role, permissions, isActive, avatarUrl } = req.body;

      if (req.admin?.id === admin.id && isActive === false) {
        return res.status(400).json({ success: false, message: 'You cannot deactivate your own active session.' });
      }

      if (email && String(email).trim()) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (cleanEmail !== admin.email.toLowerCase()) {
          const duplicate = db.admins.find(a => a.id !== admin.id && a.email.toLowerCase() === cleanEmail);
          if (duplicate) {
            return res.status(400).json({ success: false, message: 'Another administrator is already using this email.' });
          }
          admin.email = cleanEmail;
        }
      }

      if (name) admin.name = String(name).trim();
      if (role) admin.role = role === 'super_admin' ? 'super_admin' : 'admin';
      if (permissions) admin.permissions = permissions;
      if (typeof isActive === 'boolean') admin.isActive = isActive;
      if (avatarUrl) admin.avatarUrl = avatarUrl;
      admin.updatedAt = new Date().toISOString();

      dbManager.save();

      logAudit(req, 'ADMIN_UPDATED', 'Admins', `Updated administrator permissions for "${admin.name}"`, admin.id, 'success');

      const { passwordHash, resetPasswordOtp, ...safe } = admin;
      return res.json({
        success: true,
        message: 'Administrator updated successfully.',
        admin: safe
      });
    } catch (err) {
      console.error('Update admin error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update administrator.' });
    }
  }

  // DELETE /api/admins/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const admin = db.admins.find(a => a.id === req.params.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found.' });
      }

      if (req.admin?.id === admin.id) {
        return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
      }

      const index = db.admins.findIndex(a => a.id === req.params.id);
      db.admins.splice(index, 1);
      dbManager.save();

      logAudit(req, 'ADMIN_DELETED', 'Admins', `Deleted administrator "${admin.name}" (${admin.email})`, admin.id, 'success');

      return res.json({
        success: true,
        message: `Administrator "${admin.name}" deleted successfully.`
      });
    } catch (err) {
      console.error('Delete admin error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete administrator.' });
    }
  }

  // GET /api/admins/settings/smtp
  static getSmtpSettings(req: AuthenticatedRequest, res: Response) {
    const dbSettings = db.smtpSettings;
    const host = dbSettings?.host || process.env.SMTP_HOST || '';
    const port = parseInt(String(dbSettings?.port || process.env.SMTP_PORT || '587'), 10);
    const secure = dbSettings?.secure !== undefined
      ? Boolean(dbSettings.secure)
      : (port === 465 || process.env.SMTP_SECURE === 'true');
    const user = dbSettings?.user || process.env.SMTP_USER || '';
    const fromName = dbSettings?.fromName || process.env.SMTP_FROM_NAME || 'Regards Tech';
    const fromEmail = dbSettings?.fromEmail || process.env.EMAIL_FROM || 'contact@regardstech.com';
    const isConfigured = Boolean(host && user && (dbSettings?.pass || process.env.SMTP_PASS));

    return res.json({
      success: true,
      smtpSettings: {
        host,
        port,
        secure,
        user,
        passConfigured: Boolean(dbSettings?.pass || process.env.SMTP_PASS),
        fromName,
        fromEmail,
        isConfigured,
        updatedAt: dbSettings?.updatedAt
      }
    });
  }

  // POST /api/admins/settings/smtp
  static saveSmtpSettings(req: AuthenticatedRequest, res: Response) {
    try {
      const { host, port, secure, user, pass, fromName, fromEmail } = req.body;

      if (!host || !user) {
        return res.status(400).json({ success: false, message: 'SMTP Host and User/Email are required.' });
      }

      // Preserve existing password if not re-entered
      const existingPass = db.smtpSettings?.pass || process.env.SMTP_PASS || '';
      const finalPass = pass && pass.trim() ? pass.trim() : existingPass;

      if (!finalPass) {
        return res.status(400).json({ success: false, message: 'SMTP Password or App Password is required.' });
      }

      db.smtpSettings = {
        host: String(host).trim(),
        port: parseInt(String(port || 587), 10),
        secure: Boolean(secure),
        user: String(user).trim(),
        pass: finalPass,
        fromName: String(fromName || 'Regards Tech').trim(),
        fromEmail: String(fromEmail || user).trim(),
        isConfigured: true,
        updatedAt: new Date().toISOString()
      };

      dbManager.save();

      logAudit(req, 'SMTP_SETTINGS_UPDATED', 'Settings', `Updated SMTP server configuration (${db.smtpSettings.host}:${db.smtpSettings.port})`, 'smtp', 'success');

      return res.json({
        success: true,
        message: 'SMTP email settings saved successfully.',
        smtpSettings: {
          host: db.smtpSettings.host,
          port: db.smtpSettings.port,
          secure: db.smtpSettings.secure,
          user: db.smtpSettings.user,
          passConfigured: true,
          fromName: db.smtpSettings.fromName,
          fromEmail: db.smtpSettings.fromEmail,
          isConfigured: true,
          updatedAt: db.smtpSettings.updatedAt
        }
      });
    } catch (err: any) {
      console.error('Save SMTP settings error:', err);
      return res.status(500).json({ success: false, message: 'Failed to save SMTP settings.' });
    }
  }

  // POST /api/admins/settings/smtp/test
  static async sendTestSmtpEmail(req: AuthenticatedRequest, res: Response) {
    try {
      const { targetEmail } = req.body;
      const recipient = targetEmail || req.admin?.email || 'sahinfdr89@gmail.com';

      const result = await EmailService.sendTestEmail(recipient);

      logAudit(
        req,
        'SMTP_TEST_DISPATCHED',
        'Settings',
        `Dispatched test email to "${recipient}". Result: ${result.success ? 'Success' : 'Failed - ' + result.message}`,
        'smtp',
        result.success ? 'success' : 'failure'
      );

      return res.json({
        success: result.success,
        message: result.message,
        record: result.record
      });
    } catch (err: any) {
      console.error('Test SMTP email error:', err);
      return res.status(500).json({ success: false, message: `Failed to test SMTP: ${err.message}` });
    }
  }

  // POST /api/admins/:id/resend-verification
  static async resendVerificationLink(req: AuthenticatedRequest, res: Response) {
    try {
      const admin = db.admins.find(a => a.id === req.params.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found.' });
      }

      if (admin.isEmailVerified) {
        return res.json({ success: true, message: `${admin.name}'s email is already verified.` });
      }

      const token = crypto.randomBytes(32).toString('hex');
      admin.verificationToken = token;
      admin.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      const origin = getRequestOrigin(req);
      await EmailService.sendVerificationEmail(admin.email, admin.name, token, origin);

      logAudit(req, 'ADMIN_VERIFICATION_RESENT', 'Admins', `Resent 1-click verification email to ${admin.email}`, admin.id, 'success');

      return res.json({
        success: true,
        message: `1-Click verification email dispatched to ${admin.email}`
      });
    } catch (err: any) {
      console.error('Resend verification error:', err);
      return res.status(500).json({ success: false, message: 'Failed to dispatch verification email.' });
    }
  }

  // POST /api/admins/:id/verify-now (Super Admin instant verification & activation)
  static async verifyNow(req: AuthenticatedRequest, res: Response) {
    try {
      const admin = db.admins.find(a => a.id === req.params.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Administrator not found.' });
      }

      admin.isEmailVerified = true;
      admin.isActive = true;
      admin.verificationToken = undefined;
      admin.verificationOtp = undefined;
      admin.verificationTokenExpires = undefined;
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      logAudit(req, 'ADMIN_MANUALLY_VERIFIED', 'Admins', `Super Admin directly verified & activated account for "${admin.name}" (${admin.email})`, admin.id, 'success');

      const { passwordHash: _, ...safeAdmin } = admin;
      return res.json({
        success: true,
        message: `Account for ${admin.name} (${admin.email}) verified and activated successfully! They can log in immediately.`,
        admin: safeAdmin
      });
    } catch (err: any) {
      console.error('Verify now error:', err);
      return res.status(500).json({ success: false, message: 'Failed to verify administrator.' });
    }
  }
}
