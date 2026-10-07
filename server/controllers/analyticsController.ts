import { Request, Response } from 'express';
import { db, dbManager } from '../config/db.js';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { IVisitorEvent } from '../models/types.js';

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  if (m === 0) return `${s}s`;
  if (s === 0) return `${m}m`;
  return `${m}m ${s}s`;
}

const ISO_COUNTRY_NAMES: Record<string, string> = {
  BD: 'Bangladesh',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  DE: 'Germany',
  FR: 'France',
  IN: 'India',
  AU: 'Australia',
  SG: 'Singapore',
  AE: 'United Arab Emirates',
  SA: 'Saudi Arabia',
  NL: 'Netherlands',
  JP: 'Japan'
};

function detectCountry(req: Request, clientCountry?: string): { country: string; city: string } {
  const cfCountry = req.headers['cf-ipcountry'] as string;
  if (cfCountry && cfCountry.length === 2 && cfCountry !== 'XX') {
    return { country: ISO_COUNTRY_NAMES[cfCountry.toUpperCase()] || cfCountry, city: (req.headers['cf-ipcity'] as string) || '' };
  }

  const vercelCountry = req.headers['x-vercel-ip-country'] as string;
  if (vercelCountry && vercelCountry.length === 2) {
    return { country: ISO_COUNTRY_NAMES[vercelCountry.toUpperCase()] || vercelCountry, city: (req.headers['x-vercel-ip-city'] as string) || '' };
  }

  const countryHeader = (req.headers['x-country-code'] || req.headers['x-country']) as string;
  if (countryHeader && countryHeader.trim()) {
    return { country: countryHeader.trim(), city: (req.headers['x-city'] as string) || '' };
  }

  if (clientCountry && clientCountry.trim() && clientCountry !== 'Unknown') {
    return { country: clientCountry.trim(), city: '' };
  }

  const acceptLang = req.headers['accept-language'];
  if (acceptLang && (acceptLang.includes('bn') || acceptLang.includes('BD'))) {
    return { country: 'Bangladesh', city: 'Dhaka' };
  }

  return { country: clientCountry && clientCountry !== 'Unknown' ? clientCountry : 'Direct / Local', city: '' };
}

export class AnalyticsController {
  // GET /api/analytics/dashboard
  static getDashboard(req: AuthenticatedRequest, res: Response) {
    const { period = '30d', startDate, endDate } = req.query;
    const now = new Date();

    // 1. Overall database counts
    const totalProjects = db.projects.length;
    const publishedProjects = db.projects.filter(p => p.status === 'published').length;
    const totalServices = db.services.length;
    const activeServices = db.services.filter(s => s.status === 'active').length;
    const totalBlogs = db.blogs.length;
    const publishedBlogs = db.blogs.filter(b => b.status === 'published').length;
    const totalTestimonials = db.testimonials.length;
    const totalMessages = db.messages.length;
    const unreadMessages = db.messages.filter(m => m.status === 'unread').length;
    const totalAdmins = db.admins.length;

    // 2. Filter events by selected period
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart.getTime() - 86400000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const allEvents = db.visitorEvents || [];

    let periodStart: Date = thirtyDaysAgo;
    let periodEnd: Date = now;
    let filteredEvents = allEvents;

    if (period === 'today') {
      periodStart = todayStart;
      filteredEvents = allEvents.filter(e => new Date(e.timestamp) >= todayStart);
    } else if (period === 'yesterday') {
      periodStart = yesterdayStart;
      periodEnd = todayStart;
      filteredEvents = allEvents.filter(e => {
        const d = new Date(e.timestamp);
        return d >= yesterdayStart && d < todayStart;
      });
    } else if (period === '7d') {
      periodStart = sevenDaysAgo;
      filteredEvents = allEvents.filter(e => new Date(e.timestamp) >= sevenDaysAgo);
    } else if (period === '30d') {
      periodStart = thirtyDaysAgo;
      filteredEvents = allEvents.filter(e => new Date(e.timestamp) >= thirtyDaysAgo);
    } else if (period === 'this_month' || period === 'month') {
      periodStart = monthStart;
      filteredEvents = allEvents.filter(e => new Date(e.timestamp) >= monthStart);
    } else if (period === 'this_year' || period === 'year') {
      periodStart = yearStart;
      filteredEvents = allEvents.filter(e => new Date(e.timestamp) >= yearStart);
    } else if (startDate && endDate) {
      periodStart = new Date(String(startDate));
      periodEnd = new Date(String(endDate));
      filteredEvents = allEvents.filter(e => {
        const d = new Date(e.timestamp);
        return d >= periodStart && d <= periodEnd;
      });
    }

    // 3. Visitor & Page View metrics (Correctly distinguishing Unique Visitor vs Page View vs Sessions)
    const uniqueVisitorIds = new Set(filteredEvents.map(e => e.visitorId || e.sessionId));
    const uniqueVisitors = uniqueVisitorIds.size;
    const totalPageViews = filteredEvents.length;
    const totalSessions = new Set(filteredEvents.map(e => e.sessionId)).size;

    // New vs Returning visitors:
    // A visitor is "new" if their earliest event across the ENTIRE database is inside the selected period
    let newVisitorsCount = 0;
    uniqueVisitorIds.forEach(vid => {
      const firstEvent = allEvents.find(e => (e.visitorId || e.sessionId) === vid);
      if (firstEvent && new Date(firstEvent.timestamp) >= periodStart) {
        newVisitorsCount += 1;
      }
    });
    const returningVisitorsCount = Math.max(0, uniqueVisitors - newVisitorsCount);

    // Duration stats
    const totalDurationSeconds = filteredEvents.reduce((acc, e) => acc + (Number(e.duration) || 0), 0);
    const avgDurationSeconds = totalPageViews > 0 ? Math.round(totalDurationSeconds / totalPageViews) : 0;

    // Macro stats for quick dashboard cards (Unique Visitors by persistent visitorId)
    const totalAllTimeVisitors = new Set(allEvents.map(e => e.visitorId || e.sessionId)).size;
    const visitorsToday = new Set(allEvents.filter(e => new Date(e.timestamp) >= todayStart).map(e => e.visitorId || e.sessionId)).size;
    const visitorsThisWeek = new Set(allEvents.filter(e => new Date(e.timestamp) >= sevenDaysAgo).map(e => e.visitorId || e.sessionId)).size;
    const visitorsThisMonth = new Set(allEvents.filter(e => new Date(e.timestamp) >= thirtyDaysAgo).map(e => e.visitorId || e.sessionId)).size;
    const visitorsThisYear = new Set(allEvents.filter(e => new Date(e.timestamp) >= yearStart).map(e => e.visitorId || e.sessionId)).size;

    // 4. Time-Series Chart Data
    interface ChartPoint {
      date: string;
      label: string;
      visitors: number;
      pageViews: number;
    }
    const chartData: ChartPoint[] = [];

    if (period === 'today' || period === 'yesterday') {
      for (let h = 0; h < 24; h++) {
        const label = `${h.toString().padStart(2, '0')}:00`;
        const hourEvents = filteredEvents.filter(e => new Date(e.timestamp).getHours() === h);
        const uniqueInHour = new Set(hourEvents.map(e => e.visitorId || e.sessionId)).size;
        chartData.push({
          date: label,
          label,
          visitors: uniqueInHour,
          pageViews: hourEvents.length
        });
      }
    } else if (period === '7d') {
      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now.getTime() - i * 86400000);
        const label = targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const dayEvents = allEvents.filter(e => isSameDay(new Date(e.timestamp), targetDate));
        const uniqueOnDay = new Set(dayEvents.map(e => e.visitorId || e.sessionId)).size;
        chartData.push({
          date: targetDate.toISOString().split('T')[0],
          label,
          visitors: uniqueOnDay,
          pageViews: dayEvents.length
        });
      }
    } else {
      // 30 days default or other ranges
      const daysCount = period === 'this_year' ? 12 : 30;
      if (daysCount === 12) {
        for (let m = 0; m < 12; m++) {
          const d = new Date(now.getFullYear(), m, 1);
          const label = d.toLocaleDateString('en-US', { month: 'short' });
          const monthEvents = allEvents.filter(e => {
            const evDate = new Date(e.timestamp);
            return evDate.getFullYear() === now.getFullYear() && evDate.getMonth() === m;
          });
          const uniqueInMonth = new Set(monthEvents.map(e => e.visitorId || e.sessionId)).size;
          chartData.push({
            date: label,
            label,
            visitors: uniqueInMonth,
            pageViews: monthEvents.length
          });
        }
      } else {
        for (let i = 29; i >= 0; i--) {
          const targetDate = new Date(now.getTime() - i * 86400000);
          const label = targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayEvents = allEvents.filter(e => isSameDay(new Date(e.timestamp), targetDate));
          const uniqueOnDay = new Set(dayEvents.map(e => e.visitorId || e.sessionId)).size;
          chartData.push({
            date: targetDate.toISOString().split('T')[0],
            label,
            visitors: uniqueOnDay,
            pageViews: dayEvents.length
          });
        }
      }
    }

    // 5. Traffic Sources
    const sourceCounts: Record<string, number> = {
      'Direct / Bookmark': 0,
      'Google Organic': 0,
      'LinkedIn': 0,
      'Facebook': 0,
      'Twitter / X': 0,
      'Referral / Other': 0
    };
    filteredEvents.forEach(e => {
      const ref = (e.referrer || '').toLowerCase();
      if (!ref || ref === 'direct' || ref === 'none') {
        sourceCounts['Direct / Bookmark']++;
      } else if (ref.includes('google')) {
        sourceCounts['Google Organic']++;
      } else if (ref.includes('linkedin')) {
        sourceCounts['LinkedIn']++;
      } else if (ref.includes('facebook') || ref.includes('fb')) {
        sourceCounts['Facebook']++;
      } else if (ref.includes('t.co') || ref.includes('twitter') || ref.includes('x.com')) {
        sourceCounts['Twitter / X']++;
      } else {
        sourceCounts['Referral / Other']++;
      }
    });
    const trafficSources = Object.entries(sourceCounts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (filteredEvents.length || 1)) * 100)
    })).sort((a, b) => b.count - a.count);

    // 6. Device Breakdown (Desktop, Mobile, Tablet)
    const deviceCounts: Record<string, number> = { Desktop: 0, Mobile: 0, Tablet: 0 };
    filteredEvents.forEach(e => {
      const d = e.device || 'Desktop';
      if (d === 'Mobile') deviceCounts.Mobile++;
      else if (d === 'Tablet') deviceCounts.Tablet++;
      else deviceCounts.Desktop++;
    });
    const deviceAnalysis = Object.entries(deviceCounts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (filteredEvents.length || 1)) * 100)
    }));

    // 7. Browser Breakdown (Chrome, Safari, Firefox, Edge, Other)
    const browserCounts: Record<string, number> = { Chrome: 0, Safari: 0, Firefox: 0, Edge: 0, Other: 0 };
    filteredEvents.forEach(e => {
      const b = e.browser || 'Other';
      if (browserCounts[b] !== undefined) {
        browserCounts[b]++;
      } else {
        browserCounts.Other++;
      }
    });
    const browserAnalysis = Object.entries(browserCounts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / (filteredEvents.length || 1)) * 100)
    })).sort((a, b) => b.count - a.count);

    // 8. Top Pages with Duration & Unique Visitors
    const pageAggregates: Record<string, { views: number; uniqueVisitors: Set<string>; totalDuration: number }> = {};
    filteredEvents.forEach(e => {
      const p = (e.path ? e.path.trim().replace(/\/+$/, '') : '') || '/';
      if (!pageAggregates[p]) {
        pageAggregates[p] = { views: 0, uniqueVisitors: new Set(), totalDuration: 0 };
      }
      pageAggregates[p].views += 1;
      pageAggregates[p].uniqueVisitors.add(e.visitorId || e.sessionId);
      pageAggregates[p].totalDuration += (Number(e.duration) || 0);
    });

    const pageFriendlyTitles: Record<string, string> = {
      '/': 'Home',
      '/about': 'About Regards Tech',
      '/services': 'Services Overview',
      '/projects': 'Portfolio & Case Studies',
      '/casestudies': 'Interactive Case Studies',
      '/blogs': 'Tech Insights & Articles',
      '/testimonials': 'Client Reviews Wall',
      '/contact': 'Contact & Hire Form',
      '/services/web-development': 'Service: Web Development',
      '/services/cyber-security': 'Service: Cyber Security',
      '/projects/fintech-nextgen': 'Case Study: FinTech NextGen',
      '/projects/elabira': 'Case Study: Elabira E-Commerce'
    };

    const topPages = Object.entries(pageAggregates).map(([url, data]) => {
      const avgSec = data.views > 0 ? Math.round(data.totalDuration / data.views) : 0;
      return {
        url,
        title: pageFriendlyTitles[url] || url,
        views: data.views,
        uniqueVisitors: data.uniqueVisitors.size,
        totalDuration: data.totalDuration,
        totalDurationFormatted: formatDuration(data.totalDuration),
        avgDuration: avgSec,
        avgDurationFormatted: formatDuration(avgSec),
        percentage: Math.round((data.views / (filteredEvents.length || 1)) * 100)
      };
    }).sort((a, b) => b.views - a.views).slice(0, 10);

    // 9. Geographic Analysis
    const countryCounts: Record<string, number> = {};
    filteredEvents.forEach(e => {
      const c = e.country || 'Direct / Local';
      countryCounts[c] = (countryCounts[c] || 0) + 1;
    });
    const geographicAnalysis = Object.entries(countryCounts).map(([country, count]) => ({
      country,
      count,
      percentage: Math.round((count / (filteredEvents.length || 1)) * 100)
    })).sort((a, b) => b.count - a.count).slice(0, 10);

    // 10. Recent Real Visitors Stream
    const recentVisitors = [...allEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8)
      .map(e => ({
        id: e.id,
        visitorId: e.visitorId ? `${e.visitorId.slice(0, 10)}…` : 'Anonymous',
        sessionId: e.sessionId ? `${e.sessionId.slice(0, 10)}…` : 'Session',
        path: e.path,
        country: e.country || 'Direct / Local',
        city: e.city || '',
        device: e.device || 'Desktop',
        browser: e.browser || 'Chrome',
        referrer: e.referrer || 'Direct',
        duration: e.duration || 0,
        durationFormatted: formatDuration(e.duration || 0),
        isNewVisitor: e.isNewVisitor ?? true,
        timestamp: e.timestamp
      }));

    return res.json({
      success: true,
      stats: {
        visitors: {
          today: visitorsToday,
          week: visitorsThisWeek,
          month: visitorsThisMonth,
          year: visitorsThisYear,
          total: totalAllTimeVisitors,
          totalHits: allEvents.length,
          unique: uniqueVisitors,
          pageViews: totalPageViews,
          sessions: totalSessions,
          newVisitors: newVisitorsCount,
          returningVisitors: returningVisitorsCount,
          totalDuration: totalDurationSeconds,
          avgDuration: avgDurationSeconds,
          avgDurationFormatted: formatDuration(avgDurationSeconds)
        },
        projects: { total: totalProjects, published: publishedProjects },
        services: { total: totalServices, active: activeServices },
        blogs: { total: totalBlogs, published: publishedBlogs },
        testimonials: { total: totalTestimonials },
        messages: { total: totalMessages, unread: unreadMessages },
        admins: { total: totalAdmins }
      },
      chart: {
        period: String(period),
        data: chartData
      },
      trafficSources,
      deviceAnalysis,
      browserAnalysis,
      topPages,
      geographicAnalysis,
      recentVisitors
    });
  }

  // POST /api/analytics/track (Record Page View event)
  static trackEvent(req: Request, res: Response) {
    try {
      const {
        path,
        referrer,
        device,
        browser,
        country: clientCountry,
        city: clientCity,
        visitorId: clientVisitorId,
        sessionId: clientSessionId,
        pageViewId: clientPageViewId,
        duration: clientDuration
      } = req.body;

      const visitorId = clientVisitorId || `vid_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const sessionId = clientSessionId || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const pageViewId = clientPageViewId || `pv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      const { country, city } = detectCountry(req, clientCountry);

      if (!db.visitorEvents) db.visitorEvents = [];

      // Check if visitor has visited before in database
      const hasPriorVisit = db.visitorEvents.some(e => (e.visitorId || e.sessionId) === visitorId);
      const isNewVisitor = !hasPriorVisit;

      const validDevice = ['Desktop', 'Mobile', 'Tablet'].includes(device) ? device : 'Desktop';
      const validBrowser = ['Chrome', 'Safari', 'Firefox', 'Edge'].includes(browser) ? browser : (browser || 'Other');

      const event: IVisitorEvent = {
        id: pageViewId,
        pageViewId,
        visitorId,
        sessionId,
        path: path || '/',
        referrer: referrer || 'Direct',
        device: validDevice,
        browser: validBrowser,
        country: clientCountry || country,
        city: clientCity || city || '',
        duration: Number(clientDuration) || 0,
        isNewVisitor,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
        timestamp: new Date().toISOString()
      };

      db.visitorEvents.push(event);

      // Keep events bounded to prevent unbounded memory growth in long runs
      if (db.visitorEvents.length > 50000) {
        db.visitorEvents = db.visitorEvents.slice(-40000);
      }
      dbManager.save();

      return res.status(201).json({
        success: true,
        message: 'Page view recorded.',
        pageViewId,
        visitorId,
        sessionId,
        isNewVisitor
      });
    } catch (err) {
      console.error('Analytics track error:', err);
      return res.status(500).json({ success: false, message: 'Failed to record event.' });
    }
  }

  // POST /api/analytics/duration (Record page visit duration on leave/unload)
  static updateDuration(req: Request, res: Response) {
    try {
      let body = req.body;
      if (typeof body === 'string') {
        try {
          body = JSON.parse(body);
        } catch {
          // ignore
        }
      }

      const { pageViewId, duration, visitorId, path } = body || {};
      const durationSec = Math.max(0, Math.min(7200, Math.round(Number(duration) || 0)));

      if (!pageViewId && !visitorId && !path) {
        return res.status(400).json({ success: false, message: 'pageViewId, visitorId, or path required' });
      }

      if (!db.visitorEvents) db.visitorEvents = [];

      let targetEvent: IVisitorEvent | undefined;
      if (pageViewId) {
        targetEvent = db.visitorEvents.find(e => e.id === pageViewId || e.pageViewId === pageViewId);
      }
      if (!targetEvent && (visitorId || path)) {
        const cleanPath = (path ? String(path).trim().replace(/\/+$/, '') : '') || '/';
        const threeHoursAgo = Date.now() - 3 * 3600000;
        targetEvent = [...db.visitorEvents]
          .reverse()
          .find(e => {
            const ep = (e.path ? e.path.trim().replace(/\/+$/, '') : '') || '/';
            const vidMatch = visitorId ? (e.visitorId === visitorId || e.sessionId === visitorId) : true;
            return vidMatch && ep === cleanPath && new Date(e.timestamp).getTime() > threeHoursAgo;
          });
      }

      if (targetEvent) {
        targetEvent.duration = Math.max(targetEvent.duration || 0, durationSec);
        dbManager.save();
        return res.json({
          success: true,
          message: 'Duration updated.',
          pageViewId: targetEvent.id,
          duration: targetEvent.duration
        });
      }

      // If no prior page view was found (e.g. initial track failed or unloaded immediately),
      // create a visitor event now so time spent on this page is recorded
      const cleanPath = (path ? String(path).trim().replace(/\/+$/, '') : '') || '/contact';
      const fallbackEvent: IVisitorEvent = {
        id: pageViewId || `pv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        pageViewId: pageViewId || `pv_${Date.now()}`,
        visitorId: visitorId || `vid_${Date.now()}`,
        sessionId: `sess_${Date.now()}`,
        path: cleanPath,
        referrer: 'Direct',
        device: 'Desktop',
        browser: 'Chrome',
        country: 'Bangladesh',
        city: 'Dhaka',
        duration: durationSec,
        isNewVisitor: false,
        ip: (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1',
        timestamp: new Date().toISOString()
      };
      db.visitorEvents.push(fallbackEvent);
      dbManager.save();

      return res.json({
        success: true,
        message: 'Duration saved as new visit event.',
        pageViewId: fallbackEvent.id,
        duration: fallbackEvent.duration
      });
    } catch (err) {
      console.error('Analytics duration error:', err);
      return res.status(500).json({ success: false, message: 'Failed to update duration.' });
    }
  }
}
