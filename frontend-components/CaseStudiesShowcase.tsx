"use client";

import { useState, useEffect, type FC } from "react";
import { AddCaseStudyModal } from "./AddCaseStudyModal";

/* ---------------- Types ---------------- */

export type CaseStudyKey =
  | "regards"
  | "elabira"
  | "pdfbazar"
  | "doctorinfo"
  | "multitax"
  | string;

export type ProjectTheme = {
  accent: string;           // Hex color
  pageBg: string;           // Tailwind class for whole page background
  containerBg: string;       // Tailwind class for active case study container
  cardBorder: string;       // Tailwind class for card borders
  activeBadgeClass: string; // Tailwind class for active pills
  tagClass: string;         // Tailwind class for tags
};

export type CaseStudyCard = {
  id?: string;
  key: CaseStudyKey;
  title: string;
  subtitle: string;
  category?: string;
  image: string;
  link: string;
  tags: string[];
  client?: string;
  accent?: string;
  metrics?: { label: string; value: string }[];
  overview?: string;
  challenge?: string;
  solution?: string;
  results?: string;
  theme: ProjectTheme;
};

/* ---------------- Default Themes Map ---------------- */

const DEFAULT_THEMES: Record<string, ProjectTheme> = {
  regards: {
    accent: "#2563EB",
    pageBg: "bg-[#edf4fe]",
    containerBg: "bg-white/95",
    cardBorder: "border-blue-300",
    activeBadgeClass: "bg-blue-600 text-white shadow-md shadow-blue-500/25",
    tagClass: "text-blue-700 bg-blue-50 border-blue-200",
  },
  elabira: {
    accent: "#7A1E1E",
    pageBg: "bg-[#fcf1f1]",
    containerBg: "bg-white/95",
    cardBorder: "border-rose-300",
    activeBadgeClass: "bg-[#7A1E1E] text-white shadow-md shadow-[#7A1E1E]/25",
    tagClass: "text-[#7A1E1E] bg-[#7A1E1E]/10 border-[#7A1E1E]/20",
  },
  pdfbazar: {
    accent: "#0284C7",
    pageBg: "bg-[#edf7fd]",
    containerBg: "bg-white/95",
    cardBorder: "border-sky-300",
    activeBadgeClass: "bg-sky-600 text-white shadow-md shadow-sky-500/25",
    tagClass: "text-sky-700 bg-sky-50 border-sky-200",
  },
  doctorinfo: {
    accent: "#0D9488",
    pageBg: "bg-[#eefcf7]",
    containerBg: "bg-white/95",
    cardBorder: "border-teal-300",
    activeBadgeClass: "bg-teal-600 text-white shadow-md shadow-teal-500/25",
    tagClass: "text-teal-700 bg-teal-50 border-teal-200",
  },
  multitax: {
    accent: "#D97706",
    pageBg: "bg-[#fdf9e8]",
    containerBg: "bg-white/95",
    cardBorder: "border-amber-300",
    activeBadgeClass: "bg-amber-600 text-white shadow-md shadow-amber-500/25",
    tagClass: "text-amber-700 bg-amber-50 border-amber-200",
  },
};

const INITIAL_CARDS: CaseStudyCard[] = [
  {
    key: "regards",
    title: "Regards Tech",
    subtitle: "Agency website & brand rebuild",
    category: "Agency",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    link: "https://regardstech.com/",
    tags: ["Next.js", "Agency", "2026"],
    client: "Regards Tech Inc.",
    metrics: [
      { label: "Page Speed", value: "99/100" },
      { label: "Lead Inflow", value: "+180%" },
    ],
    overview: "High-performance agency architecture designed for sub-second navigation and real-time lead ingestion.",
    challenge: "The prior setup had static bottlenecks and lacked dynamic CMS capabilities.",
    solution: "Built a fully decoupled Next.js frontend connected to a dedicated MVC backend.",
    results: "Reduced bounce rates by 64% and achieved instant Core Web Vitals passes.",
    theme: DEFAULT_THEMES.regards,
  },
  {
    key: "elabira",
    title: "Elabira",
    subtitle: "Multi-category D2C storefront",
    category: "E-Commerce",
    image: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80",
    link: "https://elabira.com/",
    tags: ["Bootstrap", "E-commerce", "2026"],
    client: "Elabira Retail",
    metrics: [
      { label: "Annual GMV", value: "$1.2M+" },
      { label: "Checkout Conversion", value: "+42%" },
    ],
    overview: "Robust consumer commerce platform handling heavy flash-sale concurrency with localized payments.",
    challenge: "High cart abandonment due to multi-step legacy checkout flows.",
    solution: "Engineered single-click checkout and automated fulfillment inventory tracking.",
    results: "Processed over 40,000 orders with 99.98% uptime.",
    theme: DEFAULT_THEMES.elabira,
  },
  {
    key: "pdfbazar",
    title: "PDF Bazar",
    subtitle: "Academic PDF marketplace",
    category: "EdTech",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80",
    link: "https://pdfbazar.com/",
    tags: ["Next.js", "Vercel", "2026"],
    client: "PDF Bazar Academic",
    metrics: [
      { label: "Active Students", value: "50,000+" },
      { label: "Search Latency", value: "<20ms" },
    ],
    overview: "Academic textbook and syllabus digital distribution platform with DRM security.",
    challenge: "Preventing document piracy while maintaining instant mobile previews.",
    solution: "Encrypted token streaming on Vercel Edge with client-side DRM canvas renderer.",
    results: "Zero unauthorized document leaks and over 250,000 downloads.",
    theme: DEFAULT_THEMES.pdfbazar,
  },
  {
    key: "doctorinfo",
    title: "DoctorInfoBD",
    subtitle: "Doctor appointment platform",
    category: "Healthcare",
    image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80",
    link: "https://doctorinfobd.com/",
    tags: ["Laravel", "Healthcare", "2026"],
    client: "HealthTech BD",
    metrics: [
      { label: "Verified Doctors", value: "1,500+" },
      { label: "Patient No-shows", value: "-72%" },
    ],
    overview: "Comprehensive physician directory with instant slot reservation and SMS confirmations.",
    challenge: "Reliable SMS delivery and real-time scheduling in fluctuating network conditions.",
    solution: "Dual-gateway SMS fallback and automated voice confirmation bots.",
    results: "Over 18,000 patient appointments booked monthly.",
    theme: DEFAULT_THEMES.doctorinfo,
  },
  {
    key: "multitax",
    title: "Multi Tax Solution",
    subtitle: "VAT · Customs · Income Tax advisory",
    category: "Consultancy",
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=800&q=80",
    link: "https://multitaxsolutionbd.com/",
    tags: ["Laravel", "Consultancy", "2026"],
    client: "Multi Tax Advisory",
    metrics: [
      { label: "Corporate Audits", value: "350+" },
      { label: "Filing Accuracy", value: "100%" },
    ],
    overview: "Fiscal compliance and income tax assessment portal for corporate businesses.",
    challenge: "Constantly shifting national tax guidelines and complex slab calculations.",
    solution: "Configurable tax formula engine that advisors update without code deployments.",
    results: "Saved clients over 2,000 hours in manual paperwork every fiscal year.",
    theme: DEFAULT_THEMES.multitax,
  },
];

/* ---------------- Main Component ---------------- */

export const CaseStudiesShowcase: FC = () => {
  const [cards, setCards] = useState<CaseStudyCard[]>(INITIAL_CARDS);
  const [active, setActive] = useState<string>("regards");
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Fetch real-time case studies from Admin Backend API
  useEffect(() => {
    const fetchApiCaseStudies = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/public/case-studies`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.success && Array.isArray(data.caseStudies) && data.caseStudies.length > 0) {
          const mappedCards: CaseStudyCard[] = data.caseStudies.map((cs: any) => {
            const fallbackTheme = DEFAULT_THEMES[cs.key] || {
              accent: cs.accent || "#2563EB",
              pageBg: "bg-[#edf4fe]",
              containerBg: "bg-white/95",
              cardBorder: "border-blue-300",
              activeBadgeClass: "bg-blue-600 text-white shadow-md shadow-blue-500/25",
              tagClass: "text-blue-700 bg-blue-50 border-blue-200",
            };

            return {
              id: cs.id,
              key: cs.key,
              title: cs.title,
              subtitle: cs.subtitle,
              category: cs.category,
              image: cs.image,
              link: cs.link,
              tags: cs.tags || [],
              client: cs.client,
              accent: cs.accent,
              metrics: cs.metrics,
              overview: cs.overview,
              challenge: cs.challenge,
              solution: cs.solution,
              results: cs.results,
              theme: fallbackTheme,
            };
          });

          setCards(mappedCards);
          if (!mappedCards.some((c) => c.key === active)) {
            setActive(mappedCards[0].key);
          }
        }
      } catch (err) {
        // Fall back gracefully to INITIAL_CARDS
      }
    };

    fetchApiCaseStudies();
  }, []);

  const activeCard = cards.find((c) => c.key === active) || cards[0];
  const t = activeCard?.theme || DEFAULT_THEMES.regards;

  return (
    <div className={`min-h-screen ${t.pageBg} text-stone-700 antialiased transition-colors duration-700`}>
      {/* Dynamic top bar accent */}
      <div
        className="h-1.5 w-full transition-all duration-500"
        style={{ backgroundColor: t.accent }}
      />

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 lg:pt-28 pb-16 lg:pb-24">
        {/* ============ MOBILE: HORIZONTAL TAB BAR ============ */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p
                className="text-[11px] tracking-[0.25em] uppercase font-semibold mb-1 transition-colors duration-300"
                style={{ color: t.accent }}
              >
                Selected Work
              </p>
              <h2 className="font-serif text-2xl text-stone-800 tracking-tight">
                Case Studies
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              style={{ backgroundColor: t.accent }}
              className="px-3.5 py-1.5 text-white rounded-xl text-xs font-semibold shadow-xs"
            >
              + Add Case Study
            </button>
          </div>

          <div
            className="-mx-4 px-4 overflow-x-auto pb-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="flex gap-2 min-w-max">
              {cards.map((card) => {
                const isActive = active === card.key;
                return (
                  <button
                    key={card.key}
                    onClick={() => setActive(card.key)}
                    className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-all whitespace-nowrap ${
                      isActive
                        ? card.theme.activeBadgeClass
                        : "border-stone-200/80 bg-white/80 text-stone-600 hover:border-stone-400"
                    }`}
                  >
                    {card.title}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-3 text-xs text-stone-500">
            <span className="truncate">{activeCard.subtitle}</span>
            {activeCard.link && (
              <a
                href={activeCard.link}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 font-medium hover:underline"
                style={{ color: t.accent }}
              >
                Visit site ↗
              </a>
            )}
          </div>
        </div>

        {/* ============ GRID: LEFT SIDEBAR + RIGHT CONTENT ============ */}
        <div className="grid lg:grid-cols-[320px_1fr] gap-8 lg:gap-12 items-start">
          {/* ---------- LEFT: STICKY CARD LIST (Desktop) ---------- */}
          <aside
            className="hidden lg:block lg:sticky lg:top-28 lg:self-start lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto lg:pr-2 [&::-webkit-scrollbar]:hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p
                  className="text-[11px] tracking-[0.25em] uppercase font-semibold mb-1 transition-colors duration-300"
                  style={{ color: t.accent }}
                >
                  Selected Work
                </p>
                <h2 className="font-serif text-3xl text-stone-900 tracking-tight">
                  Case Studies
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                style={{ backgroundColor: t.accent }}
                className="px-3 py-1.5 text-white rounded-xl text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity cursor-pointer shrink-0"
                title="Add new case study"
              >
                + Add
              </button>
            </div>

            <div className="space-y-3">
              {cards.map((card) => {
                const isActive = active === card.key;
                return (
                  <button
                    key={card.key}
                    onClick={() => setActive(card.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-300 ${
                      isActive
                        ? `${card.theme.containerBg} ${card.theme.cardBorder} shadow-lg ring-1 ring-black/5`
                        : "bg-white/60 border-stone-200/70 hover:bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-stone-900 text-sm">{card.title}</span>
                      {card.category && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{
                            color: card.theme.accent,
                            backgroundColor: `${card.theme.accent}15`,
                          }}
                        >
                          {card.category}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">{card.subtitle}</p>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {card.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* ---------- RIGHT: ACTIVE CASE STUDY VIEW ---------- */}
          <main className={`p-6 sm:p-10 rounded-2xl border ${t.cardBorder} ${t.containerBg} shadow-xl backdrop-blur-md transition-all duration-500`}>
            {/* Header row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-200/80">
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className="px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                    style={{ backgroundColor: t.accent }}
                  >
                    {activeCard.category || "Case Study"}
                  </span>
                  {activeCard.client && (
                    <span className="text-xs text-stone-500">Client: {activeCard.client}</span>
                  )}
                </div>
                <h1 className="font-serif text-3xl sm:text-4xl text-stone-900 tracking-tight mt-2">
                  {activeCard.title}
                </h1>
                <p className="text-sm text-stone-600 mt-1">{activeCard.subtitle}</p>
              </div>

              {activeCard.link && (
                <a
                  href={activeCard.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-md hover:opacity-95 transition-opacity self-start sm:self-auto shrink-0"
                  style={{ backgroundColor: t.accent }}
                >
                  <span>Visit Live Website</span>
                  <span>↗</span>
                </a>
              )}
            </div>

            {/* Hero Image */}
            <div className="relative aspect-video rounded-xl overflow-hidden mt-6 bg-stone-100 border border-stone-200 shadow-inner">
              <img
                src={activeCard.image}
                alt={activeCard.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Metrics Pills */}
            {activeCard.metrics && activeCard.metrics.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8">
                {activeCard.metrics.map((m, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-stone-50/80 border border-stone-200/80 text-center">
                    <p className="text-xs text-stone-500">{m.label}</p>
                    <p className="text-xl font-bold text-stone-900 mt-1 font-mono">{m.value}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Case Study Details */}
            <div className="mt-8 space-y-6 text-sm text-stone-700 leading-relaxed">
              {activeCard.overview && (
                <div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">Executive Overview</h3>
                  <p>{activeCard.overview}</p>
                </div>
              )}

              {activeCard.challenge && (
                <div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">The Engineering Challenge</h3>
                  <p>{activeCard.challenge}</p>
                </div>
              )}

              {activeCard.solution && (
                <div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">The Solution & Architecture</h3>
                  <p>{activeCard.solution}</p>
                </div>
              )}

              {activeCard.results && (
                <div>
                  <h3 className="font-bold text-stone-900 text-base mb-2">Business Outcomes & Impact</h3>
                  <p>{activeCard.results}</p>
                </div>
              )}
            </div>

            {/* Tags footer */}
            <div className="mt-8 pt-6 border-t border-stone-200/80 flex flex-wrap items-center gap-2">
              <span className="text-xs text-stone-500 font-medium">Stack & Tags:</span>
              {activeCard.tags.map((tag) => (
                <span
                  key={tag}
                  className={`text-xs px-3 py-1 rounded-md border font-medium ${t.tagClass}`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </main>
        </div>
      </div>

      {/* Add Case Study Modal */}
      <AddCaseStudyModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(cs) => {
          const newTheme = DEFAULT_THEMES[cs.key] || {
            accent: cs.accent || "#2563EB",
            pageBg: "bg-[#edf4fe]",
            containerBg: "bg-white/95",
            cardBorder: "border-blue-300",
            activeBadgeClass: "bg-blue-600 text-white shadow-md shadow-blue-500/25",
            tagClass: "text-blue-700 bg-blue-50 border-blue-200",
          };
          const newCard: CaseStudyCard = {
            id: cs.id,
            key: cs.key,
            title: cs.title,
            subtitle: cs.subtitle,
            category: cs.category,
            image: cs.image,
            link: cs.link,
            tags: cs.tags || ["Next.js", "Case Study"],
            client: cs.client,
            accent: cs.accent,
            metrics: cs.metrics,
            overview: cs.overview,
            challenge: cs.challenge,
            solution: cs.solution,
            results: cs.results,
            theme: newTheme,
          };
          setCards((prev) => [newCard, ...prev]);
          setActive(newCard.key);
          setToastMsg(`Case study "${newCard.title}" has been successfully added to showcase!`);
          setTimeout(() => setToastMsg(null), 5000);
        }}
      />
    </div>
  );
};

export default CaseStudiesShowcase;
