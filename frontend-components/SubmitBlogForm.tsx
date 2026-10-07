"use client";

import React, { useState, useRef } from "react";

export interface BlogFormData {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  category: string;
  coverImage: string;
  tags: string[];
  readTime: string;
}

interface SubmitBlogFormProps {
  apiUrl?: string;
  onSuccess?: (createdBlog: any) => void;
  onCancel?: () => void;
  isModal?: boolean;
}

const BLOG_PRESET_IMAGES = [
  { label: "Code & Engineering", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80" },
  { label: "Modern Architecture", url: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80" },
  { label: "Digital Strategy", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80" },
  { label: "AI & Innovation", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80" },
];

export const SubmitBlogForm: React.FC<SubmitBlogFormProps> = ({
  apiUrl = process.env.NEXT_PUBLIC_ADMIN_API_URL || "http://localhost:3000",
  onSuccess,
  onCancel,
  isModal = false,
}) => {
  const [formData, setFormData] = useState<BlogFormData>({
    title: "",
    excerpt: "",
    content: "",
    author: "Regards Tech Contributor",
    category: "Engineering",
    coverImage: BLOG_PRESET_IMAGES[0].url,
    tags: ["Next.js", "Web Development"],
    readTime: "5 min read",
  });

  const [tagInput, setTagInput] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [imageMode, setImageMode] = useState<"url" | "upload">("url");
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const bodyImgFileRef = useRef<HTMLInputElement>(null);

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ("key" in e && e.key !== "Enter") return;
    e.preventDefault();
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tagToRemove) });
  };

  const insertMarkdown = (syntaxStart: string, syntaxEnd: string = "") => {
    const textarea = document.getElementById("blog-content-area") as HTMLTextAreaElement | null;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end);
    const replacement = `${syntaxStart}${selected || "text"}${syntaxEnd}`;

    const newContent = textarea.value.substring(0, start) + replacement + textarea.value.substring(end);
    setFormData({ ...formData, content: newContent });

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + syntaxStart.length, start + replacement.length - syntaxEnd.length);
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.title.trim()) {
      setErrorMsg("Please enter an article title.");
      return;
    }
    if (!formData.content.trim()) {
      setErrorMsg("Please provide the article body content.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${apiUrl}/api/public/blogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          excerpt: formData.excerpt.trim() || formData.content.slice(0, 160).trim(),
          content: formData.content.trim(),
          author: formData.author.trim(),
          category: formData.category,
          coverImage: formData.coverImage.trim(),
          tags: formData.tags,
          readTime: formData.readTime.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to publish article.");
      }

      setIsSuccess(true);
      if (onSuccess) {
        onSuccess(data.blog);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Could not publish article. Please try again.");
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
        <h3 className="text-xl font-bold text-stone-900 font-serif">Article Successfully Published!</h3>
        <p className="text-sm text-stone-600 mt-2 max-w-md mx-auto">
          Your article is now live on the Regards Tech website and will appear at the top of the blog grid.
        </p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              setFormData({
                title: "",
                excerpt: "",
                content: "",
                author: "Regards Tech Contributor",
                category: "Engineering",
                coverImage: BLOG_PRESET_IMAGES[0].url,
                tags: ["Tech"],
                readTime: "4 min read",
              });
              setIsSuccess(false);
            }}
            className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Write Another Post
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
          <span className="text-xs font-bold tracking-wider uppercase text-blue-600">Frontend Articles</span>
          <h2 className="text-2xl font-bold text-stone-900 font-serif mt-0.5">Write & Publish Article</h2>
          <p className="text-xs text-stone-500 mt-1">
            Contribute technical insights, tutorials, and case breakdown articles to the public Regards Tech blog.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-stone-100 p-1 rounded-xl text-xs font-medium">
          <button
            type="button"
            onClick={() => setActiveTab("write")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === "write" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Editor
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-3 py-1 rounded-lg transition-colors ${
              activeTab === "preview" ? "bg-white text-stone-900 shadow-xs font-bold" : "text-stone-600 hover:text-stone-900"
            }`}
          >
            Live Preview
          </button>
        </div>
      </div>

      {/* Error alert */}
      {errorMsg && (
        <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <span className="text-rose-500 font-bold">✕</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tab: Live Preview */}
      {activeTab === "preview" ? (
        <div className="space-y-6">
          <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md">
              {formData.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif mt-3">
              {formData.title || "Your Article Headline Will Appear Here"}
            </h1>
            <div className="flex items-center gap-3 text-xs text-stone-500 mt-3 pb-4 border-b border-stone-200">
              <span className="font-semibold text-stone-700">{formData.author}</span>
              <span>•</span>
              <span>{formData.readTime}</span>
              <span>•</span>
              <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            {formData.coverImage && (
              <div className="mt-4 h-64 rounded-xl overflow-hidden bg-stone-200">
                <img
                  src={formData.coverImage}
                  alt={formData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {formData.excerpt && (
              <p className="text-sm font-medium text-stone-700 italic mt-4 bg-white p-4 rounded-xl border border-stone-200">
                &ldquo;{formData.excerpt}&rdquo;
              </p>
            )}

            <div className="mt-6 prose prose-stone max-w-none text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
              {formData.content || "Write your article body in the editor to see the formatted output here."}
            </div>

            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-stone-200">
                {formData.tags.map((t) => (
                  <span key={t} className="px-2.5 py-1 bg-stone-200 text-stone-700 text-xs rounded-lg font-medium">
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveTab("write")}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
            >
              Back to Editor
            </button>
          </div>
        </div>
      ) : (
        /* Tab: Form Editor */
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Article Title */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Article Title <span className="text-blue-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Building Ultra-Fast Micro-Frontends with Next.js App Router"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium"
            />
          </div>

          {/* Category & Read Time & Author */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
              >
                <option value="Engineering">Engineering</option>
                <option value="Architecture">Architecture</option>
                <option value="Design & UX">Design & UX</option>
                <option value="Growth & SEO">Growth & SEO</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="Insights">Insights</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Author Name</label>
              <input
                type="text"
                placeholder="e.g. Sahin Miah"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Est. Read Time</label>
              <input
                type="text"
                placeholder="e.g. 5 min read"
                value={formData.readTime}
                onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Short Summary / Excerpt
            </label>
            <input
              type="text"
              placeholder="A brief 1-2 sentence hook for cards and social previews..."
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Cover Image (Dual Mode: Web URL vs Upload from PC) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-stone-700">Cover Image</label>
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
                  value={formData.coverImage.startsWith("data:image/") ? "" : formData.coverImage}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.startsWith("file:///") || /^[a-zA-Z]:[\\\/]/.test(val.trim())) {
                      setImageMode("upload");
                      setErrorMsg("To use an image from your computer, please click 'Choose File' under 'Upload from PC'!");
                      return;
                    }
                    setFormData({ ...formData, coverImage: val });
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-stone-400 font-medium">Quick presets:</span>
                  {BLOG_PRESET_IMAGES.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setFormData({ ...formData, coverImage: p.url })}
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
                  {formData.coverImage.startsWith("data:image/") ? "✓ Cover Image Selected from PC (Click to change)" : "Click to select cover image from your PC"}
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
                        if (dataUrl) setFormData({ ...formData, coverImage: dataUrl });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            )}

            {/* Live Cover Image Preview */}
            {formData.coverImage && (
              <div className="mt-2.5 p-2 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={formData.coverImage}
                    alt="Cover preview"
                    className="w-14 h-10 object-cover rounded-lg border border-stone-200 shrink-0 bg-stone-100"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-stone-800 truncate">
                      {formData.coverImage.startsWith("data:image/") ? "Local PC File Attached" : "Cover URL Attached"}
                    </p>
                    <p className="text-[11px] text-stone-400 truncate">
                      {formData.coverImage.startsWith("data:image/") ? "Ready for publication" : formData.coverImage}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, coverImage: "" })}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium px-2 py-1 rounded hover:bg-rose-50 transition-colors shrink-0"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Content Markdown Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-stone-700">
                Article Body Content <span className="text-blue-600">*</span>
              </label>

              {/* Formatting Toolbar */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => insertMarkdown("**", "**")}
                  className="px-2 py-0.5 text-xs font-bold text-stone-600 hover:bg-stone-100 rounded"
                  title="Bold"
                >
                  B
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("*", "*")}
                  className="px-2 py-0.5 text-xs italic text-stone-600 hover:bg-stone-100 rounded"
                  title="Italic"
                >
                  I
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("## ")}
                  className="px-2 py-0.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded"
                  title="Heading 2"
                >
                  H2
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("> ")}
                  className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100 rounded"
                  title="Quote"
                >
                  &ldquo;
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("```\n", "\n```")}
                  className="px-2 py-0.5 text-xs font-mono text-stone-600 hover:bg-stone-100 rounded"
                  title="Code block"
                >
                  &lt;/&gt;
                </button>
                <button
                  type="button"
                  onClick={() => insertMarkdown("- ")}
                  className="px-2 py-0.5 text-xs text-stone-600 hover:bg-stone-100 rounded"
                  title="Bullet List"
                >
                  • List
                </button>

                <div className="w-px h-3.5 bg-stone-200 mx-0.5" />

                {/* Insert Image URL button */}
                <button
                  type="button"
                  onClick={() => setShowUrlDialog(!showUrlDialog)}
                  className="px-2 py-0.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded"
                  title="Insert Image by Web URL"
                >
                  🖼️ Image URL
                </button>

                {/* Upload Image from PC button */}
                <button
                  type="button"
                  onClick={() => bodyImgFileRef.current?.click()}
                  className="px-2 py-0.5 text-xs font-medium text-emerald-600 hover:bg-emerald-50 rounded"
                  title="Attach Image from Local PC directly into body"
                >
                  💻 Upload PC Image
                </button>
              </div>
            </div>

            {/* Hidden file input for body images */}
            <input
              ref={bodyImgFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => {
                    const dataUrl = ev.target?.result as string;
                    if (dataUrl) {
                      insertMarkdown(`\n\n![${file.name.replace(/\.[^.]+$/, "")}](${dataUrl})\n\n`);
                    }
                  };
                  reader.readAsDataURL(file);
                }
                e.target.value = "";
              }}
            />

            {/* Quick URL prompt bar */}
            {showUrlDialog && (
              <div className="mb-2 p-2 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-2 text-xs">
                <span className="text-stone-600 font-medium">Image URL:</span>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="flex-1 px-2.5 py-1 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (imageUrlInput.trim()) {
                      insertMarkdown(`\n\n![Article image](${imageUrlInput.trim()})\n\n`);
                      setImageUrlInput("");
                      setShowUrlDialog(false);
                    }
                  }}
                  className="px-2.5 py-1 bg-blue-600 text-white font-medium rounded-lg text-xs hover:bg-blue-700"
                >
                  Insert
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlDialog(false)}
                  className="text-stone-400 hover:text-stone-600 px-1 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            <textarea
              id="blog-content-area"
              required
              rows={8}
              placeholder="Write your article in markdown or plain text. Include technical details, snippets, and actionable lessons..."
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono leading-relaxed"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">Topics & Tags</label>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-stone-100 border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
                >
                  #{tag}
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
                placeholder="Add tag (e.g. Next.js, Architecture) & press Enter"
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
                  Publishing Article…
                </>
              ) : (
                "Publish Article"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
