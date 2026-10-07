"use client";

import { useEffect, useState, type FC } from "react";
import { AddTestimonialModal } from "./AddTestimonialModal";

export interface Testimonial {
  id: string;
  clientName: string;
  clientPhoto: string;
  position: string;
  company: string;
  review: string;
  rating: number; // 1 to 5
}

export const TestimonialsSection: FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/public/testimonials`);
        if (!res.ok) throw new Error("Failed to fetch testimonials");
        const data = await res.json();
        if (data.success && Array.isArray(data.testimonials)) {
          setTestimonials(data.testimonials);
        }
      } catch (err) {
        // Fallback default sample if API offline
        setTestimonials([
          {
            id: "tst_01",
            clientName: "David Miller",
            clientPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80",
            position: "Chief Technology Officer",
            company: "OmniPay Financial Global",
            review: "Regards Tech engineered our core banking platform with extraordinary attention to security and high-throughput reliability. Their engineering caliber is world-class.",
            rating: 5
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchTestimonials();
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-stone-50/70 border-t border-b border-stone-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success toast notification */}
        {toastMsg && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium text-center flex items-center justify-center gap-2 animate-fade-in shadow-xs">
            <span className="font-bold">✓</span>
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-14 text-center sm:text-left">
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-widest text-amber-600 uppercase">
              Client Success & Outcomes
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mt-1 font-serif">
              Trusted by Forward-Thinking Leaders
            </h2>
            <p className="text-sm text-stone-600 mt-2">
              Read what CTOs, founders, and enterprise executives say about working with Regards Tech.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md transition-all flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <span>★</span>
            <span>Share Your Experience</span>
          </button>
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl h-64 p-6 border border-stone-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-white rounded-2xl p-7 border border-stone-200/90 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  {/* Star Rating Row */}
                  <div className="flex items-center gap-1 mb-4 text-amber-400">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`text-lg leading-none ${
                          star <= (t.rating || 5) ? "text-amber-400" : "text-stone-200"
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="text-xs font-semibold text-stone-700 ml-1.5 font-mono">
                      {t.rating || 5}.0
                    </span>
                  </div>

                  {/* Review Quote */}
                  <blockquote className="text-stone-700 text-sm leading-relaxed italic mb-6">
                    &ldquo;{t.review}&rdquo;
                  </blockquote>
                </div>

                {/* Client Profile */}
                <div className="flex items-center gap-3.5 pt-4 border-t border-stone-100">
                  <img
                    src={t.clientPhoto}
                    alt={t.clientName}
                    className="w-11 h-11 rounded-full object-cover border-2 border-stone-100 shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-stone-900 truncate">
                      {t.clientName}
                    </h4>
                    <p className="text-xs text-stone-500 truncate">
                      {t.position} <span className="text-stone-300">·</span>{" "}
                      <span className="text-stone-700 font-medium">{t.company}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Testimonial Modal */}
      <AddTestimonialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newTestimonial) => {
          setTestimonials((prev) => [newTestimonial, ...prev]);
          setToastMsg(`Thank you, ${newTestimonial.clientName}! Your review has been submitted and added.`);
          setTimeout(() => setToastMsg(null), 6000);
        }}
      />
    </section>
  );
};

export default TestimonialsSection;
