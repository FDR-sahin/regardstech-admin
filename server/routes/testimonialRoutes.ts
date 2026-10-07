import { Router } from 'express';
import { TestimonialController } from '../controllers/testimonialController.js';
import { authenticate, requirePermission } from '../middleware/auth.js';

export const testimonialRouter = Router();

testimonialRouter.get('/', authenticate, requirePermission('testimonials', 'view'), TestimonialController.getAll);
testimonialRouter.get('/:id', authenticate, requirePermission('testimonials', 'view'), TestimonialController.getById);
testimonialRouter.post('/', authenticate, requirePermission('testimonials', 'create'), TestimonialController.create);
testimonialRouter.put('/:id', authenticate, requirePermission('testimonials', 'edit'), TestimonialController.update);
testimonialRouter.delete('/:id', authenticate, requirePermission('testimonials', 'delete'), TestimonialController.delete);
