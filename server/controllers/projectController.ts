import { Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { IProject } from '../models/types.js';
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

export class ProjectController {
  // GET /api/projects
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, category, status, featured, page = '1', limit = '10', sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    let results = [...db.projects];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.shortDescription.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.technologies.some(t => t.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'all') {
      results = results.filter(p => p.category === category);
    }

    if (status && status !== 'all') {
      results = results.filter(p => p.status === status);
    }

    if (featured !== undefined && featured !== 'all') {
      results = results.filter(p => p.featured === (featured === 'true'));
    }

    // Sorting
    results.sort((a, b) => {
      let aVal = (a as unknown as Record<string, unknown>)[String(sortBy)] || '';
      let bVal = (b as unknown as Record<string, unknown>)[String(sortBy)] || '';
      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = results.length;
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, parseInt(String(limit), 10) || 10);
    const startIndex = (p - 1) * l;
    const paginated = results.slice(startIndex, startIndex + l);

    const categories = Array.from(new Set(db.projects.map(pr => pr.category)));

    return res.json({
      success: true,
      projects: paginated,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      },
      categories
    });
  }

  // GET /api/projects/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const project = db.projects.find(p => p.id === req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    return res.json({ success: true, project });
  }

  // POST /api/projects
  static create(req: AuthenticatedRequest, res: Response) {
    try {
      const {
        title,
        slug,
        description,
        shortDescription,
        category,
        technologies,
        clientName,
        projectUrl,
        githubUrl,
        completionDate,
        featured,
        status,
        imageUrl,
        images,
        seoTitle,
        seoDescription
      } = req.body;

      if (!title || !shortDescription || !category || !imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Title, category, short description, and main project image are required.'
        });
      }

      const generatedSlug = slugify(slug || title);
      const existingSlug = db.projects.find(p => p.slug === generatedSlug);
      const finalSlug = existingSlug ? `${generatedSlug}-${Date.now()}` : generatedSlug;

      const newProject: IProject = {
        id: `proj_${Date.now()}`,
        title: String(title).trim(),
        slug: finalSlug,
        shortDescription: String(shortDescription).trim(),
        description: description ? String(description).trim() : '',
        category: String(category).trim(),
        technologies: Array.isArray(technologies) ? technologies : (typeof technologies === 'string' ? technologies.split(',').map(s => s.trim()) : []),
        clientName: clientName ? String(clientName).trim() : undefined,
        projectUrl: projectUrl ? String(projectUrl).trim() : undefined,
        githubUrl: githubUrl ? String(githubUrl).trim() : undefined,
        completionDate: completionDate ? String(completionDate).trim() : undefined,
        featured: Boolean(featured),
        status: status || 'draft',
        imageUrl: String(imageUrl).trim(),
        images: Array.isArray(images) ? images : [],
        seoTitle: seoTitle ? String(seoTitle).trim() : undefined,
        seoDescription: seoDescription ? String(seoDescription).trim() : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.projects.unshift(newProject);
      dbManager.save();

      logAudit(req, 'PROJECT_CREATED', 'Projects', `Created project "${newProject.title}"`, newProject.id, 'success');

      return res.status(201).json({
        success: true,
        message: 'Project created successfully.',
        project: newProject
      });
    } catch (err) {
      console.error('Create project error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create project.' });
    }
  }

  // PUT /api/projects/:id
  static update(req: AuthenticatedRequest, res: Response) {
    try {
      const project = db.projects.find(p => p.id === req.params.id);
      if (!project) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }

      const updates = req.body;
      if (updates.slug && updates.slug !== project.slug) {
        const slugExists = db.projects.find(p => p.slug === updates.slug && p.id !== project.id);
        if (slugExists) {
          updates.slug = `${updates.slug}-${Date.now()}`;
        }
      }

      if (updates.technologies && typeof updates.technologies === 'string') {
        updates.technologies = updates.technologies.split(',').map((s: string) => s.trim());
      }

      Object.assign(project, updates, { updatedAt: new Date().toISOString() });
      dbManager.save();

      logAudit(req, 'PROJECT_UPDATED', 'Projects', `Updated project "${project.title}"`, project.id, 'success');

      return res.json({
        success: true,
        message: 'Project updated successfully.',
        project
      });
    } catch (err) {
      console.error('Update project error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update project.' });
    }
  }

  // DELETE /api/projects/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const index = db.projects.findIndex(p => p.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Project not found.' });
      }

      const deleted = db.projects.splice(index, 1)[0];
      dbManager.save();

      logAudit(req, 'PROJECT_DELETED', 'Projects', `Deleted project "${deleted.title}"`, deleted.id, 'success');

      return res.json({
        success: true,
        message: `Project "${deleted.title}" deleted successfully.`
      });
    } catch (err) {
      console.error('Delete project error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete project.' });
    }
  }
}
