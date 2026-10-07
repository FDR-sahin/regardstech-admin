import { Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { IBlog } from '../models/types.js';
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

export class BlogController {
  // GET /api/blogs
  static getAll(req: AuthenticatedRequest, res: Response) {
    const { search, category, status, featured, page = '1', limit = '10' } = req.query;

    let results = [...db.blogs];

    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(b =>
        b.title.toLowerCase().includes(q) ||
        b.excerpt.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    if (category && category !== 'all') {
      results = results.filter(b => b.category === category);
    }

    if (status && status !== 'all') {
      results = results.filter(b => b.status === status);
    }

    if (featured !== undefined && featured !== 'all') {
      results = results.filter(b => b.featured === (featured === 'true'));
    }

    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = results.length;
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, parseInt(String(limit), 10) || 10);
    const startIndex = (p - 1) * l;
    const paginated = results.slice(startIndex, startIndex + l);

    const categories = Array.from(new Set(db.blogs.map(b => b.category)));

    return res.json({
      success: true,
      blogs: paginated,
      pagination: {
        total,
        page: p,
        limit: l,
        totalPages: Math.ceil(total / l)
      },
      categories
    });
  }

  // GET /api/blogs/:id
  static getById(req: AuthenticatedRequest, res: Response) {
    const blog = db.blogs.find(b => b.id === req.params.id);
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }
    return res.json({ success: true, blog });
  }

  // POST /api/blogs
  static create(req: AuthenticatedRequest, res: Response) {
    try {
      const { title, slug, content, excerpt, featuredImage, author, category, tags, status, featured, link, seoTitle, seoDescription, seoKeywords } = req.body;

      if (!title || !content || !category) {
        return res.status(400).json({ success: false, message: 'Title, content, and category are required.' });
      }

      const generatedSlug = slugify(slug || title);
      const existingSlug = db.blogs.find(b => b.slug === generatedSlug);
      const finalSlug = existingSlug ? `${generatedSlug}-${Date.now()}` : generatedSlug;

      const newBlog: IBlog = {
        id: `blog_${Date.now()}`,
        title: String(title).trim(),
        slug: finalSlug,
        content: String(content).trim(),
        excerpt: excerpt ? String(excerpt).trim() : (content.slice(0, 150) + '...'),
        featuredImage: featuredImage || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        author: author || req.admin?.name || 'Regards Tech Editorial',
        authorId: req.admin?.id,
        category: String(category).trim(),
        tags: Array.isArray(tags) ? tags : (typeof tags === 'string' ? tags.split(',').map(s => s.trim()) : []),
        publishedAt: status === 'published' ? new Date().toISOString() : undefined,
        status: status || 'draft',
        featured: Boolean(featured),
        link: link ? String(link).trim() : undefined,
        views: 0,
        seoTitle: seoTitle ? String(seoTitle).trim() : undefined,
        seoDescription: seoDescription ? String(seoDescription).trim() : undefined,
        seoKeywords: Array.isArray(seoKeywords) ? seoKeywords : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.blogs.unshift(newBlog);
      dbManager.save();

      logAudit(req, 'BLOG_CREATED', 'Blogs', `Created article "${newBlog.title}"`, newBlog.id, 'success');

      return res.status(201).json({
        success: true,
        message: 'Blog article created successfully.',
        blog: newBlog
      });
    } catch (err) {
      console.error('Create blog error:', err);
      return res.status(500).json({ success: false, message: 'Failed to create blog article.' });
    }
  }

  // PUT /api/blogs/:id
  static update(req: AuthenticatedRequest, res: Response) {
    try {
      const blog = db.blogs.find(b => b.id === req.params.id);
      if (!blog) {
        return res.status(404).json({ success: false, message: 'Article not found.' });
      }

      const updates = req.body;
      if (updates.slug && updates.slug !== blog.slug) {
        const slugExists = db.blogs.find(b => b.slug === updates.slug && b.id !== blog.id);
        if (slugExists) {
          updates.slug = `${updates.slug}-${Date.now()}`;
        }
      }

      if (updates.status === 'published' && blog.status !== 'published' && !blog.publishedAt) {
        updates.publishedAt = new Date().toISOString();
      }

      Object.assign(blog, updates, { updatedAt: new Date().toISOString() });
      dbManager.save();

      logAudit(req, 'BLOG_UPDATED', 'Blogs', `Updated article "${blog.title}"`, blog.id, 'success');

      return res.json({
        success: true,
        message: 'Blog article updated successfully.',
        blog
      });
    } catch (err) {
      console.error('Update blog error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update article.' });
    }
  }

  // DELETE /api/blogs/:id
  static delete(req: AuthenticatedRequest, res: Response) {
    try {
      const index = db.blogs.findIndex(b => b.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Article not found.' });
      }

      const deleted = db.blogs.splice(index, 1)[0];
      dbManager.save();

      logAudit(req, 'BLOG_DELETED', 'Blogs', `Deleted article "${deleted.title}"`, deleted.id, 'success');

      return res.json({
        success: true,
        message: `Article "${deleted.title}" deleted successfully.`
      });
    } catch (err) {
      console.error('Delete blog error:', err);
      return res.status(500).json({ success: false, message: 'Failed to delete article.' });
    }
  }
}
