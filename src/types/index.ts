export type AdminRole = 'super_admin' | 'admin';

export interface AdminPermissions {
  dashboard: { view: boolean };
  projects: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  services: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  blogs: { view: boolean; create: boolean; edit: boolean; delete: boolean; publish: boolean };
  testimonials: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  messages: { view: boolean; markRead: boolean; delete: boolean };
  admins: { view: boolean; create: boolean; edit: boolean; delete: boolean };
  media: { view: boolean; upload: boolean; delete: boolean };
  auditLogs: { view: boolean };
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: AdminRole;
  permissions: AdminPermissions;
  isEmailVerified: boolean;
  verificationToken?: string;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'published' | 'draft' | 'in_progress';

export interface Project {
  id: string;
  title: string;
  slug: string;
  shortDescription: string;
  description: string;
  category: string;
  technologies: string[];
  clientName?: string;
  projectUrl?: string;
  githubUrl?: string;
  completionDate?: string;
  featured: boolean;
  status: ProjectStatus;
  imageUrl: string;
  images: string[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CaseStudy {
  id: string;
  key: string;
  title: string;
  subtitle: string;
  category: string;
  image: string;
  link: string;
  tags: string[];
  accent: string;
  client?: string;
  metrics?: { label: string; value: string }[];
  overview?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  status: 'published' | 'draft';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export type ServiceStatus = 'active' | 'inactive';

export interface Service {
  id: string;
  name: string;
  slug: string;
  icon: string;
  shortDescription: string;
  fullDescription: string;
  features: string[];
  order: number;
  status: ServiceStatus;
  seoTitle?: string;
  seoDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export type BlogStatus = 'published' | 'draft';

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  featured: boolean;
  link?: string;
  publishDate: string;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TestimonialStatus = 'active' | 'inactive';

export interface Testimonial {
  id: string;
  clientName: string;
  clientPhoto: string;
  position: string;
  company: string;
  review: string;
  rating: number;
  status: TestimonialStatus;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'unread' | 'read' | 'replied';

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: MessageStatus;
  replyNote?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  adminName: string;
  action: string;
  module: string;
  recordId?: string;
  details: string;
  status: 'success' | 'failure';
  ip?: string;
  timestamp: string;
}

export interface MediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface EmailOutboxItem {
  id: string;
  to: string;
  subject: string;
  type: 'verification' | 'otp' | 'notification';
  content: string;
  tokenOrCode?: string;
  sentAt: string;
  expiresAt?: string;
  status: 'sent' | 'verified' | 'failed' | 'outbox_only';
  deliveryError?: string;
}

export interface VisitorEvent {
  id: string;
  pageViewId?: string;
  visitorId: string;
  sessionId: string;
  timestamp: string;
  path: string;
  referrer: string;
  userAgent?: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  country: string;
  city: string;
  duration?: number;
  isNewVisitor?: boolean;
  ip?: string;
}

export interface DashboardStats {
  visitors: {
    today: number;
    week: number;
    month: number;
    year: number;
    total: number;
    unique: number;
    pageViews: number;
    sessions?: number;
    avgDuration?: number;
    avgDurationFormatted?: string;
    totalDuration?: number;
    newVisitors?: number;
    returningVisitors?: number;
  };
  projects: {
    total: number;
    published: number;
  };
  services: {
    total: number;
    active: number;
  };
  blogs: {
    total: number;
    published: number;
  };
  testimonials: {
    total: number;
  };
  messages: {
    total: number;
    unread: number;
  };
  admins: {
    total: number;
  };
}

export interface ChartDataPoint {
  date: string;
  label: string;
  visitors: number;
  pageViews: number;
}
