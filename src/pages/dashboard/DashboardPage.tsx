import React, { useState, useEffect } from 'react';
import {
  Users,
  Briefcase,
  Layers,
  FileText,
  MessageSquare,
  Shield,
  UserCheck,
  TrendingUp,
  ArrowUpRight,
  RefreshCw,
  Globe,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { DashboardStats, ChartDataPoint } from '../../types/index.ts';
import { VisitorChart } from '../../components/charts/VisitorChart.tsx';
import { CardSkeleton } from '../../components/common/LoadingSkeleton.tsx';

interface DashboardPageProps {
  onSelectTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onSelectTab }) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [period, setPeriod] = useState<string>('30d');
  const [trafficSources, setTrafficSources] = useState<{ name: string; count: number; percentage: number }[]>([]);
  const [deviceAnalysis, setDeviceAnalysis] = useState<{ name: string; count: number; percentage: number }[]>([]);
  const [browserAnalysis, setBrowserAnalysis] = useState<{ name: string; count: number; percentage: number }[]>([]);
  const [topPages, setTopPages] = useState<{ url: string; title: string; views: number; percentage: number }[]>([]);
  const [geoAnalysis, setGeoAnalysis] = useState<{ country: string; count: number; percentage: number }[]>([]);
  const [recentVisitors, setRecentVisitors] = useState<{
    id: string;
    path: string;
    country: string;
    city?: string;
    device: string;
    browser: string;
    referrer: string;
    timestamp: string;
  }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadDashboardData = async (selectedPeriod = period, showSpinner = false) => {
    if (showSpinner) setIsRefreshing(true);
    try {
      const data = await api.getDashboard(selectedPeriod);
      if (data.success) {
        setStats(data.stats);
        setChartData(data.chart.data);
        setTrafficSources(data.trafficSources);
        setDeviceAnalysis(data.deviceAnalysis);
        setBrowserAnalysis(data.browserAnalysis);
        setTopPages(data.topPages);
        setGeoAnalysis(data.geographicAnalysis);
        if (data.recentVisitors) {
          setRecentVisitors(data.recentVisitors);
        }
      }
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(period);
  }, [period]);

  if (isLoading && !stats) {
    return (
      <div className="space-y-6">
        <CardSkeleton count={4} />
        <CardSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Welcome Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Regards Tech Executive Overview</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry, active marketing pipelines, and website visitor metrics
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => loadDashboardData(period, true)}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => onSelectTab('projects')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white shadow-xs transition-colors"
          >
            <span>Manage Content</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 9. Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Visitors Today / Month / Year */}
        <div
          onClick={() => onSelectTab('analytics')}
          className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-slate-700/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">Today's Visitors</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {stats?.visitors.today.toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-emerald-400 font-medium inline-flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> Live
              </span>
              <span>·</span>
              <span>{(stats?.visitors.month || 0).toLocaleString()} this month</span>
              <span>·</span>
              <span className="text-indigo-400">{(stats?.visitors.year || stats?.visitors.total || 0).toLocaleString()} this year</span>
            </div>
          </div>
        </div>

        {/* Card 2: Total Projects */}
        <div
          onClick={() => onSelectTab('projects')}
          className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-slate-700/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">Projects</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Briefcase className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {stats?.projects.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-emerald-400">{stats?.projects.published} Published</span>
              <span>·</span>
              <span>Portfolio live</span>
            </div>
          </div>
        </div>

        {/* Card 3: Total Services */}
        <div
          onClick={() => onSelectTab('services')}
          className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-slate-700/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">Services Offered</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {stats?.services.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              <span className="text-cyan-400">{stats?.services.active} Active</span>
              <span>·</span>
              <span>Next.js API ready</span>
            </div>
          </div>
        </div>

        {/* Card 4: Contact Inquiries */}
        <div
          onClick={() => onSelectTab('messages')}
          className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/80 shadow-xs flex flex-col justify-between hover:border-slate-700/80 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 group-hover:text-white transition-colors">Contact Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-white font-mono tabular-nums">
              {stats?.messages.total}
            </div>
            <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
              {(stats?.messages.unread || 0) > 0 ? (
                <span className="text-rose-400 font-semibold">{stats?.messages.unread} Unread messages</span>
              ) : (
                <span className="text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> All caught up
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Stats Row: Blogs, Testimonials, Admins, Month visitors */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <FileText className="w-3.5 h-3.5 text-indigo-400" />
            <span>Blog CMS</span>
          </div>
          <div className="mt-2 text-lg font-bold text-white font-mono tabular-nums">
            {stats?.blogs.total} <span className="text-xs font-normal text-slate-400 font-sans">({stats?.blogs.published} pub)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Shield className="w-3.5 h-3.5 text-amber-400" />
            <span>Testimonials</span>
          </div>
          <div className="mt-2 text-lg font-bold text-white font-mono tabular-nums">
            {stats?.testimonials.total} <span className="text-xs font-normal text-slate-400 font-sans">verified</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Admin Accounts</span>
          </div>
          <div className="mt-2 text-lg font-bold text-white font-mono tabular-nums">
            {stats?.admins.total} <span className="text-xs font-normal text-slate-400 font-sans">active</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/60">
          <div className="flex items-center gap-2 text-slate-400 text-xs">
            <Globe className="w-3.5 h-3.5 text-cyan-400" />
            <span>30-Day Visitors</span>
          </div>
          <div className="mt-2 text-lg font-bold text-white font-mono tabular-nums">
            {stats?.visitors.month.toLocaleString()}
          </div>
        </div>
      </div>

      {/* 11. Interactive Visitor Analytics Chart */}
      <VisitorChart
        data={chartData}
        period={period}
        onPeriodChange={p => setPeriod(p)}
        isLoading={isRefreshing}
      />

      {/* 12. Deep Breakdown: Traffic Sources & Device Analysis & Top Pages */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traffic Sources */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white tracking-tight uppercase">Traffic Referral Sources</h3>
            <span className="text-[11px] text-slate-400">Total Shares</span>
          </div>
          <div className="space-y-3">
            {trafficSources.map(src => (
              <div key={src.name} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium">{src.name}</span>
                  <span className="font-mono text-slate-400 tabular-nums">
                    {src.count} ({src.percentage}%)
                  </span>
                </div>
                <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${src.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device & Browser Analysis */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white tracking-tight uppercase">Device & Platform Split</h3>
            <span className="text-[11px] text-slate-400">Client Info</span>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-5">
            {deviceAnalysis.map(dev => (
              <div key={dev.name} className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 text-center">
                {dev.name === 'Desktop' && <Monitor className="w-4 h-4 text-indigo-400 mx-auto mb-1" />}
                {dev.name === 'Mobile' && <Smartphone className="w-4 h-4 text-emerald-400 mx-auto mb-1" />}
                {dev.name === 'Tablet' && <Tablet className="w-4 h-4 text-amber-400 mx-auto mb-1" />}
                <div className="text-xs font-bold text-white font-mono tabular-nums">{dev.percentage}%</div>
                <div className="text-[10px] text-slate-400 truncate">{dev.name}</div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800/80 pt-3">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Browser Distribution</div>
            <div className="space-y-2">
              {browserAnalysis.map(b => (
                <div key={b.name} className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">{b.name}</span>
                  <span className="font-mono text-slate-400 tabular-nums">{b.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Pages Viewed */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-white tracking-tight uppercase">Top Website Pages</h3>
            <span className="text-[11px] text-slate-400">Views</span>
          </div>
          <div className="space-y-3">
            {topPages.map(page => (
              <div key={page.url} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300 font-medium truncate max-w-[170px]" title={page.title}>
                    {page.title}
                  </span>
                  <span className="font-mono text-indigo-400 font-semibold tabular-nums">
                    {page.views.toLocaleString()}
                  </span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">{page.url}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 13. Geographic Breakdown + Recent Administrative Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Analysis */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-semibold text-white tracking-tight uppercase">Geographic Visitor Traffic</h3>
            </div>
            <span className="text-[11px] text-slate-400">Top Countries</span>
          </div>

          <div className="space-y-2.5">
            {geoAnalysis.slice(0, 6).map(g => (
              <div key={g.country} className="flex items-center justify-between py-1 border-b border-slate-800/40 text-xs">
                <span className="text-slate-300">{g.country}</span>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-400 tabular-nums">{g.count} visitors</span>
                  <span className="px-1.5 py-0.5 rounded-sm bg-slate-800 font-mono text-[10px] text-slate-300 tabular-nums">
                    {g.percentage}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 13. Recent Website Visitors Stream */}
        <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs font-semibold text-white tracking-tight uppercase">Live Website Visitor Activity</h3>
            </div>
            <button
              onClick={() => onSelectTab('analytics')}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Full Telemetry →
            </button>
          </div>

          <div className="space-y-2.5">
            {recentVisitors.slice(0, 6).map(v => (
              <div key={v.id} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950/40 border border-slate-800/60 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-1.5 rounded-md bg-indigo-500/10 text-indigo-400 shrink-0">
                    {v.device === 'Mobile' ? (
                      <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    ) : v.device === 'Tablet' ? (
                      <Tablet className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Monitor className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-medium truncate font-mono text-[11px]">{v.path}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1.5">
                      <span className="text-slate-300">{v.country}{v.city ? `, ${v.city}` : ''}</span>
                      <span>·</span>
                      <span className="text-slate-500">{v.browser}</span>
                      <span>·</span>
                      <span className="text-indigo-400/80">{v.device}</span>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono shrink-0 pl-2">
                  {new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
