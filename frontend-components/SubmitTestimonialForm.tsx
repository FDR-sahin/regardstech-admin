"use client";

import React, { useState } from "react";

export interface TestimonialFormData {
  clientName: string;
  clientPhoto: string;
  position: string;
  company: string;
  review: string;
  rating: number;
}

interface SubmitTestimonialFormProps {
  apiUrl?: string;
  onSuccess?: (createdTestimonial: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

export const SubmitTestimonialForm: React.FC<SubmitTestimonialFormProps> = ({
  apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000",
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const [formData, setFormData] = useState<TestimonialFormData>({
    clientName: "",
    clientPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
    position: "",
    company: "",
    review: "",
    rating: 5,
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [photoMode, setPhotoMode] = useState<"url" | "upload">("url");

  const ratingDescriptions: Record<number, string> = {
    1: "Needs significant improvement",
    2: "Fair experience",
    3: "Good & satisfactory",
    4: "Very good & professional",
    5: "Exceptional / 5-Star Excellence",
  };

  const currentDisplayRating = hoverRating !== null ? hoverRating : formData.rating;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.clientName.trim()) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!formData.review.trim()) {
      setErrorMsg("Please write your review feedback.");
      return;
    }
    if (formData.review.trim().length < 15) {
      setErrorMsg("Please provide at least 15 characters of detailed feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/public/testimonials`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientName: formData.clientName.trim(),
          clientPhoto: formData.clientPhoto.trim(),
          position: formData.position.trim() || "Client Partner",
          company: formData.company.trim() || "Independent",
          review: formData.review.trim(),
          rating: formData.rating,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit testimonial.");
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(data.testimonial);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      clientName: "",
      clientPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80",
      position: "",
      company: "",
      review: "",
      rating: 5,
    });
    setIsSuccess(false);
    setErrorMsg(null);
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-emerald-200 text-center shadow-xs">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          ✓
        </div>
        <h3 className="text-xl font-bold text-stone-900 font-serif">Thank You for Your Review!</h3>
        <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
          Your feedback has been successfully submitted and published to our testimonials wall. We truly value our partnership with you!
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleReset}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Submit Another Review
          </button>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl border border-stone-200 shadow-sm ${isModal ? "p-6" : "p-8 max-w-2xl mx-auto"}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6 pb-4 border-b border-stone-100">
        <div>
          <span className="text-xs font-bold tracking-wider uppercase text-amber-600">Client Feedback</span>
          <h2 className="text-2xl font-bold text-stone-900 font-serif mt-0.5">Share Your Experience</h2>
          <p className="text-xs text-stone-500 mt-1">
            Let others know how Regards Tech helped bring your software and business vision to reality.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {showPreview ? "Hide Preview" : "Live Preview"}
        </button>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <span className="text-rose-500 font-bold">✕</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Live Preview Card */}
      {showPreview && (
        <div className="mb-6 p-5 bg-amber-50/40 rounded-xl border border-amber-200/60">
          <p className="text-[11px] font-bold text-amber-800 uppercase tracking-wider mb-2">Live Card Preview</p>
          <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-xs">
            <div className="flex items-center gap-1 text-amber-400 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`text-base ${star <= formData.rating ? "text-amber-400" : "text-stone-200"}`}>
                  ★
                </span>
              ))}
              <span className="text-xs font-semibold text-stone-700 ml-1.5 font-mono">{formData.rating}.0</span>
            </div>
            <p className="text-stone-700 text-sm italic mb-4">
              &ldquo;{formData.review || "Your review text will appear here once typed..."}&rdquo;
            </p>
            <div className="flex items-center gap-3 pt-3 border-t border-stone-100">
              <img
                src={formData.clientPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80"}
                alt={formData.clientName || "Client"}
                className="w-10 h-10 rounded-full object-cover border border-stone-200"
              />
              <div>
                <h4 className="text-sm font-bold text-stone-900">{formData.clientName || "Your Full Name"}</h4>
                <p className="text-xs text-stone-500">
                  {formData.position || "Position"} • {formData.company || "Company"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Star Rating Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Your Overall Rating <span className="text-amber-600">*</span>
          </label>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating: star })}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  className="text-2xl transition-transform hover:scale-110 focus:outline-none"
                  aria-label={`${star} star`}
                >
                  <span className={star <= currentDisplayRating ? "text-amber-400" : "text-stone-300"}>★</span>
                </button>
              ))}
            </div>
            <span className="text-xs font-medium text-stone-600 ml-2 bg-stone-100 px-2.5 py-1 rounded-md">
              {ratingDescriptions[currentDisplayRating]} ({currentDisplayRating} / 5)
            </span>
          </div>
        </div>

        {/* Client Name & Photo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Full Name <span className="text-amber-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. David Miller"
              value={formData.clientName}
              onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700">Photo / Avatar</label>
              <div className="flex items-center gap-1 bg-stone-100 p-0.5 rounded-lg text-[11px]">
                <button
                  type="button"
                  onClick={() => setPhotoMode("url")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    photoMode === "url" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  🔗 Web URL
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoMode("upload")}
                  className={`px-2 py-0.5 rounded-md font-medium transition-colors ${
                    photoMode === "upload" ? "bg-white text-stone-900 shadow-xs font-semibold" : "text-stone-500 hover:text-stone-800"
                  }`}
                >
                  💻 Upload from PC
                </button>
              </div>
            </div>

            {photoMode === "url" ? (
              <input
                type="text"
                placeholder="https://images.unsplash.com/..."
                value={formData.clientPhoto.startsWith("data:image/") ? "" : formData.clientPhoto}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val.startsWith("file:///") || /^[a-zA-Z]:[\\\/]/.test(val.trim())) {
                    setPhotoMode("upload");
                    setErrorMsg("To use an image from your computer, please click 'Choose File' under 'Upload from PC'!");
                    return;
                  }
                  setFormData({ ...formData, clientPhoto: val });
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />
            ) : (
              <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-stone-300 hover:border-amber-500 rounded-xl bg-stone-50 hover:bg-amber-50/30 cursor-pointer transition-colors text-center">
                <span className="text-xs font-semibold text-stone-800">
                  {formData.clientPhoto.startsWith("data:image/") ? "✓ Photo Selected (Click to change)" : "Click to select image file from your PC"}
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
                        if (dataUrl) setFormData({ ...formData, clientPhoto: dataUrl });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Position & Company */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Role / Job Title</label>
            <input
              type="text"
              placeholder="e.g. Chief Technology Officer"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Company / Organization</label>
            <input
              type="text"
              placeholder="e.g. OmniPay Global"
              value={formData.company}
              onChange={(e) => setFormData({ ...formData, company: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
            />
          </div>
        </div>

        {/* Review feedback */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-stone-700">
              Your Review & Comments <span className="text-amber-600">*</span>
            </label>
            <span className="text-[11px] text-stone-400">{formData.review.length} chars</span>
          </div>
          <textarea
            required
            rows={4}
            placeholder="Tell us about the project outcome, engineering quality, communication, and how Regards Tech made a difference..."
            value={formData.review}
            onChange={(e) => setFormData({ ...formData, review: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 leading-relaxed"
          />
        </div>

        {/* Action Buttons */}
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
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold transition-all shadow-sm hover:shadow-md disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting Review…
              </>
            ) : (
              "Submit Testimonial"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
