import { Router } from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export const projectRouter = Router();

projectRouter.get('/', authenticate, requirePermission('projects', 'view'), ProjectController.getAll);
projectRouter.get('/:id', authenticate, requirePermission('projects', 'view'), ProjectController.getById);
projectRouter.post('/', authenticate, requirePermission('projects', 'create'), ProjectController.create);
projectRouter.put('/:id', authenticate, requirePermission('projects', 'edit'), ProjectController.update);
projectRouter.delete('/:id', authenticate, requirePermission('projects', 'delete'), ProjectController.delete);
