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

export interface IAdmin {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  permissions: AdminPermissions;
  isEmailVerified: boolean;
  verificationToken?: string;
  verificationOtp?: string;
  verificationTokenExpires?: number | string;
  resetPasswordOtp?: string;
  resetPasswordExpires?: number;
  resetPasswordAttempts?: number;
  loginOtp?: string;
  loginOtpExpires?: number;
  resetOtp?: string;
  resetOtpExpires?: string;
  resetOtpAttempts?: number;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus = 'published' | 'draft' | 'in_progress';

export interface IProject {
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

export type ServiceStatus = 'active' | 'inactive';

export interface IService {
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

export interface IBlog {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  authorId?: string;
  category: string;
  tags: string[];
  status: BlogStatus;
  featured: boolean;
  link?: string;
  publishDate?: string;
  publishedAt?: string;
  views: number;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string[];
  createdAt: string;
  updatedAt: string;
}

export type TestimonialStatus = 'active' | 'inactive';

export interface ITestimonial {
  id: string;
  clientName: string;
  clientPhoto: string;
  position: string;
  company: string;
  review: string;
  rating: number; // 1 - 5
  status: TestimonialStatus;
  createdAt: string;
  updatedAt: string;
}

export type MessageStatus = 'unread' | 'read' | 'replied';

export interface IContactMessage {
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

export interface IVisitorEvent {
  id: string; // Event ID or pageViewId
  pageViewId?: string;
  visitorId: string; // Persistent across browser sessions (localStorage)
  sessionId: string; // Session specific (sessionStorage)
  timestamp: string;
  path: string;
  referrer: string;
  userAgent?: string;
  device: 'Desktop' | 'Mobile' | 'Tablet';
  browser: 'Chrome' | 'Safari' | 'Firefox' | 'Edge' | 'Other';
  country: string;
  city: string;
  duration?: number; // Total seconds spent on this page view
  isNewVisitor?: boolean;
  ip?: string;
}

export interface IAuditLog {
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

export interface IMediaItem {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  createdAt: string;
}

export interface IEmailRecord {
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

export interface ISmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  fromName: string;
  fromEmail: string;
  isConfigured: boolean;
  updatedAt?: string;
}

export interface ICaseStudy {
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

export interface DatabaseSchema {
  admins: IAdmin[];
  projects: IProject[];
  services: IService[];
  caseStudies: ICaseStudy[];
  blogs: IBlog[];
  testimonials: ITestimonial[];
  messages: IContactMessage[];
  visitorEvents: IVisitorEvent[];
  auditLogs: IAuditLog[];
  media: IMediaItem[];
  outbox: IEmailRecord[];
  smtpSettings?: ISmtpSettings;
}
