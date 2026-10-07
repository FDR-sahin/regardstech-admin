import { Response } from 'express';
import { db } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export class AuditController {
  // GET /api/audit-logs
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, module: mod, status, page = '1', limit = '15' } = req.query;

    let results = [...db.auditLogs];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(l =>
        l.action.toLowerCase().includes(q) ||
        l.details.toLowerCase().includes(q) ||
        l.adminName.toLowerCase().includes(q) ||
        l.adminEmail.toLowerCase().includes(q) ||
        (l.ip && l.ip.toLowerCase().includes(q))
      );
    }

    if (mod && mod !== 'all') {
      results = results.filter(l => l.module === mod);
    }

    if (status && status !== 'all') {
      results = results.filter(l => l.status === status);
    }

    results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = results.length;
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, parseInt(String(limit), 10) || 15);
    const startIndex = (p - 1) * l;
    const paginated = results.slice(startIndex, startIndex + l);

    const modules = Array.from(new Set(db.auditLogs.map(l => l.module)));

    return res.json({
      success: true,
      logs: paginated,
      modules,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      }
    });
  }
}
