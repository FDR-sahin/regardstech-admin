import { Request, Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { ICaseStudy } from '../models/types.js';
import { AuthenticatedRequest, logAudit } from '../middleware/auth.js';

export class CaseStudyController {
  // GET /api/public/case-studies (Public API for website)
  static getPublic(req: Request, res: Response) {
    const list = (db.caseStudies || [])
      .filter(c => c.status === 'published')
      .sort((a, b) => a.order - b.order);

    return res.json({
      success: true,
      caseStudies: list
    });
  }

  // GET /api/case-studies (Admin list)
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, category, status } = req.query;

    let results = [...(db.caseStudies || [])];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(c =>
        c.title.toLowerCase().includes(q) ||
        c.subtitle.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.tags && c.tags.some(t => t.toLowerCase().includes(q)))
      );
    }

    if (category && category !== 'all') {
      results = results.filter(c => c.category === category);
    }

    if (status && status !== 'all') {
      results = results.filter(c => c.status === status);
    }

    results.sort((a, b) => a.order - b.order);

    return res.json({
      success: true,
      caseStudies: results,
      total: results.length
    });
  }

  // GET /api/case-studies/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const item = (db.caseStudies || []).find(c => c.id === id || c.key === id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Case study not found.' });
    }
    return res.json({ success: true, caseStudy: item });
  }

  // POST /api/case-studies
  static create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        key,
        title,
        subtitle,
        category,
        image,
        link,
        tags,
        accent,
        client,
        metrics,
        overview,
        challenge,
        solution,
        results,
        status = 'published'
      } = req.body;

      if (!title) {
        return res.status(400).json({ success: false, message: 'Case study title is required.' });
      }

      if (!db.caseStudies) {
        db.caseStudies = [];
      }

      const cleanKey = (key || title).toLowerCase().replace(/[^a-z0-9]/g, '');
      const existing = db.caseStudies.find(c => c.key === cleanKey);
      if (existing) {
        return res.status(400).json({ success: false, message: 'A case study with this key or title already exists.' });
      }

      const now = new Date().toISOString();
      const newCaseStudy: ICaseStudy = {
        id: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        key: cleanKey,
        title: title.trim(),
        subtitle: subtitle ? subtitle.trim() : '',
        category: category || 'General',
        image: image || 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        link: link ? link.trim() : '',
        tags: Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        accent: accent || '#2563EB',
        client: client ? client.trim() : '',
        metrics: Array.isArray(metrics) ? metrics : [],
        overview: overview || '',
        challenge: challenge || '',
        solution: solution || '',
        results: results || '',
        status: status === 'draft' ? 'draft' : 'published',
        order: db.caseStudies.length + 1,
        createdAt: now,
        updatedAt: now
      };

      db.caseStudies.push(newCaseStudy);
      dbManager.save();

      if (req.admin) {
        logAudit(req, 'CREATE_CASE_STUDY', 'CaseStudies', `Created case study "${newCaseStudy.title}"`, newCaseStudy.id, 'success');
      }

      return res.status(201).json({
        success: true,
        message: 'Case study created successfully.',
        caseStudy: newCaseStudy
      });
    } catch (err) {
      console.error('Create case study error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create case study.' });
    }
  }

  // PUT /api/case-studies/:id
  static update(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!db.caseStudies) db.caseStudies = [];

      const idx = db.caseStudies.findIndex(c => c.id === id || c.key === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Case study not found.' });
      }

      const item = db.caseStudies[idx];
      const {
        title,
        subtitle,
        category,
        image,
        link,
        tags,
        accent,
        client,
        metrics,
        overview,
        challenge,
        solution,
        results,
        status,
        order
      } = req.body;

      if (title !== undefined) item.title = title.trim();
      if (subtitle !== undefined) item.subtitle = subtitle.trim();
      if (category !== undefined) item.category = category;
      if (image !== undefined) item.image = image;
      if (link !== undefined) item.link = link.trim();
      if (tags !== undefined) {
        item.tags = Array.isArray(tags) ? tags : typeof tags === 'string' ? tags.split(',').map(t => t.trim()).filter(Boolean) : item.tags;
      }
      if (accent !== undefined) item.accent = accent;
      if (client !== undefined) item.client = client.trim();
      if (metrics !== undefined) item.metrics = metrics;
      if (overview !== undefined) item.overview = overview;
      if (challenge !== undefined) item.challenge = challenge;
      if (solution !== undefined) item.solution = solution;
      if (results !== undefined) item.results = results;
      if (status !== undefined) item.status = status;
      if (order !== undefined) item.order = Number(order);

      item.updatedAt = new Date().toISOString();
      dbManager.save();

      if (req.admin) {
        logAudit(req, 'UPDATE_CASE_STUDY', 'CaseStudies', `Updated case study "${item.title}"`, item.id, 'success');
      }

      return res.json({
        success: true,
        message: 'Case study updated successfully.',
        caseStudy: item
      });
    } catch (err) {
      console.error('Update case study error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update case study.' });
    }
  }

  // DELETE /api/case-studies/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      if (!db.caseStudies) db.caseStudies = [];

      const idx = db.caseStudies.findIndex(c => c.id === id || c.key === id);
      if (idx === -1) {
        return res.status(404).json({ success: false, message: 'Case study not found.' });
      }

      const deleted = db.caseStudies.splice(idx, 1)[0];
      dbManager.save();

      if (req.admin) {
        logAudit(req, 'DELETE_CASE_STUDY', 'CaseStudies', `Deleted case study "${deleted.title}"`, deleted.id, 'success');
      }

      return res.json({
        success: true,
        message: 'Case study deleted successfully.'
      });
    } catch (err) {
      console.error('Delete case study error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete case study.' });
    }
  }
}
