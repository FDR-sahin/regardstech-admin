import { Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { IService } from '../models/types.js';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export class ServiceController {
  // GET /api/services
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, status } = req.query;

    let results = [...db.services];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.shortDescription.toLowerCase().includes(q) ||
        s.features.some(f => f.toLowerCase().includes(q))
      );
    }

    if (status && status !== 'all') {
      results = results.filter(s => s.status === status);
    }

    results.sort((a, b) => a.order - b.order);

    return res.json({
      success: true,
      count: results.length,
      services: results
    });
  }

  // GET /api/services/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const service = db.services.find(s => s.id === req.params.id);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    return res.json({ success: true, service });
  }

  // POST /api/services
  static create(req: AuthenticatedRequest, res: Response) {
    try {
      const { name, slug, icon, shortDescription, fullDescription, features, status, seoTitle, seoDescription } = req.body;

      if (!name || !shortDescription) {
        return res.status(400).json({ success: false, message: 'Service name and short description are required.' });
      }

      const generatedSlug = slugify(slug || name);
      const existingSlug = db.services.find(s => s.slug === generatedSlug);
      const finalSlug = existingSlug ? `${generatedSlug}-${Date.now()}` : generatedSlug;

      const maxOrder = db.services.reduce((max, s) => Math.max(max, s.order || 0), 0);

      const newService: IService = {
        id: `srv_${Date.now()}`,
        name: String(name).trim(),
        slug: finalSlug,
        icon: icon || 'Code',
        shortDescription: String(shortDescription).trim(),
        fullDescription: fullDescription ? String(fullDescription).trim() : '',
        features: Array.isArray(features) ? features : [],
        order: maxOrder + 1,
        status: status || 'active',
        seoTitle: seoTitle ? String(seoTitle).trim() : undefined,
        seoDescription: seoDescription ? String(seoDescription).trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.services.push(newService);
      dbManager.save();

      logAudit(req, 'SERVICE_CREATED', 'Services', `Created service "${newService.name}"`, newService.id, 'success');

      return res.status(201).json({
        success: true,
        message: 'Service created successfully.',
        service: newService
      });
    } catch (err) {
      console.error('Create service error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create service.' });
    }
  }

  // PUT /api/services/reorder
  static reorder(req: AuthenticatedRequest, res: Response) {
    try {
      const { serviceIds } = req.body;
      if (!Array.isArray(serviceIds)) {
        return res.status(400).json({ success: false, message: 'serviceIds array is required.' });
      }

      serviceIds.forEach((id: string, index: number) => {
        const s = db.services.find(item => item.id === id);
        if (s) {
          s.order = index + 1;
          s.updatedAt = new Date().toISOString();
        }
      });

      dbManager.save();
      logAudit(req, 'SERVICES_REORDERED', 'Services', `Reordered ${serviceIds.length} services`, undefined, 'success');

      return res.json({ success: true, message: 'Services reordered successfully.' });
    } catch (err) {
      return res.status(500).json({ success: false, message: 'Failed to reorder services.' });
    }
  }

  // PUT /api/services/:id
  static update(req: AuthenticatedRequest, res: Response) {
    try {
      const service = db.services.find(s => s.id === req.params.id);
      if (!service) {
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }

      const updates = req.body;
      if (updates.slug && updates.slug !== service.slug) {
        const slugExists = db.services.find(s => s.slug === updates.slug && s.id !== service.id);
        if (slugExists) {
          updates.slug = `${updates.slug}-${Date.now()}`;
        }
      }

      Object.assign(service, updates, { updatedAt: new Date().toISOString() });
      dbManager.save();

      logAudit(req, 'SERVICE_UPDATED', 'Services', `Updated service "${service.name}"`, service.id, 'success');

      return res.json({
        success: true,
        message: 'Service updated successfully.',
        service
      });
    } catch (err) {
      console.error('Update service error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update service.' });
    }
  }

  // DELETE /api/services/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const index = db.services.findIndex(s => s.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Service not found.' });
      }

      const deleted = db.services.splice(index, 1)[0];
      dbManager.save();

      logAudit(req, 'SERVICE_DELETED', 'Services', `Deleted service "${deleted.name}"`, deleted.id, 'success');

      return res.json({
        success: true,
        message: `Service "${deleted.name}" deleted successfully.`
      });
    } catch (err) {
      console.error('Delete service error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete service.' });
    }
  }
}
