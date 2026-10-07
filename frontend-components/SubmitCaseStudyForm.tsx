"use client";

import React, { useState } from "react";

export interface CaseStudyFormData {
  title: string;
  subtitle: string;
  category: string;
  client: string;
  link: string;
  image: string;
  accent: string;
  metrics: { label: string; value: string }[];
  overview: string;
  challenge: string;
  solution: string;
  results: string;
  tags: string[];
}

interface SubmitCaseStudyFormProps {
  apiUrl?: string;
  onSuccess?: (createdCaseStudy: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const THEME_ACCENTS = [
  { name: "Regards Blue", hex: "#2563EB", borderClass: "border-blue-400" },
  { name: "Elabira Burgundy", hex: "#7A1E1E", borderClass: "border-rose-400" },
  { name: "PDFBazar Sky", hex: "#0284C7", borderClass: "border-sky-400" },
  { name: "DoctorInfo Teal", hex: "#0D9488", borderClass: "border-teal-400" },
  { name: "MultiTax Amber", hex: "#D97706", borderClass: "border-amber-400" },
  { name: "Violet Enterprise", hex: "#7C3AED", borderClass: "border-purple-400" },
];

const PRESET_IMAGES = [
  { label: "Dashboard / Analytics", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80" },
  { label: "Modern Web App", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" },
  { label: "E-Commerce Experience", url: "https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80" },
  { label: "Mobile & Cloud Platform", url: "https://images.unsplash.com/photo-1526470608268-f674ce90ebd4?auto=format&fit=crop&w=800&q=80" },
];

export const SubmitCaseStudyForm: React.FC<SubmitCaseStudyFormProps> = ({
  apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000",
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const [formData, setFormData] = useState<CaseStudyFormData>({
    title: "",
    subtitle: "",
    category: "Web & App Development",
    client: "",
    link: "https://regardstech.com",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80",
    accent: "#2563EB",
    metrics: [
      { label: "Performance", value: "99/100" },
      { label: "Conversion", value: "+180%" },
    ],
    overview: "",
    challenge: "",
    solution: "",
    results: "",
    tags: ["Next.js", "React", "TypeScript", "Tailwind CSS"],
  });

  const [tagInput, setTagInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");

  const handleAddMetric = () => {
    if (formData.metrics.length < 4) {
      setFormData({
        ...formData,
        metrics: [...formData.metrics, { label: "New Metric", value: "100%" }],
      });
    }
  };

  const handleRemoveMetric = (index: number) => {
    setFormData({
      ...formData,
      metrics: formData.metrics.filter((_, i) => i !== index),
    });
  };

  const handleMetricChange = (index: number, field: "label" | "value", val: string) => {
    const updated = [...formData.metrics];
    updated[index][field] = val;
    setFormData({ ...formData, metrics: updated });
  };

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()],
      });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((t) => t !== tagToRemove),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Please provide a project / case study title.");
      return;
    }
    if (!formData.subtitle.trim()) {
      setErrorMsg("Please provide a subtitle or brief tagline.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/public/case-studies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          subtitle: formData.subtitle.trim(),
          category: formData.category,
          client: formData.client.trim() || undefined,
          link: formData.link.trim() || undefined,
          image: formData.image.trim(),
          accent: formData.accent,
          metrics: formData.metrics.filter((m) => m.label.trim() && m.value.trim()),
          overview: formData.overview.trim() || formData.subtitle.trim(),
          challenge: formData.challenge.trim() || undefined,
          solution: formData.solution.trim() || undefined,
          results: formData.results.trim() || undefined,
          tags: formData.tags,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to publish case study.");
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(data.caseStudy);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not publish case study. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-emerald-200 text-center shadow-xs">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <h3 className="text-xl font-bold text-stone-900 font-serif">Case Study Successfully Added!</h3>
        <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
          Your case study has been published and is immediately available in the interactive showcase component and public API.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: "",
                subtitle: "",
                category: "Web & App Development",
                client: "",
                link: "https://regardstech.com",
                image: PRESET_IMAGES[0].url,
                accent: "#2563EB",
                metrics: [{ label: "Performance", value: "99/100" }],
                overview: "",
                challenge: "",
                solution: "",
                results: "",
                tags: ["Next.js", "React"],
              });
              setIsSuccess(false);
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Add Another Case Study
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Done
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm ${isModal ? "p-6" : "p-8 max-w-3xl mx-auto"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-blue-600">Frontend Showcase</span>
          <h2 className="text-2xl font-bold text-stone-900 font-serif mt-0.5">Add Project / Case Study</h2>
          <p className="text-xs text-stone-500 mt-1">
            Publish client project outcomes, interactive theme colors, and technical highlights to your Next.js site.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {showPreview ? "Hide Preview" : "Card Preview"}
        </button>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <span className="text-rose-500 font-bold">✕</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Preview Card */}
      {showPreview && (
        <div className="mb-6 p-5 bg-stone-50 rounded-xl border border-stone-200">
          <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider mb-2">Showcase Card Preview</p>
          <div className="bg-white rounded-xl overflow-hidden border border-stone-200 shadow-xs max-w-sm mx-auto">
            <div className="h-40 relative bg-stone-100 overflow-hidden">
              <img
                src={formData.image}
                alt={formData.title || "Preview"}
                className="w-full h-full object-cover"
              />
              <span
                style={{ backgroundColor: formData.accent }}
                className="absolute top-3 left-3 text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm"
              >
                {formData.category}
              </span>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-stone-900 text-base">{formData.title || "Project Title Here"}</h4>
              <p className="text-xs text-stone-500 mt-1 line-clamp-2">{formData.subtitle || "Brief tagline and project summary..."}</p>
              <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-stone-100">
                <span className="font-medium text-stone-600">{formData.client || "Client"}</span>
                <span style={{ color: formData.accent }} className="font-semibold">
                  View Case Study →
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title & Subtitle */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Project Title <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Elabira E-Commerce Ecosystem"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Tagline / Subtitle <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Next.js high-conversion storefront & headless ERP"
              value={formData.subtitle}
              onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Category & Client & Link */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
            >
              <option value="Web & App Development">Web & App Development</option>
              <option value="E-Commerce">E-Commerce</option>
              <option value="Agency & Branding">Agency & Branding</option>
              <option value="FinTech">FinTech</option>
              <option value="Healthcare">Healthcare</option>
              <option value="Custom Software / SaaS">Custom Software / SaaS</option>
              <option value="Digital Marketing & SEO">Digital Marketing & SEO</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Client Organization</label>
            <input
              type="text"
              placeholder="e.g. Elabira Retail Ltd."
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Live URL / Demo</label>
            <input
              type="url"
              placeholder="https://..."
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Accent Color Picker */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Accent Theme Color
          </label>
          <div className="flex flex-wrap items-center gap-3">
            {THEME_ACCENTS.map((t) => (
              <button
                key={t.hex}
                type="button"
                onClick={() => setFormData({ ...formData, accent: t.hex })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  formData.accent === t.hex
                    ? `${t.borderClass} ring-2 ring-blue-500/20 bg-stone-50 font-bold`
                    : "border-stone-200 hover:bg-stone-50 text-stone-600"
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full shadow-xs" style={{ backgroundColor: t.hex }} />
                <span>{t.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Featured Image & Presets (Dual: Web URL vs Upload from PC) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-stone-700">
              Featured Case Study Image
            </label>
            <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setImageMode("url")}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  imageMode === "url" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                🔗 Web URL
              </button>
              <button
                type="button"
                onClick={() => setImageMode("upload")}
                className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                  imageMode === "upload" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"
                }`}
              >
                💻 Upload from PC
              </button>
            </div>
          </div>

          {imageMode === "url" ? (
            <div className="space-y-2">
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.image.startsWith("data:image/") ? "" : formData.image}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith("file:///") || /^[a-zA-Z]:[\\\/]/.test(val.trim())) {
                    setImageMode("upload");
                    setErrorMsg("To use an image from your computer, please click 'Choose File' under 'Upload from PC'!");
                    return;
                  }
                  setFormData({ ...formData, image: val });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-stone-400 font-medium">Quick presets:</span>
                {PRESET_IMAGES.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setFormData({ ...formData, image: p.url })}
                    className="text-[11px] text-blue-600 hover:underline bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-stone-300 hover:border-blue-500 rounded-xl bg-stone-50 hover:bg-blue-50/20 cursor-pointer transition-colors text-center">
              <span className="text-xs font-semibold text-stone-800">
                {formData.image.startsWith("data:image/") ? "✓ Image Selected (Click to change)" : "Click to select case study image from your PC"}
              </span>
              <span className="text-[11px] text-stone-500 mt-0.5">PNG, JPG, WEBP (stored locally)</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const dataUrl = ev.target?.result as string;
                      if (dataUrl) setFormData({ ...formData, image: dataUrl });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </label>
          )}
        </div>

        {/* Metrics Builder */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-stone-700">Key Performance Metrics</label>
            {formData.metrics.length < 4 && (
              <button
                type="button"
                onClick={handleAddMetric}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                + Add Metric
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {formData.metrics.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <input
                  type="text"
                  placeholder="Metric (e.g. Speed)"
                  value={m.label}
                  onChange={(e) => handleMetricChange(idx, "label", e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-stone-800"
                />
                <input
                  type="text"
                  placeholder="Value (e.g. 99/100)"
                  value={m.value}
                  onChange={(e) => handleMetricChange(idx, "value", e.target.value)}
                  className="w-1/2 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-white text-stone-800 font-bold"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveMetric(idx)}
                  className="text-stone-400 hover:text-rose-600 text-sm px-1"
                  title="Remove metric"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Challenge, Solution, Results */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">The Challenge</label>
            <textarea
              rows={3}
              placeholder="What friction or technical hurdle did the client face?"
              value={formData.challenge}
              onChange={(e) => setFormData({ ...formData, challenge: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Our Solution</label>
            <textarea
              rows={3}
              placeholder="What architecture or engineering design did Regards Tech execute?"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Business Results</label>
            <textarea
              rows={3}
              placeholder="What tangible ROI, speed, or growth was achieved?"
              value={formData.results}
              onChange={(e) => setFormData({ ...formData, results: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1">Technologies & Tags</label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {formData.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="hover:text-rose-600 text-stone-400 font-bold"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add tag (e.g. Next.js, Redux, PostgreSQL) & press Enter"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-100">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Publishing Case Study…
              </>
            ) : (
              "Publish Case Study"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
