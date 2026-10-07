import { Router } from 'express';
import { AuditController } from '../controllers/auditController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const auditRouter = Router();

auditRouter.get('/', authenticate, requireRole('super_admin'), AuditController.getAll);
