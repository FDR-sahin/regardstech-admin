import { Router } from 'express';
import { CaseStudyController } from '../controllers/caseStudyController.js';
import { authenticate, checkPermission } from '../middleware/auth.js';

export const caseStudyRouter = Router();

// Public routes (for Next.js website)
caseStudyRouter.get('/public/case-studies', CaseStudyController.getPublic);

// Admin routes (requires authentication & permission)
caseStudyRouter.get('/case-studies', authenticate, checkPermission('projects', 'view'), CaseStudyController.getAll);
caseStudyRouter.get('/case-studies/:id', authenticate, checkPermission('projects', 'view'), CaseStudyController.getById);
caseStudyRouter.post('/case-studies', authenticate, checkPermission('projects', 'create'), CaseStudyController.create);
caseStudyRouter.put('/case-studies/:id', authenticate, checkPermission('projects', 'edit'), CaseStudyController.update);
caseStudyRouter.delete('/case-studies/:id', authenticate, checkPermission('projects', 'delete'), CaseStudyController.delete);
