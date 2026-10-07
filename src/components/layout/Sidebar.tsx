import React from 'react';
import {
  LayoutDashboard,
  BarChart3,
  Briefcase,
  FolderKanban,
  Layers,
  FileText,
  MessageSquare,
  Users,
  Shield,
  LogOut,
  X,
  Code2,
  Globe,
  ExternalLink,
  Mail
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { BrandLogo } from '../common/BrandLogo.tsx';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  unreadMessagesCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpen,
  onClose,
  unreadMessagesCount = 0
}) => {
  const { admin, logout, hasPermission, isSuperAdmin } = useAuth();

  const handleNavClick = (tab: string) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800/80">
          <div className="flex items-center gap-2">
            <BrandLogo size="md" lightMode={false} />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-md lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Link to Live Website */}
        <div className="px-3 pt-3">
          <a
            href="https://regardstech.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-blue-950/40 border border-blue-500/40 text-blue-400 hover:bg-blue-900/30 text-xs font-semibold transition-colors group"
          >
            <div className="flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              <span>regardstech.com</span>
            </div>
            <ExternalLink className="w-3 h-3 text-blue-400 group-hover:translate-x-0.5 transition-transform" />
          </a>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto">
          {/* Main Group */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Analytics & Overview
            </div>
            <div className="space-y-1">
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentTab === 'dashboard'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                <span>Dashboard</span>
              </button>

              <button
                onClick={() => handleNavClick('analytics')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentTab === 'analytics'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <BarChart3 className="w-4 h-4 shrink-0" />
                <span>Visitor Analytics</span>
              </button>
            </div>
          </div>

          {/* Content Group */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Website Content CMS
            </div>
            <div className="space-y-1">
              {hasPermission('projects', 'view') && (
                <>
                  <button
                    onClick={() => handleNavClick('projects')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'projects'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 shrink-0" />
                    <span>Projects</span>
                  </button>

                  <button
                    onClick={() => handleNavClick('casestudies')}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      currentTab === 'casestudies'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-900'
                    }`}
                  >
                    <FolderKanban className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>Case Studies</span>
                  </button>
                </>
              )}

              {hasPermission('services', 'view') && (
                <button
                  onClick={() => handleNavClick('services')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'services'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Layers className="w-4 h-4 shrink-0" />
                  <span>Services</span>
                </button>
              )}

              {hasPermission('blogs', 'view') && (
                <button
                  onClick={() => handleNavClick('blogs')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'blogs'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span>Blog Articles</span>
                </button>
              )}

              {hasPermission('testimonials', 'view') && (
                <button
                  onClick={() => handleNavClick('testimonials')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'testimonials'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0" />
                  <span>Client Testimonials</span>
                </button>
              )}
            </div>
          </div>

          {/* Inbound & Messages */}
          {hasPermission('messages', 'view') && (
            <div>
              <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                Leads & Messages
              </div>
              <button
                onClick={() => handleNavClick('messages')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentTab === 'messages'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>Contact Inquiries</span>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-rose-500 text-white rounded-md tabular-nums">
                    {unreadMessagesCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Settings & Integrations */}
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
              Management
            </div>
            <div className="space-y-1">
              {isSuperAdmin && (
                <button
                  onClick={() => handleNavClick('admins')}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                    currentTab === 'admins'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Admins & Access</span>
                </button>
              )}

              <button
                onClick={() => handleNavClick('nextjs')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentTab === 'nextjs'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Code2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>Website Integration</span>
              </button>

              <button
                onClick={() => handleNavClick('emails')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  currentTab === 'emails'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0 text-indigo-400" />
                <span>Email & SMTP Setup</span>
              </button>
            </div>
          </div>
        </nav>

        {/* Clean Footer Profile & Direct Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
          <div className="flex items-center justify-between px-2 py-2 mb-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={admin?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                alt={admin?.name || 'Admin'}
                className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
              />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-white truncate">{admin?.name}</div>
                <div className="text-[10px] text-slate-400 truncate">{admin?.email}</div>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 border border-rose-900/40 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
