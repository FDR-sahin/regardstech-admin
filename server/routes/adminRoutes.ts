import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';

export const adminRouter = Router();

// SMTP configuration (Super Admin only)
adminRouter.get('/settings/smtp', authenticate, requireRole('super_admin'), AdminController.getSmtpSettings);
adminRouter.post('/settings/smtp', authenticate, requireRole('super_admin'), AdminController.saveSmtpSettings);
adminRouter.post('/settings/smtp/test', authenticate, requireRole('super_admin'), AdminController.sendTestSmtpEmail);

adminRouter.get('/', authenticate, requireRole('super_admin'), AdminController.getAll);
adminRouter.get('/:id', authenticate, requireRole('super_admin'), AdminController.getById);
adminRouter.post('/', authenticate, requireRole('super_admin'), AdminController.create);
adminRouter.post('/:id/resend-verification', authenticate, requireRole('super_admin'), AdminController.resendVerificationLink);
adminRouter.post('/:id/verify-now', authenticate, requireRole('super_admin'), AdminController.verifyNow);
adminRouter.put('/:id', authenticate, requireRole('super_admin'), AdminController.update);
adminRouter.delete('/:id', authenticate, requireRole('super_admin'), AdminController.delete);
