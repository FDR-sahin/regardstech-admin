"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

export interface TrackerOptions {
  apiUrl?: string;
}

const TIMEZONE_GEO_MAP: Record<string, { country: string; city: string }> = {
  "Asia/Dhaka": { country: "Bangladesh", city: "Dhaka" },
  "Asia/Kolkata": { country: "India", city: "New Delhi" },
  "Asia/Calcutta": { country: "India", city: "Kolkata" },
  "Asia/Karachi": { country: "Pakistan", city: "Karachi" },
  "Asia/Dubai": { country: "United Arab Emirates", city: "Dubai" },
  "Asia/Riyadh": { country: "Saudi Arabia", city: "Riyadh" },
  "Asia/Singapore": { country: "Singapore", city: "Singapore" },
  "Asia/Tokyo": { country: "Japan", city: "Tokyo" },
  "Asia/Bangkok": { country: "Thailand", city: "Bangkok" },
  "Asia/Kuala_Lumpur": { country: "Malaysia", city: "Kuala Lumpur" },
  "Europe/London": { country: "United Kingdom", city: "London" },
  "Europe/Berlin": { country: "Germany", city: "Berlin" },
  "Europe/Paris": { country: "France", city: "Paris" },
  "Europe/Amsterdam": { country: "Netherlands", city: "Amsterdam" },
  "Europe/Dublin": { country: "Ireland", city: "Dublin" },
  "America/New_York": { country: "United States", city: "New York" },
  "America/Chicago": { country: "United States", city: "Chicago" },
  "America/Los_Angeles": { country: "United States", city: "Los Angeles" },
  "America/Toronto": { country: "Canada", city: "Toronto" },
  "America/Vancouver": { country: "Canada", city: "Vancouver" },
  "Australia/Sydney": { country: "Australia", city: "Sydney" },
  "Australia/Melbourne": { country: "Australia", city: "Melbourne" },
};

function resolveClientGeo(): { country: string; city: string } {
  if (typeof window === "undefined") return { country: "Bangladesh", city: "Dhaka" };

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_GEO_MAP[tz]) return TIMEZONE_GEO_MAP[tz];
    if (tz && tz.includes("Dhaka")) return { country: "Bangladesh", city: "Dhaka" };
    if (tz && (tz.includes("Kolkata") || tz.includes("Calcutta"))) return { country: "India", city: "Kolkata" };
  } catch {
    // ignore
  }

  const lang = navigator.language || "";
  if (lang.includes("bn") || lang.includes("BD")) {
    return { country: "Bangladesh", city: "Dhaka" };
  }

  return { country: "Bangladesh", city: "Dhaka" };
}

function getOrSetStorage(storage: Storage, key: string, gen: () => string): string {
  try {
    let val = storage.getItem(key);
    if (!val) {
      val = gen();
      storage.setItem(key, val);
    }
    return val;
  } catch {
    return gen();
  }
}

function detectDevice(): "Desktop" | "Mobile" | "Tablet" {
  if (typeof window === "undefined") return "Desktop";
  const ua = navigator.userAgent.toLowerCase();
  const width = window.innerWidth;
  if (/tablet|ipad|playbook|silk/i.test(ua) || (width >= 640 && width <= 1024)) {
    return "Tablet";
  }
  if (/mobile|android|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua) || width < 640) {
    return "Mobile";
  }
  return "Desktop";
}

function detectBrowser(): "Chrome" | "Safari" | "Firefox" | "Edge" | "Other" {
  if (typeof window === "undefined") return "Chrome";
  const ua = navigator.userAgent;
  if (/Edg\//i.test(ua)) return "Edge";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) return "Chrome";
  if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) return "Safari";
  return "Other";
}

function normalizeReferrer(): string {
  if (typeof window === "undefined" || !document.referrer) return "Direct";
  try {
    const host = new URL(document.referrer).hostname.toLowerCase();
    if (host.includes(window.location.hostname)) return "Internal";
    if (host.includes("google")) return "Google Organic";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("facebook") || host.includes("fb.me")) return "Facebook";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "Twitter / X";
    return host;
  } catch {
    return "Direct";
  }
}

export function RegardsTracker({ apiUrl }: TrackerOptions = {}) {
  const pathname = usePathname() || "/";
  const baseUrl =
    apiUrl ||
    process.env.NEXT_PUBLIC_REGARDS_API_URL ||
    process.env.NEXT_PUBLIC_ADMIN_API_URL ||
    "http://localhost:3000";

  const currentPageViewIdRef = useRef<string | null>(null);
  const pageStartTimeRef = useRef<number>(0);
  const visitorIdRef = useRef<string>("");
  const currentPathRef = useRef<string>(pathname);

  // Helper to send duration beacon
  const sendDurationUpdate = (pageViewId: string | null, targetPath: string, visitorId: string) => {
    if (!pageViewId || pageStartTimeRef.current === 0) return;
    const durationSeconds = Math.max(1, Math.round((Date.now() - pageStartTimeRef.current) / 1000));
    if (durationSeconds <= 0) return;

    const payload = JSON.stringify({
      pageViewId,
      path: targetPath,
      visitorId,
      duration: durationSeconds,
    });
    const endpoint = `${baseUrl}/api/analytics/duration`;

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon(endpoint, blob)) return;
    }

    try {
      fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Visitor and Session IDs
    const visitorId = getOrSetStorage(
      localStorage,
      "rg_vid",
      () => `vid_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
    const sessionId = getOrSetStorage(
      sessionStorage,
      "rg_sid",
      () => `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    );
    visitorIdRef.current = visitorId;

    // 2. Close out previous page view duration if exists
    if (currentPageViewIdRef.current && currentPathRef.current !== pathname) {
      sendDurationUpdate(currentPageViewIdRef.current, currentPathRef.current, visitorId);
    }

    // 3. Start new tracking session for current pathname
    const pageViewId = `pv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    currentPageViewIdRef.current = pageViewId;
    pageStartTimeRef.current = Date.now();
    currentPathRef.current = pathname;

    const geo = resolveClientGeo();
    const device = detectDevice();
    const browser = detectBrowser();
    const referrer = normalizeReferrer();

    // 4. Send initial page view hit to backend
    fetch(`${baseUrl}/api/analytics/track`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pageViewId,
        visitorId,
        sessionId,
        path: pathname,
        title: typeof document !== "undefined" ? document.title : "",
        referrer,
        device,
        browser,
        country: geo.country,
        city: geo.city,
        duration: 0,
      }),
      keepalive: true,
    }).catch(() => {});

    // 5. Periodic heartbeat duration update (every 20s while viewing page)
    const intervalTimer = setInterval(() => {
      sendDurationUpdate(pageViewId, pathname, visitorId);
    }, 20000);

    // 6. Handle tab visibility change & unload
    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        sendDurationUpdate(pageViewId, pathname, visitorId);
      }
    };

    const handleBeforeUnload = () => {
      sendDurationUpdate(pageViewId, pathname, visitorId);
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(intervalTimer);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Send final duration on route exit
      sendDurationUpdate(pageViewId, pathname, visitorId);
    };
  }, [pathname, baseUrl]);

  return null;
}

export default RegardsTracker;
