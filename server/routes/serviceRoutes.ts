import { Router } from 'express';
import { ServiceController } from '../controllers/serviceController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export const serviceRouter = Router();

serviceRouter.get('/', authenticate, requirePermission('services', 'view'), ServiceController.getAll);
serviceRouter.get('/:id', authenticate, requirePermission('services', 'view'), ServiceController.getById);
serviceRouter.post('/', authenticate, requirePermission('services', 'create'), ServiceController.create);
serviceRouter.put('/reorder', authenticate, requirePermission('services', 'edit'), ServiceController.reorder);
serviceRouter.put('/:id', authenticate, requirePermission('services', 'edit'), ServiceController.update);
serviceRouter.delete('/:id', authenticate, requirePermission('services', 'delete'), ServiceController.delete);
