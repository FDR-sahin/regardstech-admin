import { Request, Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { IContactMessage, ITestimonial, ICaseStudy, IBlog } from '../models/types.js';

export class PublicController {
  // GET /api/public/company
  static getCompanyInfo(req: Request, res: Response) {
    return res.json({
      success: true,
      company: {
        name: 'Regards Tech',
        website: 'https://regardstech.com/',
        headline: 'Bridging Talent with Technology',
        subtitle: 'Innovative Insights, Outstanding Outcomes',
        tagline: 'Where an idea turns into a project, we help your startups, businesses, and ideas grow and solve problems with the power of specialists.',
        email: 'sahinfdr89@gmail.com',
        supportEmail: 'sahinfdr89@gmail.com',
        phone: '+880 1700-000000',
        address: 'Tech Innovation Hub, Regards Tech Global',
        services: [
          'Web Development',
          'App Development',
          'Digital Marketing & SEO',
          'UI/UX Design',
          'Graphics Design',
          'Cyber Security',
          'Other Technology Services'
        ]
      }
    });
  }

  // GET /api/public/projects
  static getProjects(req: Request, res: Response) {
    const { category, featured, limit } = req.query;
    let items = db.projects.filter(p => p.status === 'published');

    if (category && category !== 'all') {
      items = items.filter(p => p.category === category);
    }

    if (featured === 'true') {
      items = items.filter(p => p.featured);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (limit) {
      const l = parseInt(String(limit), 10);
      if (!isNaN(l) && l > 0) {
        items = items.slice(0, l);
      }
    }

    return res.json({
      success: true,
      count: items.length,
      projects: items
    });
  }

  // GET /api/public/projects/:slug
  static getProjectBySlug(req: Request, res: Response) {
    const project = db.projects.find(p => p.slug === req.params.slug && p.status === 'published');
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }
    return res.json({ success: true, project });
  }

  // GET /api/public/services
  static getServices(req: Request, res: Response) {
    const items = db.services
      .filter(s => s.status === 'active')
      .sort((a, b) => a.order - b.order);

    return res.json({
      success: true,
      count: items.length,
      services: items
    });
  }

  // GET /api/public/services/:slug
  static getServiceBySlug(req: Request, res: Response) {
    const service = db.services.find(s => s.slug === req.params.slug && s.status === 'active');
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service not found.' });
    }
    return res.json({ success: true, service });
  }

  // GET /api/public/blogs
  static getBlogs(req: Request, res: Response) {
    const { category, featured, limit } = req.query;
    let items = db.blogs.filter(b => b.status === 'published');

    if (category && category !== 'all') {
      items = items.filter(b => b.category === category);
    }

    if (featured === 'true') {
      items = items.filter(b => b.featured);
    }

    items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (limit) {
      const l = parseInt(String(limit), 10);
      if (!isNaN(l) && l > 0) {
        items = items.slice(0, l);
      }
    }

    return res.json({
      success: true,
      count: items.length,
      blogs: items
    });
  }

  // GET /api/public/blogs/:slug
  static getBlogBySlug(req: Request, res: Response) {
    const blog = db.blogs.find(b => b.slug === req.params.slug && b.status === 'published');
    if (!blog) {
      return res.status(404).json({ success: false, message: 'Article not found.' });
    }

    // Increment view count
    blog.views = (blog.views || 0) + 1;
    dbManager.save();

    return res.json({ success: true, blog });
  }

  // GET /api/public/testimonials
  static getTestimonials(req: Request, res: Response) {
    const items = (db.testimonials || [])
      .filter(t => t.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return res.json({
      success: true,
      count: items.length,
      testimonials: items
    });
  }

  // GET /api/public/case-studies
  static getCaseStudies(req: Request, res: Response) {
    const list = (db.caseStudies || [])
      .filter(c => c.status === 'published')
      .sort((a, b) => a.order - b.order);

    return res.json({
      success: true,
      count: list.length,
      caseStudies: list
    });
  }

  // POST /api/public/testimonials (Frontend client review submission)
  static submitTestimonial(req: Request, res: Response) {
    try {
      const { clientName, clientPhoto, position, company, review, rating } = req.body;

      if (!clientName || !review) {
        return res.status(400).json({
          success: false,
          message: 'Client name and review are required.'
        });
      }

      const numRating = Number(rating) || 5;
      const validRating = Math.max(1, Math.min(5, Math.round(numRating)));
      const now = new Date().toISOString();

      const newTestimonial: ITestimonial = {
        id: `tst_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        clientName: String(clientName).trim(),
        clientPhoto: clientPhoto && String(clientPhoto).trim()
          ? String(clientPhoto).trim()
          : `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(String(clientName).trim())}`,
        position: position ? String(position).trim() : 'Verified Client',
        company: company ? String(company).trim() : 'Client Organization',
        review: String(review).trim(),
        rating: validRating,
        status: 'active',
        createdAt: now,
        updatedAt: now
      };

      if (!db.testimonials) db.testimonials = [];
      db.testimonials.unshift(newTestimonial);

      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        adminId: 'public_visitor',
        adminEmail: 'visitor@regardstech.com',
        adminName: 'Frontend Client/Visitor',
        action: 'SUBMIT_TESTIMONIAL',
        module: 'testimonials',
        recordId: newTestimonial.id,
        details: `Frontend submission: New testimonial added by ${newTestimonial.clientName} (${newTestimonial.company}) with ${newTestimonial.rating} stars`,
        status: 'success',
        timestamp: now
      });

      dbManager.save();

      return res.status(201).json({
        success: true,
        message: 'Your review has been successfully submitted and added to the website!',
        testimonial: newTestimonial
      });
    } catch (err) {
      console.error('Submit testimonial error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit testimonial. Please try again.'
      });
    }
  }

  // POST /api/public/case-studies (Frontend case study submission)
  static submitCaseStudy(req: Request, res: Response) {
    try {
      const {
        title,
        subtitle,
        category = 'Web & App Development',
        image,
        link,
        tags = [],
        client,
        metrics = [],
        overview,
        challenge,
        solution,
        results,
        accent = '#2563EB'
      } = req.body;

      if (!title || !subtitle) {
        return res.status(400).json({
          success: false,
          message: 'Case study title and subtitle/summary are required.'
        });
      }

      if (!db.caseStudies) db.caseStudies = [];

      const cleanKey = String(title).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 16) || `cs${Date.now()}`;
      let finalKey = cleanKey;
      let counter = 1;
      while (db.caseStudies.some(c => c.key === finalKey)) {
        finalKey = `${cleanKey}${counter++}`;
      }

      const now = new Date().toISOString();
      const newCaseStudy: ICaseStudy = {
        id: `cs_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        key: finalKey,
        title: String(title).trim(),
        subtitle: String(subtitle).trim(),
        category: String(category).trim(),
        image: image && String(image).trim()
          ? String(image).trim()
          : 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        link: link ? String(link).trim() : 'https://regardstech.com',
        tags: Array.isArray(tags) && tags.length > 0 ? tags.map(t => String(t).trim()) : ['Next.js', 'Case Study'],
        accent: accent || '#2563EB',
        client: client ? String(client).trim() : 'Regards Tech Client',
        metrics: Array.isArray(metrics) && metrics.length > 0 ? metrics : [
          { label: 'Performance', value: '99/100' },
          { label: 'Outcomes', value: '+150%' }
        ],
        overview: overview ? String(overview).trim() : String(subtitle).trim(),
        challenge: challenge ? String(challenge).trim() : undefined,
        solution: solution ? String(solution).trim() : undefined,
        results: results ? String(results).trim() : undefined,
        status: 'published',
        order: db.caseStudies.length + 1,
        createdAt: now,
        updatedAt: now
      };

      db.caseStudies.unshift(newCaseStudy);

      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        adminId: 'public_visitor',
        adminEmail: 'client@regardstech.com',
        adminName: 'Frontend Client/Partner',
        action: 'SUBMIT_CASE_STUDY',
        module: 'caseStudies',
        recordId: newCaseStudy.id,
        details: `Frontend submission: New case study "${newCaseStudy.title}" (${newCaseStudy.category})`,
        status: 'success',
        timestamp: now
      });

      dbManager.save();

      return res.status(201).json({
        success: true,
        message: 'Case study submitted successfully and published to showcase!',
        caseStudy: newCaseStudy
      });
    } catch (err) {
      console.error('Submit case study error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit case study. Please try again.'
      });
    }
  }

  // POST /api/public/blogs (Frontend blog article submission)
  static submitBlog(req: Request, res: Response) {
    try {
      const {
        title,
        excerpt,
        content,
        author = 'Regards Tech Contributor',
        category = 'Engineering',
        coverImage,
        tags = []
      } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Article title and content are required.'
        });
      }

      if (!db.blogs) db.blogs = [];

      const baseSlug = String(title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || `post-${Date.now()}`;
      let finalSlug = baseSlug;
      let counter = 1;
      while (db.blogs.some(b => b.slug === finalSlug)) {
        finalSlug = `${baseSlug}-${counter++}`;
      }

      const incomingImage = coverImage || req.body.featuredImage || req.body.image;

      const now = new Date().toISOString();
      const newBlog: IBlog = {
        id: `blog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        title: String(title).trim(),
        slug: finalSlug,
        excerpt: excerpt ? String(excerpt).trim() : String(content).slice(0, 160).trim(),
        content: String(content).trim(),
        featuredImage: incomingImage && String(incomingImage).trim()
          ? String(incomingImage).trim()
          : 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
        author: String(author).trim(),
        category: String(category).trim(),
        tags: Array.isArray(tags) && tags.length > 0 ? tags.map(t => String(t).trim()) : ['Tech', 'Insights'],
        status: 'published',
        featured: false,
        publishDate: now.split('T')[0],
        publishedAt: now,
        views: 0,
        createdAt: now,
        updatedAt: now
      };

      db.blogs.unshift(newBlog);

      if (!db.auditLogs) db.auditLogs = [];
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        adminId: 'public_contributor',
        adminEmail: 'contributor@regardstech.com',
        adminName: 'Frontend Author/Contributor',
        action: 'SUBMIT_BLOG',
        module: 'blogs',
        recordId: newBlog.id,
        details: `Frontend submission: New blog published "${newBlog.title}" by ${newBlog.author}`,
        status: 'success',
        timestamp: now
      });

      dbManager.save();

      return res.status(201).json({
        success: true,
        message: 'Article published successfully to the website!',
        blog: newBlog
      });
    } catch (err) {
      console.error('Submit blog error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to submit article. Please try again.'
      });
    }
  }

  // POST /api/public/contact
  static submitContact(req: Request, res: Response) {
    try {
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required.'
        });
      }

      // Basic email syntax check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(email).trim())) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid email address.'
        });
      }

      const newMessage: IContactMessage = {
        id: `msg_${Date.now()}`,
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        phone: phone ? String(phone).trim() : undefined,
        subject: subject ? String(subject).trim() : 'Website General Inquiry',
        message: String(message).trim(),
        status: 'unread',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      db.messages.unshift(newMessage);
      dbManager.save();

      return res.status(201).json({
        success: true,
        message: 'Your inquiry has been successfully transmitted to Regards Tech. Our team will contact you shortly.',
        inquiryId: newMessage.id
      });
    } catch (err) {
      console.error('Public contact submit error:', err);
      return res.status(500).json({
        success: false,
        message: 'Failed to process inquiry. Please try again or reach out to contact@regardstech.com.'
      });
    }
  }
}
