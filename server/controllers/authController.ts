import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { db, dbManager } from '../config/db.js';
import { EmailService, getRequestOrigin } from '../services/emailService.js';
import { AuthenticatedRequest, logAudit, resetAuthRateLimit, JWT_SECRET } from '../middleware/auth.js';

// Password complexity validator
export function validatePassword(password: string): { isValid: boolean; message?: string } {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long.' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
  }
  if (!/[a-z]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
  }
  if (!/[0-9]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number.' };
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character.' };
  }
  return { isValid: true };
}

export class AuthController {
  // 1. LOGIN
  static async login(req: Request, res: Response) {
    try {
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (!admin) {
        return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid email address or password.' });
      }

      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your administrator account has been suspended or deactivated. Contact Super Admin.'
        });
      }

      if (!admin.isEmailVerified) {
        // Generate fresh verification token
        const token = crypto.randomBytes(32).toString('hex');
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        admin.verificationOtp = otp;
        admin.verificationToken = token;
        admin.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
        dbManager.save();

        const origin = getRequestOrigin(req);
        await EmailService.sendVerificationEmail(admin.email, admin.name, token, origin);

        return res.status(403).json({
          success: false,
          message: 'Your administrator account is pending email verification. A 1-click verification link has been sent to your Gmail. Please click the link in your email to activate your account.',
          needsEmailVerification: true,
          email: admin.email
        });
      }

      // Success: Credentials verified! Dispatch 6-digit Login OTP to user's email
      resetAuthRateLimit(req);

      const loginOtp = Math.floor(100000 + Math.random() * 900000).toString();
      admin.loginOtp = loginOtp;
      admin.loginOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      await EmailService.sendLoginOtp(admin.email, admin.name, loginOtp);

      return res.json({
        success: true,
        requireOtp: true,
        message: 'Credentials verified! A 6-digit security OTP code has been dispatched to your email.',
        email: admin.email
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ success: false, message: 'Internal server authentication error.' });
    }
  }

  // 1.1 VERIFY LOGIN OTP AND ISSUE SESSION TOKEN
  static async verifyLoginOtp(req: Request, res: Response) {
    try {
      const { email, otp, rememberMe } = req.body;

      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and 6-digit OTP code are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (!admin || !admin.loginOtp || !admin.loginOtpExpires) {
        return res.status(400).json({ success: false, message: 'No active OTP request found. Please sign in again.' });
      }

      if (Date.now() > admin.loginOtpExpires) {
        admin.loginOtp = undefined;
        admin.loginOtpExpires = undefined;
        dbManager.save();
        return res.status(400).json({ success: false, message: 'OTP code has expired. Please sign in again.' });
      }

      if (String(admin.loginOtp).trim() !== String(otp).trim()) {
        return res.status(400).json({ success: false, message: 'Incorrect 6-digit OTP code.' });
      }

      // OTP is valid! Clear OTP and issue token
      admin.loginOtp = undefined;
      admin.loginOtpExpires = undefined;
      admin.lastLoginAt = new Date().toISOString();
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      // Ensure valid expiresIn with time unit (e.g. '7d' or '30d')
      const envExp = process.env.JWT_EXPIRES_IN || '7d';
      const formattedExp = isNaN(Number(envExp)) ? envExp : `${envExp}d`;
      const expiresIn = rememberMe ? '30d' : formattedExp;
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: expiresIn as jwt.SignOptions['expiresIn'] }
      );

      // Set secure HTTP-only cookie
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: rememberMe ? 30 * 86400000 : 7 * 86400000
      });

      // Log audit
      (req as AuthenticatedRequest).admin = admin;
      logAudit(
        req as AuthenticatedRequest,
        'ADMIN_LOGIN',
        'Auth',
        `Admin logged in successfully via OTP (${admin.email})`,
        admin.id,
        'success'
      );

      return res.json({
        success: true,
        message: 'Authentication successful. Welcome to Regards Tech Admin Panel!',
        token,
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
          avatarUrl: admin.avatarUrl,
          isEmailVerified: admin.isEmailVerified,
          lastLoginAt: admin.lastLoginAt
        }
      });
    } catch (err) {
      console.error('Verify login OTP error:', err);
      return res.status(500).json({ success: false, message: 'Internal error verifying login OTP.' });
    }
  }

  // 2. GET CURRENT AUTHENTICATED ADMIN
  static async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.admin) {
      return res.status(401).json({ success: false, message: 'Unauthorized session.' });
    }

    return res.json({
      success: true,
      admin: {
        id: req.admin.id,
        name: req.admin.name,
        email: req.admin.email,
        role: req.admin.role,
        permissions: req.admin.permissions,
        avatarUrl: req.admin.avatarUrl,
        isEmailVerified: req.admin.isEmailVerified,
        lastLoginAt: req.admin.lastLoginAt,
        createdAt: req.admin.createdAt
      }
    });
  }

  // 3. LOGOUT
  static async logout(req: AuthenticatedRequest, res: Response) {
    res.clearCookie('admin_token');
    if (req.admin) {
      logAudit(req, 'ADMIN_LOGOUT', 'Auth', `Admin signed out (${req.admin.email})`, req.admin.id, 'success');
    }
    return res.json({ success: true, message: 'Logged out successfully.' });
  }

  // 4. FORGOT PASSWORD (OTP GENERATION)
  static async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      // Protect against enumeration with friendly response
      if (!admin) {
        return res.json({
          success: true,
          message: 'If the email is registered as an administrator, a 6-digit OTP code has been dispatched.'
        });
      }

      // Generate 6-digit secure numeric OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 8);

      admin.resetPasswordOtp = hashedOtp;
      admin.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
      admin.resetPasswordAttempts = 0;
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      // Dispatch Email
      await EmailService.sendPasswordResetOtp(admin.email, admin.name, otp);

      // Audit Log
      logAudit(
        req as AuthenticatedRequest,
        'PASSWORD_RESET_REQUESTED',
        'Auth',
        `Password reset OTP generated for ${admin.email}`,
        admin.id,
        'success'
      );

      return res.json({
        success: true,
        message: 'A 6-digit verification code has been dispatched to your email address (valid for 10 minutes).'
      });
    } catch (err) {
      console.error('Forgot password error:', err);
      return res.status(500).json({ success: false, message: 'Failed to process password reset request.' });
    }
  }

  // 5. VERIFY OTP
  static async verifyOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      if (!email || !otp) {
        return res.status(400).json({ success: false, message: 'Email and OTP code are required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (!admin || !admin.resetPasswordOtp || !admin.resetPasswordExpires) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP session. Please request a new code.' });
      }

      if (Date.now() > admin.resetPasswordExpires) {
        admin.resetPasswordOtp = undefined;
        admin.resetPasswordExpires = undefined;
        dbManager.save();
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new code.' });
      }

      if ((admin.resetPasswordAttempts || 0) >= 5) {
        admin.resetPasswordOtp = undefined;
        admin.resetPasswordExpires = undefined;
        dbManager.save();
        return res.status(429).json({ success: false, message: 'Too many incorrect attempts. OTP invalidated.' });
      }

      const isMatch = await bcrypt.compare(String(otp).trim(), admin.resetPasswordOtp);
      if (!isMatch) {
        admin.resetPasswordAttempts = (admin.resetPasswordAttempts || 0) + 1;
        dbManager.save();
        return res.status(400).json({ success: false, message: 'Incorrect OTP code.' });
      }

      return res.json({
        success: true,
        message: 'OTP verified successfully. You may now create a new password.'
      });
    } catch (err) {
      console.error('Verify OTP error:', err);
      return res.status(500).json({ success: false, message: 'Error verifying OTP.' });
    }
  }

  // 6. RESET PASSWORD
  static async resetPassword(req: Request, res: Response) {
    try {
      const { email, otp, newPassword, confirmPassword } = req.body;

      if (!email || !otp || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All fields are required.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'Passwords do not match.' });
      }

      const val = validatePassword(newPassword);
      if (!val.isValid) {
        return res.status(400).json({ success: false, message: val.message });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (!admin || !admin.resetPasswordOtp || !admin.resetPasswordExpires) {
        return res.status(400).json({ success: false, message: 'Invalid or expired OTP session.' });
      }

      if (Date.now() > admin.resetPasswordExpires) {
        return res.status(400).json({ success: false, message: 'OTP has expired.' });
      }

      const isMatch = await bcrypt.compare(String(otp).trim(), admin.resetPasswordOtp);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(newPassword, salt);
      admin.resetPasswordOtp = undefined;
      admin.resetPasswordExpires = undefined;
      admin.resetPasswordAttempts = 0;
      admin.isEmailVerified = true;
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      logAudit(
        req as AuthenticatedRequest,
        'PASSWORD_RESET_SUCCESS',
        'Auth',
        `Password was reset using OTP for ${admin.email}`,
        admin.id,
        'success'
      );

      return res.json({
        success: true,
        message: 'Password updated successfully. You can now log in with your new credentials.'
      });
    } catch (err) {
      console.error('Reset password error:', err);
      return res.status(500).json({ success: false, message: 'Failed to reset password.' });
    }
  }

  // 7. CHANGE PASSWORD
  static async changePassword(req: AuthenticatedRequest, res: Response) {
    try {
      const { currentPassword, newPassword, confirmPassword } = req.body;

      if (!currentPassword || !newPassword || !confirmPassword) {
        return res.status(400).json({ success: false, message: 'All password fields are required.' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ success: false, message: 'New password and confirmation do not match.' });
      }

      const val = validatePassword(newPassword);
      if (!val.isValid) {
        return res.status(400).json({ success: false, message: val.message });
      }

      const admin = db.admins.find(a => a.id === req.admin!.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }

      const isMatch = await bcrypt.compare(currentPassword, admin.passwordHash);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
      }

      const salt = await bcrypt.genSalt(10);
      admin.passwordHash = await bcrypt.hash(newPassword, salt);
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      logAudit(req, 'PASSWORD_CHANGED', 'Auth', `Admin changed password (${admin.email})`, admin.id, 'success');

      return res.json({ success: true, message: 'Password changed successfully.' });
    } catch (err) {
      console.error('Change password error:', err);
      return res.status(500).json({ success: false, message: 'Failed to change password.' });
    }
  }

  // 7.1 UPDATE PROFILE (Name, Email, Avatar)
  static async updateProfile(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, email, avatarUrl } = req.body;
      const admin = db.admins.find(a => a.id === req.admin!.id);
      if (!admin) {
        return res.status(404).json({ success: false, message: 'Admin not found.' });
      }

      if (name && String(name).trim()) {
        admin.name = String(name).trim();
      }

      if (avatarUrl) {
        admin.avatarUrl = avatarUrl;
      }

      if (email && String(email).trim()) {
        const cleanEmail = String(email).trim().toLowerCase();
        if (cleanEmail !== admin.email.toLowerCase()) {
          const emailExists = db.admins.find(a => a.id !== admin.id && a.email.toLowerCase() === cleanEmail);
          if (emailExists) {
            return res.status(400).json({ success: false, message: 'This email is already in use by another administrator.' });
          }
          const oldEmail = admin.email;
          admin.email = cleanEmail;
          admin.isEmailVerified = true;
          logAudit(req, 'EMAIL_CHANGED', 'Auth', `Admin email changed from ${oldEmail} to ${cleanEmail}`, admin.id, 'success');
        }
      }

      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      // Issue fresh JWT token with updated email
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 86400000
      });

      logAudit(req, 'PROFILE_UPDATED', 'Auth', `Admin updated profile details (${admin.email})`, admin.id, 'success');

      const { passwordHash, resetPasswordOtp, loginOtp, verificationToken, ...safeAdmin } = admin;
      return res.json({
        success: true,
        message: 'Profile and email updated successfully.',
        admin: safeAdmin
      });
    } catch (err) {
      console.error('Update profile error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update profile.' });
    }
  }

  // 8. VERIFY EMAIL
  static async verifyEmail(req: Request, res: Response) {
    try {
      const { token, otp, email } = req.body;

      let admin = null;
      if (token) {
        admin = db.admins.find(a => a.verificationToken === token);
        if (admin && admin.verificationTokenExpires && Date.now() > Number(admin.verificationTokenExpires)) {
          return res.status(400).json({ success: false, message: 'Verification link has expired. Please request a new code.' });
        }
      } else if (otp && email) {
        const cleanEmail = String(email).trim().toLowerCase();
        admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);
        if (admin) {
          if (!admin.verificationOtp || String(admin.verificationOtp).trim() !== String(otp).trim()) {
            return res.status(400).json({ success: false, message: 'Invalid 6-digit verification code.' });
          }
          if (admin.verificationTokenExpires && Date.now() > Number(admin.verificationTokenExpires)) {
            return res.status(400).json({ success: false, message: 'Verification code has expired. Please request a new code.' });
          }
        }
      } else if (email) {
        admin = db.admins.find(a => a.email.toLowerCase() === String(email).trim().toLowerCase());
      }

      if (!admin) {
        return res.status(400).json({ success: false, message: 'Invalid verification code or unregistered email.' });
      }

      admin.isEmailVerified = true;
      admin.verificationToken = undefined;
      admin.verificationOtp = undefined;
      admin.verificationTokenExpires = undefined;
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      logAudit(req as AuthenticatedRequest, 'EMAIL_VERIFIED', 'Auth', `Email verified for ${admin.email}`, admin.id, 'success');

      return res.json({
        success: true,
        message: 'Email verified successfully! You may now sign in to your Regards Tech admin account.'
      });
    } catch (err) {
      console.error('Verify email error:', err);
      return res.status(500).json({ success: false, message: 'Error verifying email.' });
    }
  }

  // 8.1 ONE-CLICK EMAIL VERIFICATION LINK (Clicked directly in Gmail)
  static async verifyLinkOneClick(req: Request, res: Response) {
    try {
      const token = String(req.query.token || '').trim();
      if (!token) {
        return res.redirect('/?error=missing_token');
      }

      const admin = db.admins.find(a => a.verificationToken === token);
      if (!admin) {
        return res.redirect('/?verified=true&email=' + encodeURIComponent(''));
      }

      if (admin.verificationTokenExpires && Date.now() > Number(admin.verificationTokenExpires)) {
        return res.redirect('/?error=expired_token&email=' + encodeURIComponent(admin.email));
      }

      admin.isEmailVerified = true;
      admin.verificationToken = undefined;
      admin.verificationOtp = undefined;
      admin.verificationTokenExpires = undefined;
      admin.updatedAt = new Date().toISOString();
      dbManager.save();

      logAudit(req as AuthenticatedRequest, 'EMAIL_VERIFIED_1CLICK', 'Auth', `1-Click verification for ${admin.email}`, admin.id, 'success');

      return res.redirect(`/?verified=true&email=${encodeURIComponent(admin.email)}`);
    } catch (err) {
      console.error('Verify link error:', err);
      return res.redirect('/?error=verification_failed');
    }
  }

  // 9. RESEND VERIFICATION
  static async resendVerification(req: Request, res: Response) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required.' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (!admin) {
        return res.json({ success: true, message: 'If the email exists, a verification link and code have been resent.' });
      }

      if (admin.isEmailVerified) {
        return res.json({ success: true, message: 'This email is already verified. You can log in directly.' });
      }

      const token = crypto.randomBytes(32).toString('hex');
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      admin.verificationToken = token;
      admin.verificationOtp = otp;
      admin.verificationTokenExpires = Date.now() + 24 * 60 * 60 * 1000;
      dbManager.save();

      const origin = getRequestOrigin(req);
      await EmailService.sendVerificationEmail(admin.email, admin.name, token, origin);

      return res.json({
        success: true,
        message: 'A fresh 1-click verification link has been dispatched to your Gmail inbox.'
      });
    } catch (err) {
      console.error('Resend verification error:', err);
      return res.status(500).json({ success: false, message: 'Failed to resend verification email.' });
    }
  }

  // 10. NEXTAUTH CREDENTIALS VERIFIER
  static async nextAuthVerify(req: Request, res: Response) {
    try {
      const { email, password, apiKey } = req.body;

      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password required' });
      }

      const cleanEmail = String(email).trim().toLowerCase();
      const admin = db.admins.find(a => a.email.toLowerCase() === cleanEmail);

      if (!admin || !admin.isActive || !admin.isEmailVerified) {
        return res.status(401).json({ success: false, message: 'Invalid credentials or inactive account' });
      }

      const isMatch = await bcrypt.compare(password, admin.passwordHash);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      return res.json({
        success: true,
        user: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
          image: admin.avatarUrl
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Internal error' });
    }
  }
}
