import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { LoginPage } from './pages/auth/LoginPage.tsx';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage.tsx';
import { VerifyEmailPage } from './pages/auth/VerifyEmailPage.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { Topbar } from './components/layout/Topbar.tsx';
import { DashboardPage } from './pages/dashboard/DashboardPage.tsx';
import { AnalyticsPage } from './pages/analytics/AnalyticsPage.tsx';
import { ProjectsPage } from './pages/projects/ProjectsPage.tsx';
import { CaseStudiesPage } from './pages/case-studies/CaseStudiesPage.tsx';
import { ServicesPage } from './pages/services/ServicesPage.tsx';
import { BlogPage } from './pages/blogs/BlogPage.tsx';
import { TestimonialsPage } from './pages/testimonials/TestimonialsPage.tsx';
import { MessagesPage } from './pages/messages/MessagesPage.tsx';
import { AdminsPage } from './pages/admins/AdminsPage.tsx';
import { AuditLogsPage } from './pages/audit/AuditLogsPage.tsx';
import { MediaPage } from './pages/media/MediaPage.tsx';
import { ProfilePage } from './pages/profile/ProfilePage.tsx';
import { NextJsIntegrationPage } from './pages/nextjs-hub/NextJsIntegrationPage.tsx';
import { EmailSimulatorPage } from './pages/dev/EmailSimulatorPage.tsx';
import { api } from './services/api.ts';
import { Loader2 } from 'lucide-react';

const AdminApp: React.FC = () => {
  const { admin, loading } = useAuth();
  const [authView, setAuthView] = useState<'login' | 'forgot-password' | 'verify-email'>('login');
  const [verifyInitialData, setVerifyInitialData] = useState<{ email?: string; token?: string }>({});
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);

  // Check URL params for verification token on mount (auto-verify on landing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const verifyToken = params.get('verifyToken') || params.get('token');
      if (verifyToken) {
        api.verifyEmail(verifyToken)
          .then((res) => {
            if (res.success) {
              const emailParam = params.get('email');
              const destUrl = emailParam ? `/?verified=true&email=${encodeURIComponent(emailParam)}` : '/?verified=true';
              window.history.replaceState({}, '', destUrl);
              setAuthView('login');
            } else {
              setVerifyInitialData({ token: verifyToken });
              setAuthView('verify-email');
            }
          })
          .catch(() => {
            setVerifyInitialData({ token: verifyToken });
            setAuthView('verify-email');
          });
      }
    }
  }, []);

  // Poll for unread messages count periodically
  useEffect(() => {
    if (!admin) return;
    const fetchUnread = async () => {
      try {
        const res = await api.getMessages({ limit: 1 });
        if (res.success) {
          setUnreadMessagesCount(res.unreadCount);
        }
      } catch {
        // Ignore background polling errors
      }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [admin]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-mono tracking-wider">Loading Regards Tech Admin…</span>
      </div>
    );
  }

  // Not authenticated: render auth subviews
  if (!admin) {
    if (authView === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onBackToLogin={() => setAuthView('login')}
          onNavigateToSimulator={() => setAuthView('login')}
        />
      );
    }
    if (authView === 'verify-email') {
      return (
        <VerifyEmailPage
          initialEmail={verifyInitialData.email}
          initialToken={verifyInitialData.token}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }
    return (
      <LoginPage
        onNavigate={(view, data) => {
          if (view === 'forgot-password') setAuthView('forgot-password');
          if (view === 'verify-email') {
            setVerifyInitialData(data || {});
            setAuthView('verify-email');
          }
        }}
      />
    );
  }

  // Authenticated Layout
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        isOpen={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Topbar
          currentTab={currentTab}
          onOpenMobileMenu={() => setMobileSidebarOpen(true)}
          onSelectTab={setCurrentTab}
          unreadCount={unreadMessagesCount}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-7xl w-full mx-auto">
          {currentTab === 'dashboard' && <DashboardPage onSelectTab={setCurrentTab} />}
          {currentTab === 'analytics' && <AnalyticsPage />}
          {currentTab === 'projects' && <ProjectsPage />}
          {currentTab === 'casestudies' && <CaseStudiesPage />}
          {currentTab === 'services' && <ServicesPage />}
          {currentTab === 'blogs' && <BlogPage />}
          {currentTab === 'testimonials' && <TestimonialsPage />}
          {currentTab === 'messages' && <MessagesPage />}
          {currentTab === 'admins' && <AdminsPage />}
          {currentTab === 'audit' && <AuditLogsPage />}
          {currentTab === 'media' && <MediaPage />}
          {currentTab === 'profile' && <ProfilePage />}
          {currentTab === 'nextjs' && <NextJsIntegrationPage />}
          {currentTab === 'emails' && (
            <EmailSimulatorPage
              onNavigateToVerify={(token, email) => {
                setVerifyInitialData({ token, email });
                setAuthView('verify-email');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AdminApp />
      </ToastProvider>
    </AuthProvider>
  );
}
