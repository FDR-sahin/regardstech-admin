import { Router } from 'express';
import { PublicController } from '../controllers/publicController.js';

export const publicRouter = Router();

// Company overview & site metadata
publicRouter.get('/company', PublicController.getCompanyInfo);

// Published projects for https://regardstech.com
publicRouter.get('/projects', PublicController.getProjects);
publicRouter.get('/projects/:slug', PublicController.getProjectBySlug);

// Active services
publicRouter.get('/services', PublicController.getServices);
publicRouter.get('/services/:slug', PublicController.getServiceBySlug);

// Client testimonials
publicRouter.get('/testimonials', PublicController.getTestimonials);
publicRouter.post('/testimonials', PublicController.submitTestimonial);

// Interactive Case Studies
publicRouter.get('/case-studies', PublicController.getCaseStudies);
publicRouter.post('/case-studies', PublicController.submitCaseStudy);

// Published blogs & frontend blog submission
publicRouter.get('/blogs', PublicController.getBlogs);
publicRouter.get('/blogs/:slug', PublicController.getBlogBySlug);
publicRouter.post('/blogs', PublicController.submitBlog);

// Public contact form submission & consultation booking
publicRouter.post('/contact', PublicController.submitContact);
