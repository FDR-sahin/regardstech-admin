"use client";

import { useEffect, useState, type FC } from "react";
import { AddBlogModal } from "./AddBlogModal";

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featuredImage: string;
  author: string;
  category: string;
  tags: string[];
  publishDate?: string;
  publishedAt?: string;
  createdAt?: string;
  views?: number;
}

export const BlogSection: FC = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [readingBlog, setReadingBlog] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000";
        const res = await fetch(`${apiUrl}/api/public/blogs`);
        if (!res.ok) throw new Error("Failed to fetch blogs");
        const data = await res.json();
        if (data.success && Array.isArray(data.blogs)) {
          setBlogs(data.blogs);
        }
      } catch (err) {
        // Fallback default sample if API not reachable
        setBlogs([
          {
            id: "blog_01",
            title: "Architecting Scalable Next.js Applications with REST APIs and Edge Caching",
            slug: "architecting-scalable-nextjs-rest-apis",
            excerpt: "How modern engineering teams decouple administrative backends while delivering sub-50ms TTFB for public website visitors.",
            content: "Full-stack decoupled architecture ensures that CMS operations never introduce latency into client-facing rendering trees...",
            featuredImage: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80",
            author: "Sahin Miah",
            category: "Engineering",
            tags: ["Next.js", "REST API", "Architecture"],
            publishDate: "2026-03-01",
            views: 1420
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  const categories = ["all", ...Array.from(new Set(blogs.map((b) => b.category)))];

  const filteredBlogs =
    selectedCategory === "all"
      ? blogs
      : blogs.filter((b) => b.category === selectedCategory);

  return (
    <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Success toast notification */}
      {toastMsg && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-sm font-medium text-center flex items-center justify-center gap-2 animate-fade-in shadow-xs">
          <span className="font-bold">✓</span>
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-xs font-bold tracking-widest text-blue-600 uppercase">
            Insights & Engineering
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mt-1 font-serif">
            Latest Articles & Tech Stories
          </h2>
          <p className="text-sm text-stone-600 mt-2 max-w-xl">
            Technical breakdowns, architecture deep-dives, and digital growth playbooks from the Regards Tech team.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {cat === "all" ? "All Topics" : cat}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>✍</span>
            <span>Write Article</span>
          </button>
        </div>
      </div>

      {/* Grid of Articles */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse bg-stone-100 rounded-2xl h-80" />
          ))}
        </div>
      ) : filteredBlogs.length === 0 ? (
        <div className="text-center py-16 text-stone-500">
          No articles published under this category yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBlogs.map((blog) => {
            const dateStr = blog.publishDate || blog.publishedAt || blog.createdAt || "Recent";
            return (
              <article
                key={blog.id}
                className="group flex flex-col justify-between bg-white rounded-2xl overflow-hidden border border-stone-200/90 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300"
              >
                <div>
                  {/* Article Thumbnail */}
                  <div className="relative aspect-video overflow-hidden bg-stone-100">
                    <img
                      src={blog.featuredImage}
                      alt={blog.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold bg-white/90 text-blue-600 backdrop-blur-md shadow-xs">
                      {blog.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs text-stone-400 mb-2.5">
                      <time dateTime={dateStr}>
                        {new Date(dateStr).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric"
                        })}
                      </time>
                      <span>·</span>
                      <span>By {blog.author || "Regards Tech"}</span>
                    </div>

                    <h3 className="text-lg font-bold text-stone-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {blog.title}
                    </h3>

                    <p className="text-sm text-stone-600 mt-2 line-clamp-3 leading-relaxed">
                      {blog.excerpt}
                    </p>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-4">
                        {blog.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[11px] px-2 py-0.5 rounded-md bg-stone-100 text-stone-600"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer / Read button */}
                <div className="p-6 pt-0 border-t border-stone-100 mt-4">
                  <button
                    onClick={() => setReadingBlog(blog)}
                    className="w-full mt-4 flex items-center justify-between text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors py-2 border-b border-blue-100 group-hover:border-blue-500"
                  >
                    <span>Read Article</span>
                    <span className="text-sm transition-transform group-hover:translate-x-1">→</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Reader Modal */}
      {readingBlog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setReadingBlog(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setReadingBlog(null)}
              className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100"
            >
              ✕
            </button>

            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
              {readingBlog.category}
            </span>

            <h2 className="text-2xl font-bold text-stone-900 mt-3 font-serif">
              {readingBlog.title}
            </h2>

            <div className="flex items-center gap-2 text-xs text-stone-500 mt-2 mb-6">
              <span>By {readingBlog.author}</span>
              <span>·</span>
              <span>
                {new Date(readingBlog.publishDate || readingBlog.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </div>

            <img
              src={readingBlog.featuredImage}
              alt={readingBlog.title}
              className="w-full aspect-video rounded-xl object-cover mb-6"
            />

            <div className="prose prose-stone text-stone-700 leading-relaxed text-sm whitespace-pre-line">
              {readingBlog.content}
            </div>

            <div className="mt-8 pt-6 border-t border-stone-200 flex justify-end">
              <button
                onClick={() => setReadingBlog(null)}
                className="px-5 py-2 rounded-xl bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800"
              >
                Close Article
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Blog Article Modal */}
      <AddBlogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={(newBlog) => {
          setBlogs((prev) => [newBlog, ...prev]);
          setToastMsg(`Article "${newBlog.title}" has been successfully published to the website!`);
          setTimeout(() => setToastMsg(null), 5000);
        }}
      />
    </section>
  );
};

export default BlogSection;
