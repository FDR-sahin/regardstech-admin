import React, { useState } from 'react';
import { Menu, Bell, User, LogOut, ExternalLink, ShieldCheck, Globe } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';

interface TopbarProps {
  currentTab: string;
  onOpenMobileMenu: () => void;
  onSelectTab: (tab: string) => void;
  unreadCount?: number;
}

export const Topbar: React.FC<TopbarProps> = ({
  currentTab,
  onOpenMobileMenu,
  onSelectTab,
  unreadCount = 0
}) => {
  const { admin, logout } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const tabTitles: Record<string, { group: string; title: string }> = {
    dashboard: { group: 'Overview', title: 'Executive Dashboard' },
    analytics: { group: 'Analytics', title: 'Website Visitor Analytics' },
    projects: { group: 'Content CMS', title: 'Projects Portfolio' },
    services: { group: 'Content CMS', title: 'Services Management' },
    blogs: { group: 'Content CMS', title: 'Blog & Articles' },
    testimonials: { group: 'Content CMS', title: 'Client Testimonials' },
    media: { group: 'Content CMS', title: 'Media Asset Library' },
    messages: { group: 'Inquiries', title: 'Contact Form Messages' },
    admins: { group: 'Access Control', title: 'Admins & Permissions' },
    audit: { group: 'Governance', title: 'System Audit Logs' },
    nextjs: { group: 'Developer Hub', title: 'Next.js REST API Integration' },
    emails: { group: 'Dev Tools', title: 'Email Outbox Simulator' },
    profile: { group: 'Account', title: 'Admin Profile Settings' }
  };

  const currentInfo = tabTitles[currentTab] || { group: 'Admin', title: 'Console' };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between">
      {/* Left: Mobile menu toggle + Contextual Breadcrumb */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 hidden sm:inline">{currentInfo.group}</span>
          <span className="text-slate-600 hidden sm:inline">/</span>
          <h1 className="text-sm font-semibold text-white tracking-tight">{currentInfo.title}</h1>
        </div>
      </div>

      {/* Right zone: Actions, Live notifications & profile */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* View Live Website Button */}
        <a
          href="https://regardstech.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-xs transition-colors"
        >
          <Globe className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">regardstech.com</span>
          <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
        </a>

        {/* Next.js live preview indicator */}
        <button
          onClick={() => onSelectTab('nextjs')}
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 hover:bg-emerald-900/30 transition-colors"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Next.js API Active</span>
          <ExternalLink className="w-3 h-3 ml-0.5" />
        </button>

        {/* Inbound Notifications */}
        <button
          onClick={() => onSelectTab('messages')}
          className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          title="Contact Messages"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Menu Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(prev => !prev)}
            className="flex items-center gap-2.5 p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          >
            <img
              src={admin?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
              alt={admin?.name || 'Admin'}
              className="w-8 h-8 rounded-full object-cover border border-slate-700"
            />
            <div className="hidden sm:block text-left">
              <div className="text-xs font-semibold text-white leading-tight">{admin?.name}</div>
              <div className="text-[10px] text-slate-400 capitalize">
                {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </div>
            </div>
          </button>

          {profileDropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 py-1.5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 text-xs">
                <div className="px-4 py-2.5 border-b border-slate-800">
                  <p className="font-semibold text-white truncate">{admin?.name}</p>
                  <p className="text-slate-400 truncate text-[11px]">{admin?.email}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <ShieldCheck className="w-3 h-3" />
                    <span>Verified · Active Session</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onSelectTab('profile');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                >
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>Account & Password</span>
                </button>

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    onSelectTab('emails');
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors text-left"
                >
                  <Bell className="w-3.5 h-3.5 text-slate-400" />
                  <span>Dev Outbox / OTPs</span>
                </button>

                <div className="my-1 border-t border-slate-800" />

                <button
                  onClick={() => {
                    setProfileDropdownOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
