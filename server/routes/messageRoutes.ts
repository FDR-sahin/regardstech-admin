import { Router } from 'express';
import { MessageController } from '../controllers/messageController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export const messageRouter = Router();

messageRouter.get('/', authenticate, requirePermission('messages', 'view'), MessageController.getAll);
messageRouter.get('/:id', authenticate, requirePermission('messages', 'view'), MessageController.getById);
messageRouter.patch('/:id/status', authenticate, requirePermission('messages', 'markRead'), MessageController.updateStatus);
messageRouter.post('/:id/reply', authenticate, requirePermission('messages', 'markRead'), MessageController.reply);
messageRouter.delete('/:id', authenticate, requirePermission('messages', 'delete'), MessageController.delete);
