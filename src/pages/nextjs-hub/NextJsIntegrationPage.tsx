import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Play,
  Send,
  ExternalLink,
  ShieldCheck,
  Server,
  FileCode,
  Layers,
  Briefcase,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useToast } from '../../context/ToastContext.tsx';

export const NextJsIntegrationPage: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'tester' | 'snippets' | 'nextauth'>('tester');
  const [selectedEndpoint, setSelectedEndpoint] = useState('/api/public/projects');
  const [apiResponse, setApiResponse] = useState<string>('Click "Execute GET Request" to test endpoint live.');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Live Contact form test state
  const [testName, setTestName] = useState('Alex Rivers');
  const [testEmail, setTestEmail] = useState('alex@enterprise-client.com');
  const [testSubject, setTestSubject] = useState('Enterprise Cloud Migration Project');
  const [testMessage, setTestMessage] = useState('We need Regards Tech to architect our Next.js e-commerce portal and manage cyber security penetration testing.');
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestGet = async (path: string) => {
    setIsLoading(true);
    setSelectedEndpoint(path);
    try {
      const res = await api.testPublicGet(path);
      setApiResponse(JSON.stringify(res, null, 2));
      showToast(`200 OK: ${path}`, 'success');
    } catch (err: unknown) {
      setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : 'Request failed' }, null, 2));
      showToast('Request failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingForm(true);
    try {
      const res = await api.submitContactForm({
        name: testName,
        email: testEmail,
        subject: testSubject,
        message: testMessage
      });
      setApiResponse(JSON.stringify(res, null, 2));
      setSelectedEndpoint('/api/public/contact');
      showToast('Contact form submission sent to database and admin messages!', 'success');
    } catch (err: unknown) {
      setApiResponse(JSON.stringify({ error: err instanceof Error ? err.message : 'Submission failed' }, null, 2));
    } finally {
      setIsSubmittingForm(false);
    }
  };

  const codeSnippets = {
    projects: `// app/projects/page.tsx (Next.js 14/15 App Router)
export const revalidate = 60; // Incremental Static Regeneration

async function getProjects() {
  const res = await fetch(\`\${process.env.ADMIN_API_URL}/api/public/projects\`, {
    next: { tags: ['projects'] }
  });
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export default async function ProjectsPage() {
  const { projects } = await getProjects();
  
  return (
    <main className="max-w-7xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-white mb-8">Our Case Studies</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {projects.map((project: any) => (
          <article key={project.id} className="p-6 rounded-xl bg-slate-900 border border-slate-800">
            <img src={project.imageUrl} alt={project.title} className="rounded-lg aspect-video object-cover mb-4" />
            <span className="text-xs text-indigo-400 font-medium">{project.category}</span>
            <h2 className="text-lg font-bold text-white mt-1">{project.title}</h2>
            <p className="text-xs text-slate-400 mt-2">{project.shortDescription}</p>
          </article>
        ))}
      </div>
    </main>
  );
}`,
    services: `// app/services/page.tsx (Next.js App Router)
export const revalidate = 300;

async function getServices() {
  const res = await fetch(\`\${process.env.ADMIN_API_URL}/api/public/services\`);
  if (!res.ok) throw new Error('Failed to fetch services');
  return res.json();
}

export default async function ServicesPage() {
  const { services } = await getServices();

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-extrabold text-white">Regards Tech Services</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {services.map((service: any) => (
          <div key={service.id} className="p-6 bg-slate-900 border border-slate-800 rounded-xl">
            <h2 className="text-xl font-bold text-white">{service.name}</h2>
            <p className="text-sm text-slate-300 mt-2">{service.shortDescription}</p>
            <ul className="mt-4 space-y-1.5 text-xs text-slate-400">
              {service.features.map((feat: string, i: number) => (
                <li key={i}>✓ {feat}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}`,
    contactForm: `// components/ContactForm.tsx (Next.js Client Component)
'use client';
import { useState } from 'react';

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      const res = await fetch(\`\${process.env.NEXT_PUBLIC_ADMIN_API_URL}/api/public/contact\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to submit message');
      setStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {status === 'success' && <p className="text-emerald-400 text-sm">Message received by Regards Tech team!</p>}
      <input
        type="text"
        placeholder="Your Name"
        value={formData.name}
        onChange={e => setFormData({ ...formData, name: e.target.value })}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
      />
      <input
        type="email"
        placeholder="Your Work Email"
        value={formData.email}
        onChange={e => setFormData({ ...formData, email: e.target.value })}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
      />
      <textarea
        placeholder="Project Requirements..."
        rows={4}
        value={formData.message}
        onChange={e => setFormData({ ...formData, message: e.target.value })}
        required
        className="w-full px-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white"
      />
      <button type="submit" disabled={status === 'loading'} className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg">
        {status === 'loading' ? 'Transmitting...' : 'Send Inquiry'}
      </button>
    </form>
  );
}`,
    tracker: `// components/RegardsTracker.tsx (Next.js App Router High-Precision Telemetry)
'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

export default function RegardsTracker() {
  const pathname = usePathname() || '/';
  const baseUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000';

  const currentPageViewIdRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(0);
  const lastTrackedRef = useRef<{ path: string; time: number } | null>(null);

  const sendDurationUpdate = (pageViewId: string | null, path: string, visitorId: string) => {
    if (!pageViewId || pageStartTimeRef.current === 0) return;
    const durationSeconds = Math.round((performance.now() - pageStartTimeRef.current) / 1000);
    if (durationSeconds <= 0) return;

    const payload = JSON.stringify({ pageViewId, path, visitorId, duration: durationSeconds });
    const endpoint = \`\${baseUrl}/api/analytics/duration\`;

    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }

    try {
      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true
      }).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Persistent anonymous visitorId (localStorage - survives browser restarts)
    let visitorId = localStorage.getItem('rg_vid');
    if (!visitorId) {
      visitorId = \`vid_\${Date.now()}_\${Math.random().toString(36).substring(2, 9)}\`;
      localStorage.setItem('rg_vid', visitorId);
    }

    // 2. Session identifier (sessionStorage - scoped to current session)
    let sessionId = sessionStorage.getItem('rg_sid');
    if (!sessionId) {
      sessionId = \`sess_\${Date.now()}_\${Math.random().toString(36).substring(2, 6)}\`;
      sessionStorage.setItem('rg_sid', sessionId);
    }

    // 3. StrictMode duplicate prevention (<800ms debounce on same path)
    const now = Date.now();
    if (lastTrackedRef.current && lastTrackedRef.current.path === pathname && now - lastTrackedRef.current.time < 800) {
      return;
    }

    // 4. Send duration for previous page before starting new one
    if (currentPageViewIdRef.current) {
      sendDurationUpdate(currentPageViewIdRef.current, lastTrackedRef.current?.path || pathname, visitorId);
    }

    // 5. New page view
    const newPageViewId = \`pv_\${Date.now()}_\${Math.random().toString(36).substring(2, 7)}\`;
    currentPageViewIdRef.current = newPageViewId;
    pageStartTimeRef.current = performance.now();
    lastTrackedRef.current = { path: pathname, time: now };

    const getDevice = () => {
      const ua = navigator.userAgent.toLowerCase();
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) return 'Tablet';
      if (/mobile|android|iphone|ipod|blackberry/i.test(ua)) return 'Mobile';
      return 'Desktop';
    };

    const getBrowser = () => {
      const ua = navigator.userAgent;
      if (/Edg\\//i.test(ua)) return 'Edge';
      if (/Firefox\\//i.test(ua)) return 'Firefox';
      if (/Chrome\\//i.test(ua) && !/Edg\\//i.test(ua)) return 'Chrome';
      if (/Safari\\//i.test(ua) && !/Chrome\\//i.test(ua)) return 'Safari';
      return 'Other';
    };

    fetch(\`\${baseUrl}/api/analytics/track\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        sessionId,
        pageViewId: newPageViewId,
        path: pathname,
        referrer: document.referrer ? new URL(document.referrer).hostname : 'Direct',
        device: getDevice(),
        browser: getBrowser(),
        duration: 0
      })
    }).catch(() => {});

    // 6. Handle tab close, navigation away, visibility change
    const handleUnloadOrHide = () => {
      sendDurationUpdate(currentPageViewIdRef.current, pathname, visitorId);
    };

    window.addEventListener('pagehide', handleUnloadOrHide);
    window.addEventListener('beforeunload', handleUnloadOrHide);

    return () => {
      sendDurationUpdate(newPageViewId, pathname, visitorId);
      window.removeEventListener('pagehide', handleUnloadOrHide);
      window.removeEventListener('beforeunload', handleUnloadOrHide);
    };
  }, [pathname, baseUrl]);

  return null;
}`,
    caseStudies: `// components/CaseStudiesShowcase.tsx (Next.js Interactive Showcase with Dynamic Project Themes)
'use client';
import { useState, useEffect } from 'react';

export default function CaseStudiesShowcase() {
  const [cards, setCards] = useState<any[]>([]);
  const [active, setActive] = useState('regards');

  useEffect(() => {
    fetch(\`\${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000'}/api/public/case-studies\`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.caseStudies?.length) {
          setCards(data.caseStudies);
          setActive(data.caseStudies[0].key);
        }
      })
      .catch(() => {});
  }, []);

  const activeCard = cards.find(c => c.key === active) || cards[0];
  const accent = activeCard?.accent || '#2563EB';

  return (
    <div className="min-h-screen py-16 px-4 max-w-7xl mx-auto">
      <div className="h-1.5 w-full mb-8 rounded-full" style={{ backgroundColor: accent }} />
      <div className="grid lg:grid-cols-[300px_1fr] gap-8">
        <aside className="space-y-3">
          {cards.map(c => (
            <button
              key={c.key}
              onClick={() => setActive(c.key)}
              className={\`w-full text-left p-4 rounded-xl border transition-all \${
                active === c.key ? 'bg-white shadow-lg border-blue-500 ring-1 ring-blue-500' : 'bg-stone-50 border-stone-200'
              }\`}
            >
              <div className="font-bold text-stone-900">{c.title}</div>
              <p className="text-xs text-stone-500">{c.subtitle}</p>
            </button>
          ))}
        </aside>

        {activeCard && (
          <main className="p-8 bg-white border border-stone-200 rounded-2xl shadow-xl">
            <h1 className="text-3xl font-bold text-stone-900">{activeCard.title}</h1>
            <p className="text-stone-600 mt-1">{activeCard.subtitle}</p>
            <img src={activeCard.image} alt={activeCard.title} className="w-full aspect-video object-cover rounded-xl mt-6" />
            <div className="mt-6 flex justify-between items-center">
              <a href={activeCard.link} target="_blank" className="text-sm font-semibold underline" style={{ color: accent }}>
                Visit Live Site ↗
              </a>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}`,
    blogs: `// components/BlogSection.tsx (Next.js Dynamic Blog Articles Feed)
'use client';
import { useEffect, useState } from 'react';

export default function BlogSection() {
  const [blogs, setBlogs] = useState<any[]>([]);

  useEffect(() => {
    fetch(\`\${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000'}/api/public/blogs\`)
      .then(res => res.json())
      .then(data => { if (data.success) setBlogs(data.blogs); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 max-w-7xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-stone-900 mb-8 font-serif">Latest Insights & Blog</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {blogs.map(b => (
          <article key={b.id} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md">
            <img src={b.featuredImage} alt={b.title} className="w-full aspect-video object-cover" />
            <div className="p-6">
              <span className="text-xs font-semibold text-blue-600">{b.category}</span>
              <h3 className="text-lg font-bold text-stone-900 mt-2 line-clamp-2">{b.title}</h3>
              <p className="text-xs text-stone-600 mt-2 line-clamp-3">{b.excerpt}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}`,
    testimonials: `// components/TestimonialsSection.tsx (Next.js Client Reviews with Star Ratings)
'use client';
import { useEffect, useState } from 'react';

export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<any[]>([]);

  useEffect(() => {
    fetch(\`\${process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:3000'}/api/public/testimonials\`)
      .then(res => res.json())
      .then(data => { if (data.success) setTestimonials(data.testimonials); })
      .catch(() => {});
  }, []);

  return (
    <section className="py-16 bg-stone-50 border-t border-stone-200">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-stone-900 mb-12 font-serif">Client Testimonials</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map(t => (
            <div key={t.id} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex text-amber-400 mb-3">{'★'.repeat(t.rating || 5)}</div>
              <blockquote className="text-stone-700 text-sm italic mb-6">"{t.review}"</blockquote>
              <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
                <img src={t.clientPhoto} alt={t.clientName} className="w-10 h-10 rounded-full object-cover" />
                <div>
                  <div className="text-sm font-bold text-stone-900">{t.clientName}</div>
                  <div className="text-xs text-stone-500">{t.position} · {t.company}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}`,
    nextauth: `// app/api/auth/[...nextauth]/route.ts (Next.js NextAuth Credential Provider)
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Regards Tech Admin Backend",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@regardstech.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const res = await fetch(\`\${process.env.ADMIN_API_URL}/api/auth/nextauth/verify-credentials\`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
            apiKey: process.env.NEXTAUTH_SECRET
          })
        });

        const data = await res.json();
        if (data.success && data.user) {
          return data.user;
        }
        return null;
      }
    })
  ],
  pages: {
    signIn: "/admin/login",
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    }
  },
  session: { strategy: "jwt" as const }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };`
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Next.js REST API Architecture & NextAuth Hub</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Everything your existing Next.js website needs to consume Regards Tech database records and track visitor analytics
        </p>
      </div>

      {/* Port 3000 vs 3001 & RegardsTracker Setup Helper Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/40 via-indigo-950/40 to-slate-900 border border-indigo-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              PORT 3000 vs 3001 SETUP
            </span>
            <span className="text-xs font-semibold text-white">How to run Website & Admin concurrently</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Run this Admin API on <code className="text-indigo-400 font-mono">http://localhost:3000</code>. In your Next.js website, run on port 3001 using <code className="text-emerald-400 font-mono">next dev -p 3001</code> and add <code className="text-cyan-400 font-mono">&lt;RegardsTracker /&gt;</code> to your RootLayout!
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('snippets')}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors flex items-center gap-1.5"
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>View Tracker Code</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 p-1 bg-slate-900 border border-slate-800 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('tester')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'tester' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Play className="w-3.5 h-3.5" />
          <span>Interactive REST Tester</span>
        </button>

        <button
          onClick={() => setActiveTab('snippets')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'snippets' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Next.js Code Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('nextauth')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            activeTab === 'nextauth' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>NextAuth Authentication Setup</span>
        </button>
      </div>

      {/* Tab 1: Interactive Tester */}
      {activeTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Endpoints List */}
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
              <div className="text-xs font-semibold text-white mb-2">Available Public REST Endpoints</div>
              
              <button
                onClick={() => handleTestGet('/api/public/projects')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  selectedEndpoint === '/api/public/projects'
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-[11px]">/api/public/projects</span>
                </div>
                <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleTestGet('/api/public/services')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  selectedEndpoint === '/api/public/services'
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-[11px]">/api/public/services</span>
                </div>
                <Layers className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleTestGet('/api/public/blogs')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  selectedEndpoint === '/api/public/blogs'
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-[11px]">/api/public/blogs</span>
                </div>
                <Code2 className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleTestGet('/api/public/testimonials')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  selectedEndpoint === '/api/public/testimonials'
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-[11px]">/api/public/testimonials</span>
                </div>
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              </button>

              <button
                onClick={() => handleTestGet('/api/public/company')}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-left text-xs transition-colors ${
                  selectedEndpoint === '/api/public/company'
                    ? 'bg-indigo-950/60 border-indigo-500/50 text-white'
                    : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">GET</span>
                  <span className="font-mono text-[11px]">/api/public/company</span>
                </div>
                <Server className="w-3.5 h-3.5 text-slate-500" />
              </button>
            </div>

            {/* Test Contact Form Submission */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-white mb-2">
                <span className="px-1.5 py-0.5 rounded-sm bg-indigo-500/20 text-indigo-400 font-mono text-[10px] font-bold">POST</span>
                <span>Test Next.js Contact Submission</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">
                Simulate a client submitting the form on the public website.
              </p>

              <form onSubmit={handleTestContactSubmit} className="space-y-2 text-xs">
                <input
                  type="text"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  placeholder="Client Name"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <input
                  type="email"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  placeholder="Client Email"
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white font-mono"
                />
                <textarea
                  rows={2}
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  placeholder="Message..."
                  required
                  className="w-full px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white"
                />
                <button
                  type="submit"
                  disabled={isSubmittingForm}
                  className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>Send Test POST Request</span>
                </button>
              </form>
            </div>
          </div>

          {/* Live Response Console */}
          <div className="lg:col-span-2 p-5 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs text-white font-semibold">{selectedEndpoint}</span>
                </div>
                <button
                  onClick={() => handleCopy(apiResponse, 'response')}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                >
                  {copiedKey === 'response' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'response' ? 'Copied' : 'Copy JSON'}</span>
                </button>
              </div>

              <div className="mt-4 font-mono text-[11px] text-emerald-400 overflow-x-auto max-h-[460px] leading-relaxed">
                <pre>{apiResponse}</pre>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>Ready for Next.js App Router & Pages Router</span>
              <span className="font-mono text-[11px] text-slate-500">Content-Type: application/json</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Next.js Code Generator */}
      {activeTab === 'snippets' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
            <h3 className="text-sm font-semibold text-white mb-1">Copy-and-Paste Next.js Architecture</h3>
            <p className="text-xs text-slate-400">
              Integrate the Regards Tech Admin REST backend into your Next.js project with zero friction.
            </p>
          </div>

          {/* Snippet 1: Projects */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">1. Next.js App Router: Projects Page</h4>
                <p className="text-[11px] text-slate-400 font-mono">app/projects/page.tsx</p>
              </div>
              <button
                onClick={() => handleCopy(codeSnippets.projects, 'proj_code')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                {copiedKey === 'proj_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'proj_code' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
              {codeSnippets.projects}
            </pre>
          </div>

          {/* Snippet 2: Contact Form */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">2. Next.js Contact Form Component</h4>
                <p className="text-[11px] text-slate-400 font-mono">components/ContactForm.tsx</p>
              </div>
              <button
                onClick={() => handleCopy(codeSnippets.contactForm, 'contact_code')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                {copiedKey === 'contact_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'contact_code' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
              {codeSnippets.contactForm}
            </pre>
          </div>

          {/* Snippet 3: Visitor Analytics Auto-Tracker */}
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">3. Visitor Telemetry Auto-Tracker Component</h4>
                <p className="text-[11px] text-slate-400 font-mono">components/RegardsTracker.tsx (Include in app/layout.tsx)</p>
              </div>
              <button
                onClick={() => handleCopy(codeSnippets.tracker, 'tracker_code')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                {copiedKey === 'tracker_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'tracker_code' ? 'Copied' : 'Copy Code'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
              {codeSnippets.tracker}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: NextAuth Authentication */}
      {activeTab === 'nextauth' && (
        <div className="space-y-6">
          <div className="p-5 bg-indigo-950/30 border border-indigo-800/60 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-white">NextAuth Credential Provider Integration</h3>
            </div>
            <p className="text-xs text-indigo-200/90 leading-relaxed">
              If your Next.js application uses NextAuth, use the built-in verified endpoint{' '}
              <code className="bg-indigo-950 px-1 py-0.5 rounded text-white font-mono">
                POST /api/auth/nextauth/verify-credentials
              </code>
              . It hashes and validates admin credentials against the Regards Tech database and returns a validated NextAuth user session!
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-semibold text-white">NextAuth Handler Implementation</h4>
                <p className="text-[11px] text-slate-400 font-mono">app/api/auth/[...nextauth]/route.ts</p>
              </div>
              <button
                onClick={() => handleCopy(codeSnippets.nextauth, 'nextauth_code')}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 text-xs text-slate-300 hover:text-white"
              >
                {copiedKey === 'nextauth_code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'nextauth_code' ? 'Copied' : 'Copy NextAuth Route'}</span>
              </button>
            </div>
            <pre className="p-4 bg-slate-950 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
              {codeSnippets.nextauth}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
