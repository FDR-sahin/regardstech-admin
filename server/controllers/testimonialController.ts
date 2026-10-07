import { Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { ITestimonial } from '../models/types.js';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';

export class TestimonialController {
  // GET /api/testimonials
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, status, rating } = req.query;

    let results = [...db.testimonials];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(t =>
        t.clientName.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.review.toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      results = results.filter(t => t.status === status);
    }

    if (rating && rating !== 'all') {
      results = results.filter(t => t.rating === parseInt(String(rating), 10));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      count: results.length,
      testimonials: results
    });
  }

  // GET /api/testimonials/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const testimonial = db.testimonials.find(t => t.id === req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }
    return res.json({ success: true, testimonial });
  }

  // POST /api/testimonials
  static create(req: AuthenticatedRequest, res: Response) {
    try {
      const { clientName, clientPhoto, position, company, review, rating, status } = req.body;

      if (!clientName || !company || !review) {
        return res.status(400).json({ success: false, message: 'Client name, company, and review are required.' });
      }

      const newTestimonial: ITestimonial = {
        id: `test_${Date.now()}`,
        clientName: String(clientName).trim(),
        clientPhoto: clientPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
        position: String(position || 'Executive Leader').trim(),
        company: String(company).trim(),
        review: String(review).trim(),
        rating: Math.min(5, Math.max(1, parseInt(String(rating), 10) || 5)),
        status: status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.testimonials.unshift(newTestimonial);
      dbManager.save();

      logAudit(req, 'TESTIMONIAL_CREATED', 'Testimonials', `Added review from "${newTestimonial.clientName}"`, newTestimonial.id, 'success');

      return res.status(201).json({
        success: true,
        message: 'Testimonial created successfully.',
        testimonial: newTestimonial
      });
    } catch (err) {
      console.error('Create testimonial error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create testimonial.' });
    }
  }

  // PUT /api/testimonials/:id
  static update(req: AuthenticatedRequest, res: Response) {
    try {
      const testimonial = db.testimonials.find(t => t.id === req.params.id);
      if (!testimonial) {
        return res.status(404).json({ success: false, message: 'Testimonial not found.' });
      }

      Object.assign(testimonial, req.body, { updatedAt: new Date().toISOString() });
      dbManager.save();

      logAudit(req, 'TESTIMONIAL_UPDATED', 'Testimonials', `Updated review from "${testimonial.clientName}"`, testimonial.id, 'success');

      return res.json({
        success: true,
        message: 'Testimonial updated successfully.',
        testimonial
      });
    } catch (err) {
      console.error('Update testimonial error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update testimonial.' });
    }
  }

  // DELETE /api/testimonials/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const index = db.testimonials.findIndex(t => t.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Testimonial not found.' });
      }

      const deleted = db.testimonials.splice(index, 1)[0];
      dbManager.save();

      logAudit(req, 'TESTIMONIAL_DELETED', 'Testimonials', `Deleted review from "${deleted.clientName}"`, deleted.id, 'success');

      return res.json({
        success: true,
        message: `Testimonial from "${deleted.clientName}" deleted successfully.`
      });
    } catch (err) {
      console.error('Delete testimonial error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete testimonial.' });
    }
  }
}
