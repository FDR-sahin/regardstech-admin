import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { MongoClient, Db } from 'mongodb';
import {
  DatabaseSchema,
  IAdmin,
  IProject,
  IService,
  IBlog,
  ITestimonial,
  IContactMessage,
  IVisitorEvent,
  IAuditLog,
  IMediaItem,
  IEmailRecord,
  ICaseStudy,
  ISmtpSettings
} from '../models/types.js';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function getInitialDatabase(): DatabaseSchema {
  const salt = bcrypt.genSaltSync(10);
  const defaultPasswordHash = bcrypt.hashSync('Admin@12345!', salt);
  const now = new Date().toISOString();

  const primarySuperAdmin: IAdmin = {
    id: 'adm_sahin_01',
    name: 'Sahin Miah',
    email: 'sahinfdr89@gmail.com',
    passwordHash: defaultPasswordHash,
    role: 'super_admin',
    permissions: {
      dashboard: { view: true },
      projects: { view: true, create: true, edit: true, delete: true },
      services: { view: true, create: true, edit: true, delete: true },
      blogs: { view: true, create: true, edit: true, delete: true, publish: true },
      testimonials: { view: true, create: true, edit: true, delete: true },
      messages: { view: true, markRead: true, delete: true },
      admins: { view: true, create: true, edit: true, delete: true },
      media: { view: true, upload: true, delete: true },
      auditLogs: { view: true }
    },
    isEmailVerified: true,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: now
  };

  const aliasSuperAdmin: IAdmin = {
    id: 'adm_sahin_02',
    name: 'Sahin Miah (Primary)',
    email: 'sahinmiah1204@gmail.com',
    passwordHash: defaultPasswordHash,
    role: 'super_admin',
    permissions: {
      dashboard: { view: true },
      projects: { view: true, create: true, edit: true, delete: true },
      services: { view: true, create: true, edit: true, delete: true },
      blogs: { view: true, create: true, edit: true, delete: true, publish: true },
      testimonials: { view: true, create: true, edit: true, delete: true },
      messages: { view: true, markRead: true, delete: true },
      admins: { view: true, create: true, edit: true, delete: true },
      media: { view: true, upload: true, delete: true },
      auditLogs: { view: true }
    },
    isEmailVerified: true,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: now
  };

  const defaultAdminAccount: IAdmin = {
    id: 'adm_super_01',
    name: 'Regards Tech Admin',
    email: 'admin@regardstech.com',
    passwordHash: defaultPasswordHash,
    role: 'super_admin',
    permissions: {
      dashboard: { view: true },
      projects: { view: true, create: true, edit: true, delete: true },
      services: { view: true, create: true, edit: true, delete: true },
      blogs: { view: true, create: true, edit: true, delete: true, publish: true },
      testimonials: { view: true, create: true, edit: true, delete: true },
      messages: { view: true, markRead: true, delete: true },
      admins: { view: true, create: true, edit: true, delete: true },
      media: { view: true, upload: true, delete: true },
      auditLogs: { view: true }
    },
    isEmailVerified: true,
    isActive: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: now
  };

  const projects: IProject[] = [
    {
      id: 'proj_01',
      title: 'FinTech NextGen Banking Portal & Mobile Solution',
      slug: 'fintech-nextgen-banking-portal',
      shortDescription: 'High-frequency transaction monitoring and microservice-driven customer dashboard.',
      description: 'An enterprise-grade banking interface built for real-time portfolio management, multi-currency accounts, and automated fraud prevention analytics. Integrated with ISO 20022 compliant message routing.',
      category: 'Web Development',
      technologies: ['React', 'Next.js', 'TypeScript', 'Node.js', 'PostgreSQL', 'Tailwind CSS'],
      clientName: 'OmniPay Financial Global',
      projectUrl: 'https://regardstech.com/projects/fintech-nextgen',
      githubUrl: 'https://github.com/regardstech/fintech-portal',
      completionDate: '2026-02-15',
      featured: true,
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
      images: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80'
      ],
      seoTitle: 'NextGen Banking Portal Case Study | Regards Tech',
      seoDescription: 'Discover how Regards Tech delivered an ultra-secure, scalable financial platform handling over 50,000 transactions/sec.',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: now
    }
  ];

  const services: IService[] = [
    {
      id: 'srv_01',
      name: 'Web & App Development',
      slug: 'web-app-development',
      icon: 'Code',
      shortDescription: 'Enterprise responsive websites, web applications, and iOS/Android mobile apps engineered for scale.',
      fullDescription: 'We build high-performance web and mobile systems using Next.js, React, React Native, Node.js, and modern cloud architectures. Every system is optimized for speed, reliability, and security.',
      features: [
        'Custom Web & Mobile App Development',
        'Next.js 15 App Router & React Native',
        'High-Throughput REST & GraphQL APIs',
        'PostgreSQL & Cloud Infrastructure Setup'
      ],
      order: 1,
      status: 'active',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: now
    },
    {
      id: 'srv_02',
      name: 'Digital Marketing',
      slug: 'digital-marketing',
      icon: 'TrendingUp',
      shortDescription: 'Full-funnel digital marketing, search engine optimization (SEO), and data-driven ad campaigns.',
      fullDescription: 'Scale your online presence with targeted SEO, Google & Meta advertising, content strategy, and conversion rate optimization.',
      features: [
        'Search Engine Optimization (SEO)',
        'Pay-Per-Click (Google Ads & Meta Ads)',
        'Content Marketing & Lead Funnels',
        'Conversion Rate Optimization (CRO)'
      ],
      order: 2,
      status: 'active',
      createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
      updatedAt: now
    },
    {
      id: 'srv_03',
      name: 'Graphic Design',
      slug: 'graphic-design',
      icon: 'Palette',
      shortDescription: 'Modern brand identities, UI/UX systems, motion graphics, and high-impact digital creatives.',
      fullDescription: 'From corporate brand identities to complete mobile and web application design systems with Figma and Adobe Creative Suite.',
      features: [
        'Brand Identity & Logo Systems',
        'UI/UX Design & Prototyping (Figma)',
        'Social Media & Marketing Collateral',
        'Print & Packaging Design'
      ],
      order: 3,
      status: 'active',
      createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      updatedAt: now
    },
    {
      id: 'srv_04',
      name: 'Cyber Security',
      slug: 'cyber-security',
      icon: 'Shield',
      shortDescription: 'Enterprise vulnerability assessment, penetration testing, infrastructure hardening, and threat monitoring.',
      fullDescription: 'Protect mission-critical data, prevent ransomware and zero-day threats, and maintain compliance standards.',
      features: [
        'Web & Mobile App Penetration Testing',
        'Cloud & Server Infrastructure Hardening',
        'Vulnerability Assessment & Auditing',
        'Data Encryption & DDoS Protection'
      ],
      order: 4,
      status: 'active',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: now
    }
  ];

  const blogs: IBlog[] = [
    {
      id: 'blog_01',
      title: 'Architecting Scalable Next.js Applications with REST APIs and Edge Caching',
      slug: 'architecting-scalable-nextjs-rest-apis',
      excerpt: 'How modern engineering teams decouple administrative backends while delivering sub-50ms TTFB for public website visitors.',
      content: `### Why Architecture Matters for Tech Enterprises\n\nWhen scaling a modern technology company website like Regards Tech, separating administrative workflows from public marketing channels provides immense benefits in security, performance, and operational agility.\n\n### The Core Principles:\n1. **Stateless REST Communication**: Keep business logic clean and transportable.\n2. **Granular RBAC**: Ensure only authorized administrators can mutate client-facing content.\n3. **Edge Caching**: Serve cached JSON payloads to Next.js Incremental Static Regeneration (ISR) pipelines.\n\nBy leveraging this architecture, your Next.js frontend rebuilds only when changes are published from the Admin Panel.`,
      featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
      author: 'Sahin Miah',
      category: 'Engineering',
      tags: ['Next.js', 'REST API', 'Architecture', 'Web Dev'],
      status: 'published',
      featured: true,
      publishDate: '2026-03-01',
      views: 1420,
      seoTitle: 'Scalable Next.js Architecture with REST APIs | Regards Tech',
      seoDescription: 'Guide to decoupling admin CMS from customer-facing Next.js frontend for maximum security.',
      seoKeywords: ['Next.js', 'REST API', 'Web Architecture', 'SaaS CMS'],
      createdAt: new Date(Date.now() - 26 * 86400000).toISOString(),
      updatedAt: now
    }
  ];

  return {
    admins: [primarySuperAdmin, aliasSuperAdmin, defaultAdminAccount],
    projects,
    services,
    caseStudies: [],
    blogs,
    testimonials: [],
    messages: [],
    visitorEvents: [],
    auditLogs: [],
    media: [],
    outbox: []
  };
}

class DatabaseManager {
  private db: DatabaseSchema;
  private mongoClient: MongoClient | null = null;
  private mongoDb: Db | null = null;
  private isMongoConnected = false;
  private saveTimeout: NodeJS.Timeout | null = null;
  private isSavingToMongo = false;

  constructor() {
    this.db = this.loadLocal();
  }

  private loadLocal(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.admins && parsed.projects && parsed.services) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not read existing db.json, generating fresh seed data.', e);
    }
    const initial = getInitialDatabase();
    this.saveLocalDirect(initial);
    return initial;
  }

  private saveLocalDirect(data: DatabaseSchema): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write db.json:', err);
    }
  }

  // Initialize MongoDB Atlas connection & sync
  public async init(): Promise<void> {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.log('ℹ️ [Database] No MONGODB_URI found. Running on embedded persistent local storage.');
      return;
    }

    try {
      console.log('🔄 [MongoDB] Connecting to MongoDB Atlas...');
      this.mongoClient = new MongoClient(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });

      await this.mongoClient.connect();
      this.mongoDb = this.mongoClient.db('regards_tech');
      this.isMongoConnected = true;
      console.log('✅ [MongoDB] Connected successfully to MongoDB Atlas database: "regards_tech"');

      // Load or Seed collections from/to MongoDB Atlas
      await this.syncFromMongoOrSeed();
    } catch (err: any) {
      console.error('⚠️ [MongoDB] Connection error (falling back to persistent local storage):', err.message);
      this.isMongoConnected = false;
    }
  }

  private async syncFromMongoOrSeed(): Promise<void> {
    if (!this.mongoDb) return;

    const collections: (keyof DatabaseSchema)[] = [
      'admins',
      'projects',
      'services',
      'caseStudies',
      'blogs',
      'testimonials',
      'messages',
      'visitorEvents',
      'auditLogs',
      'media',
      'outbox'
    ];

    try {
      for (const colName of collections) {
        const col = this.mongoDb.collection(colName);
        const count = await col.countDocuments();

        if (count > 0) {
          // Fetch existing documents from MongoDB into in-memory store
          const docs = await col.find({}, { projection: { _id: 0 } }).toArray();
          (this.db as any)[colName] = docs;
        } else {
          // If MongoDB collection is empty, migrate current local items into MongoDB
          const localItems = (this.db as any)[colName] || [];
          if (localItems.length > 0) {
            console.log(`🚀 [MongoDB] Migrating ${localItems.length} items to collection "${colName}"...`);
            await col.insertMany(localItems);
          }
        }
      }

      // Sync settings (e.g. smtpSettings)
      const settingsCol = this.mongoDb.collection('settings');
      const smtpDoc = await settingsCol.findOne({ _id: 'smtp_settings' as any });
      if (smtpDoc) {
        const { _id, ...rest } = smtpDoc;
        this.db.smtpSettings = rest as ISmtpSettings;
      } else if (this.db.smtpSettings) {
        await settingsCol.updateOne(
          { _id: 'smtp_settings' as any },
          { $set: { ...this.db.smtpSettings } },
          { upsert: true }
        );
      }

      // Guarantee Super Admin exists in admins collection
      const hasSahin = (this.db.admins || []).some(a => a.email.toLowerCase() === 'sahinfdr89@gmail.com');
      if (!hasSahin) {
        const initial = getInitialDatabase();
        this.db.admins = initial.admins;
        await this.syncCollectionToMongo('admins', this.db.admins);
      }

      // Update local db.json with latest state from MongoDB
      this.saveLocalDirect(this.db);
      console.log('✨ [MongoDB] All collections synced and verified successfully with MongoDB Atlas.');
    } catch (err: any) {
      console.error('⚠️ [MongoDB] Error during initial sync:', err.message);
    }
  }

  // Sync a single collection to MongoDB
  public async syncCollectionToMongo(collectionName: keyof DatabaseSchema, items: any[]): Promise<void> {
    if (!this.isMongoConnected || !this.mongoDb) return;

    try {
      const col = this.mongoDb.collection(collectionName);
      // Clean and replace collection contents with latest in-memory state
      await col.deleteMany({});
      if (Array.isArray(items) && items.length > 0) {
        await col.insertMany(items);
      }
    } catch (err: any) {
      console.error(`⚠️ [MongoDB] Failed to sync collection "${collectionName}":`, err.message);
    }
  }

  // Triggered whenever any route/controller mutates data
  public save(): void {
    // 1. Instant local write
    this.saveLocalDirect(this.db);

    // 2. Debounced asynchronous MongoDB write (to prevent excessive writes during heavy bursts)
    if (this.isMongoConnected && this.mongoDb) {
      if (this.saveTimeout) {
        clearTimeout(this.saveTimeout);
      }
      this.saveTimeout = setTimeout(() => {
        this.flushToMongo();
      }, 500);
    }
  }

  private async flushToMongo(): Promise<void> {
    if (!this.isMongoConnected || !this.mongoDb || this.isSavingToMongo) return;
    this.isSavingToMongo = true;

    try {
      const collections: (keyof DatabaseSchema)[] = [
        'admins',
        'projects',
        'services',
        'caseStudies',
        'blogs',
        'testimonials',
        'messages',
        'visitorEvents',
        'auditLogs',
        'media',
        'outbox'
      ];

      for (const colName of collections) {
        const items = (this.db as any)[colName];
        if (Array.isArray(items)) {
          const col = this.mongoDb.collection(colName);
          await col.deleteMany({});
          if (items.length > 0) {
            await col.insertMany(items);
          }
        }
      }

      // Save smtpSettings if present
      if (this.db.smtpSettings) {
        const settingsCol = this.mongoDb.collection('settings');
        await settingsCol.updateOne(
          { _id: 'smtp_settings' as any },
          { $set: { ...this.db.smtpSettings } },
          { upsert: true }
        );
      }
    } catch (err: any) {
      console.error('⚠️ [MongoDB] Background sync to MongoDB failed:', err.message);
    } finally {
      this.isSavingToMongo = false;
    }
  }

  public get data(): DatabaseSchema {
    return this.db;
  }

  public get mongoDatabase(): Db | null {
    return this.mongoDb;
  }

  public get isConnected(): boolean {
    return this.isMongoConnected;
  }
}

export const dbManager = new DatabaseManager();
export const db = dbManager.data;
