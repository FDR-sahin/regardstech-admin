import { Router } from 'express';
import { MediaController } from '../controllers/mediaController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export const mediaRouter = Router();

mediaRouter.get('/', authenticate, requirePermission('media', 'view'), MediaController.getAll);
mediaRouter.post('/upload', authenticate, requirePermission('media', 'upload'), MediaController.upload);
mediaRouter.delete('/:id', authenticate, requirePermission('media', 'delete'), MediaController.delete);
