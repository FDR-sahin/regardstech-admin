import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db, dbManager } from '../config/db.js';
import { IAdmin, AdminPermissions } from '../models/types.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'regards_tech_jwt_secret_key_prod_2026_default';

export interface AuthenticatedRequest extends Request {
  admin?: IAdmin;
}

// In-memory rate limiting map for login / OTP attempts: IP/email -> { count, lastAttempt }
interface RateLimitRecord {
  count: number;
  firstAttempt: number;
  blockedUntil?: number;
}
const authRateLimits = new Map<string, RateLimitRecord>();

export function authRateLimiter(maxAttempts = 5, windowMs = 15 * 60 * 1000) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip || 'ip'}_${req.body?.email || 'anon'}`;
    const now = Date.now();
    const record = authRateLimits.get(key);

    if (record) {
      if (record.blockedUntil && now < record.blockedUntil) {
        const remainingMinutes = Math.ceil((record.blockedUntil - now) / 60000);
        return res.status(429).json({
          success: false,
          message: `Too many failed attempts. This endpoint is locked for ${remainingMinutes} more minutes for your security.`
        });
      }

      if (now - record.firstAttempt > windowMs) {
        // Reset window
        authRateLimits.set(key, { count: 1, firstAttempt: now });
      } else {
        record.count += 1;
        if (record.count > maxAttempts) {
          record.blockedUntil = now + windowMs;
          return res.status(429).json({
            success: false,
            message: 'Too many attempts. Account access temporarily blocked for 15 minutes.'
          });
        }
      }
    } else {
      authRateLimits.set(key, { count: 1, firstAttempt: now });
    }

    next();
  };
}

export function resetAuthRateLimit(req: Request) {
  const key = `${req.ip || 'ip'}_${req.body?.email || 'anon'}`;
  authRateLimits.delete(key);
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  let token = '';

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.admin_token) {
    token = req.cookies.admin_token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token missing. Please sign in.'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const admin = db.admins.find(a => a.id === decoded.id);

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Admin account not found.'
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your administrator account has been deactivated. Please contact Super Admin.'
      });
    }

    if (!admin.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Email address is not verified. Please verify your email before logging in.',
        needsEmailVerification: true,
        email: admin.email
      });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired session. Please sign in again.'
    });
  }
}

export function requireRole(role: 'super_admin' | 'admin') {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.admin || req.admin.role !== role) {
      return res.status(403).json({
        success: false,
        message: `Access denied: ${role} privileges required.`
      });
    }
    next();
  };
}

export function requireSuperAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requireRole('super_admin')(req, res, next);
}

export function requirePermission<M extends keyof AdminPermissions, A extends keyof AdminPermissions[M]>(
  module: M,
  action: A
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const admin = req.admin;
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (admin.role === 'super_admin') {
      return next();
    }

    const modulePerms = admin.permissions[module] as Record<string, boolean>;
    if (modulePerms && modulePerms[action as string]) {
      return next();
    }

    return res.status(403).json({
      success: false,
      message: `Access denied: You do not have permission to perform '${String(action)}' on '${String(module)}'.`
    });
  };
}

export const checkPermission = requirePermission;

export function logAudit(
  req: AuthenticatedRequest,
  action: string,
  module: string,
  details: string,
  recordId?: string,
  status: 'success' | 'failure' = 'success'
) {
  try {
    const admin = req?.admin;
    const rawIp = req?.headers ? (req.headers['x-forwarded-for'] as string) : undefined;
    const ip = rawIp || req?.ip || '127.0.0.1';

    const auditEntry = {
      id: `aud_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      adminId: admin ? admin.id : 'system',
      adminEmail: admin ? admin.email : 'system',
      adminName: admin ? admin.name : 'System',
      action,
      module,
      recordId,
      details,
      status,
      ip: typeof ip === 'string' ? ip : '127.0.0.1',
      timestamp: new Date().toISOString()
    };

    if (db && db.auditLogs) {
      db.auditLogs.unshift(auditEntry);
      if (db.auditLogs.length > 500) {
        db.auditLogs.pop();
      }
      dbManager.save();
    }
  } catch (err) {
    console.warn('logAudit non-fatal warning:', err);
  }
}
