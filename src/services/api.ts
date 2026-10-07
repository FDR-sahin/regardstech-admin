import { AdminUser, AdminPermissions, Project, CaseStudy, Service, BlogPost, Testimonial, ContactMessage, AuditLog, MediaItem, EmailOutboxItem, DashboardStats, ChartDataPoint } from '../types/index.ts';

const TOKEN_KEY = 'regards_tech_admin_token';

class ApiClient {
  private getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  public setToken(token: string): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error(e);
    }
  }

  public clearToken(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error(e);
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/api/auth/login')) {
        // Session expired, clear token without full page reload
        this.clearToken();
      }
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // --- Auth Endpoints ---
  async login(email: string, password: string, rememberMe = false): Promise<{ success: boolean; requireOtp?: boolean; token?: string; admin?: AdminUser; message: string }> {
    const res = await this.request<{ success: boolean; requireOtp?: boolean; token?: string; admin?: AdminUser; message: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, rememberMe })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async verifyLoginOtp(email: string, otp: string, rememberMe = false): Promise<{ success: boolean; token: string; admin: AdminUser; message: string }> {
    const res = await this.request<{ success: boolean; token: string; admin: AdminUser; message: string }>('/api/auth/login-verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, rememberMe })
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async logout(): Promise<void> {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    } finally {
      this.clearToken();
    }
  }

  async getMe(): Promise<{ success: boolean; admin: AdminUser }> {
    return this.request<{ success: boolean; admin: AdminUser }>('/api/auth/me');
  }

  async updateProfile(name: string, email?: string, avatarUrl?: string): Promise<{ success: boolean; admin: AdminUser; message: string }> {
    return this.request<{ success: boolean; admin: AdminUser; message: string }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email, avatarUrl })
    });
  }

  async changePassword(currentPassword: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
  }

  async verifyEmail(token?: string, email?: string, otp?: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token, email, otp })
    });
  }

  async resendVerification(email: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async verifyOtp(email: string, otp: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });
  }

  async resetPassword(email: string, otp: string, newPassword: string, confirmPassword: string): Promise<{ success: boolean; message: string }> {
    return this.request<{ success: boolean; message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, otp, newPassword, confirmPassword })
    });
  }

  async getEmails(): Promise<{ success: boolean; emails: EmailOutboxItem[] }> {
    return this.request<{ success: boolean; emails: EmailOutboxItem[] }>('/api/auth/emails');
  }

  // --- Analytics & Dashboard ---
  async getDashboard(period = '30d'): Promise<{
    success: boolean;
    stats: DashboardStats;
    chart: { period: string; data: ChartDataPoint[] };
    trafficSources: { name: string; count: number; percentage: number }[];
    deviceAnalysis: { name: string; count: number; percentage: number }[];
    browserAnalysis: { name: string; count: number; percentage: number }[];
    topPages: {
      url: string;
      title: string;
      views: number;
      uniqueVisitors?: number;
      totalDuration?: number;
      avgDuration?: number;
      avgDurationFormatted?: string;
      percentage: number;
    }[];
    geographicAnalysis: { country: string; count: number; percentage: number }[];
    recentVisitors?: {
      id: string;
      visitorId?: string;
      sessionId?: string;
      path: string;
      country: string;
      city?: string;
      device: string;
      browser: string;
      referrer: string;
      duration?: number;
      durationFormatted?: string;
      isNewVisitor?: boolean;
      timestamp: string;
    }[];
    recentActivities?: AuditLog[];
  }> {
    return this.request(`/api/analytics/dashboard?period=${period}`);
  }

  async trackEvent(data: {
    path: string;
    referrer?: string;
    device?: string;
    browser?: string;
    country?: string;
    city?: string;
    visitorId?: string;
    sessionId?: string;
    pageViewId?: string;
    duration?: number;
  }): Promise<{ success: boolean; pageViewId?: string; visitorId?: string; sessionId?: string }> {
    return this.request('/api/analytics/track', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async trackDuration(data: {
    pageViewId?: string;
    visitorId?: string;
    path?: string;
    duration: number;
  }): Promise<{ success: boolean }> {
    return this.request('/api/analytics/duration', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // --- Projects ---
  async getProjects(params: { search?: string; category?: string; status?: string; featured?: string; page?: number; limit?: number } = {}): Promise<{
    success: boolean;
    projects: Project[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    categories: string[];
  }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.featured) query.append('featured', params.featured);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request(`/api/projects?${query.toString()}`);
  }

  async createProject(projectData: Partial<Project>): Promise<{ success: boolean; message: string; project: Project }> {
    return this.request('/api/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateProject(id: string, projectData: Partial<Project>): Promise<{ success: boolean; message: string; project: Project }> {
    return this.request(`/api/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async deleteProject(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/projects/${id}`, { method: 'DELETE' });
  }

  // --- Case Studies ---
  async getPublicCaseStudies(): Promise<{ success: boolean; caseStudies: CaseStudy[] }> {
    return this.request('/api/public/case-studies');
  }

  async getCaseStudies(params: { search?: string; category?: string; status?: string } = {}): Promise<{ success: boolean; caseStudies: CaseStudy[]; total: number }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    return this.request(`/api/case-studies?${query.toString()}`);
  }

  async createCaseStudy(caseStudyData: Partial<CaseStudy>): Promise<{ success: boolean; message: string; caseStudy: CaseStudy }> {
    return this.request('/api/case-studies', {
      method: 'POST',
      body: JSON.stringify(caseStudyData)
    });
  }

  async updateCaseStudy(id: string, caseStudyData: Partial<CaseStudy>): Promise<{ success: boolean; message: string; caseStudy: CaseStudy }> {
    return this.request(`/api/case-studies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(caseStudyData)
    });
  }

  async deleteCaseStudy(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/case-studies/${id}`, { method: 'DELETE' });
  }

  // --- Services ---
  async getServices(params: { search?: string; status?: string } = {}): Promise<{ success: boolean; services: Service[] }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    return this.request(`/api/services?${query.toString()}`);
  }

  async createService(serviceData: Partial<Service>): Promise<{ success: boolean; message: string; service: Service }> {
    return this.request('/api/services', {
      method: 'POST',
      body: JSON.stringify(serviceData)
    });
  }

  async updateService(id: string, serviceData: Partial<Service>): Promise<{ success: boolean; message: string; service: Service }> {
    return this.request(`/api/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(serviceData)
    });
  }

  async reorderServices(orderedIds: string[]): Promise<{ success: boolean; message: string }> {
    return this.request('/api/services/reorder', {
      method: 'PUT',
      body: JSON.stringify({ orderedIds })
    });
  }

  async deleteService(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/services/${id}`, { method: 'DELETE' });
  }

  // --- Blogs ---
  async getBlogs(params: { search?: string; category?: string; status?: string; featured?: string; page?: number; limit?: number } = {}): Promise<{
    success: boolean;
    blogs: BlogPost[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    categories: string[];
  }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category) query.append('category', params.category);
    if (params.status) query.append('status', params.status);
    if (params.featured) query.append('featured', params.featured);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request(`/api/blogs?${query.toString()}`);
  }

  async createBlog(blogData: Partial<BlogPost>): Promise<{ success: boolean; message: string; blog: BlogPost }> {
    return this.request('/api/blogs', {
      method: 'POST',
      body: JSON.stringify(blogData)
    });
  }

  async updateBlog(id: string, blogData: Partial<BlogPost>): Promise<{ success: boolean; message: string; blog: BlogPost }> {
    return this.request(`/api/blogs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(blogData)
    });
  }

  async deleteBlog(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/blogs/${id}`, { method: 'DELETE' });
  }

  // --- Testimonials ---
  async getTestimonials(params: { search?: string; status?: string } = {}): Promise<{ success: boolean; testimonials: Testimonial[] }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    return this.request(`/api/testimonials?${query.toString()}`);
  }

  async createTestimonial(data: Partial<Testimonial>): Promise<{ success: boolean; message: string; testimonial: Testimonial }> {
    return this.request('/api/testimonials', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateTestimonial(id: string, data: Partial<Testimonial>): Promise<{ success: boolean; message: string; testimonial: Testimonial }> {
    return this.request(`/api/testimonials/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteTestimonial(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/testimonials/${id}`, { method: 'DELETE' });
  }

  // --- Messages ---
  async getMessages(params: { search?: string; status?: string; page?: number; limit?: number } = {}): Promise<{
    success: boolean;
    messages: ContactMessage[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    unreadCount: number;
  }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request(`/api/messages?${query.toString()}`);
  }

  async updateMessageStatus(id: string, status: 'unread' | 'read' | 'replied'): Promise<{ success: boolean; contactMessage: ContactMessage }> {
    return this.request(`/api/messages/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async replyMessage(id: string, replyNote: string): Promise<{ success: boolean; message: string; delivered?: boolean; contactMessage: ContactMessage }> {
    return this.request(`/api/messages/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ replyNote })
    });
  }

  async deleteMessage(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/messages/${id}`, { method: 'DELETE' });
  }

  // --- Admins Management ---
  async getAdmins(): Promise<{ success: boolean; admins: AdminUser[] }> {
    return this.request('/api/admins');
  }

  async createAdmin(data: { name: string; email: string; password: string; role: string; permissions: AdminPermissions; sendVerificationEmail?: boolean }): Promise<{ success: boolean; message: string; admin: AdminUser }> {
    return this.request('/api/admins', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async resendAdminVerification(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admins/${id}/resend-verification`, {
      method: 'POST'
    });
  }

  async verifyAdminDirectly(id: string): Promise<{ success: boolean; message: string; admin: AdminUser }> {
    return this.request(`/api/admins/${id}/verify-now`, {
      method: 'POST'
    });
  }

  async updateAdmin(id: string, data: { name?: string; email?: string; role?: string; permissions?: AdminPermissions; isActive?: boolean }): Promise<{ success: boolean; message: string; admin: AdminUser }> {
    return this.request(`/api/admins/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteAdmin(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/admins/${id}`, { method: 'DELETE' });
  }

  // --- Audit Logs ---
  async getAuditLogs(params: { search?: string; module?: string; status?: string; page?: number; limit?: number } = {}): Promise<{
    success: boolean;
    logs: AuditLog[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
    modules: string[];
  }> {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.module) query.append('module', params.module);
    if (params.status) query.append('status', params.status);
    if (params.page) query.append('page', String(params.page));
    if (params.limit) query.append('limit', String(params.limit));
    return this.request(`/api/audit-logs?${query.toString()}`);
  }

  // --- Media ---
  async getMedia(search?: string): Promise<{ success: boolean; media: MediaItem[] }> {
    return this.request(`/api/media${search ? `?search=${encodeURIComponent(search)}` : ''}`);
  }

  async uploadMedia(data: { fileName: string; fileUrl: string; fileType?: string; fileSize?: number }): Promise<{ success: boolean; message: string; media: MediaItem }> {
    return this.request('/api/media/upload', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async deleteMedia(id: string): Promise<{ success: boolean; message: string }> {
    return this.request(`/api/media/${id}`, { method: 'DELETE' });
  }

  // --- SMTP Configuration (Super Admin) ---
  async getSmtpSettings(): Promise<{
    success: boolean;
    smtpSettings: {
      host: string;
      port: number;
      secure: boolean;
      user: string;
      passConfigured: boolean;
      fromName: string;
      fromEmail: string;
      isConfigured: boolean;
      updatedAt?: string;
    };
  }> {
    return this.request('/api/admins/settings/smtp');
  }

  async saveSmtpSettings(data: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass?: string;
    fromName?: string;
    fromEmail?: string;
  }): Promise<{ success: boolean; message: string; smtpSettings: any }> {
    return this.request('/api/admins/settings/smtp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async sendTestSmtpEmail(targetEmail?: string): Promise<{ success: boolean; message: string; record?: any }> {
    return this.request('/api/admins/settings/smtp/test', {
      method: 'POST',
      body: JSON.stringify({ targetEmail })
    });
  }

  // --- Public REST Tester (For Next.js website) ---
  async testPublicGet(path: string): Promise<unknown> {
    const res = await fetch(path);
    return res.json();
  }

  async submitContactForm(data: { name: string; email: string; phone?: string; subject?: string; message: string }): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/public/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
}

export const api = new ApiClient();
