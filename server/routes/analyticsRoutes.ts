import { Router } from 'express';
import { AnalyticsController } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/auth.js';

export const analyticsRouter = Router();

analyticsRouter.get('/dashboard', authenticate, AnalyticsController.getDashboard);
analyticsRouter.post('/track', AnalyticsController.trackEvent);
analyticsRouter.post('/duration', AnalyticsController.updateDuration);
