import { Router } from 'express';
import { BlogController } from '../controllers/blogController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export const blogRouter = Router();

blogRouter.get('/', authenticate, requirePermission('blogs', 'view'), BlogController.getAll);
blogRouter.get('/:id', authenticate, requirePermission('blogs', 'view'), BlogController.getById);
blogRouter.post('/', authenticate, requirePermission('blogs', 'create'), BlogController.create);
blogRouter.put('/:id', authenticate, requirePermission('blogs', 'edit'), BlogController.update);
blogRouter.delete('/:id', authenticate, requirePermission('blogs', 'delete'), BlogController.delete);
