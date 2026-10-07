import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle2,
  FileText,
  Star,
  Eye,
  Calendar,
  User,
  Loader2,
  ExternalLink,
  Image as ImageIcon,
  UploadCloud,
  Link as LinkIcon,
  Video,
  X
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { BlogPost } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { ImageUploadOrUrl } from '../../components/common/ImageUploadOrUrl.tsx';

function getYouTubeEmbedUrl(url?: string): string | null {
  if (!url) return null;
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? `https://www.youtube.com/embed/${match[2]}` : null;
  } catch {
    return null;
  }
}

function isVideoUrl(url?: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes('youtube.com') || lower.includes('youtu.be') || lower.includes('vimeo.com') || lower.includes('loom.com') || lower.endsWith('.mp4');
}

export const BlogPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedBlog, setSelectedBlog] = useState<BlogPost | null>(null);
  const [exploreBlog, setExploreBlog] = useState<BlogPost | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [contentTab, setContentTab] = useState<'editor' | 'preview'>('editor');

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Engineering',
    excerpt: '',
    content: '',
    featuredImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80',
    author: '',
    tags: 'Next.js, REST API, Node.js',
    status: 'published' as 'published' | 'draft',
    featured: false,
    link: '',
    seoTitle: '',
    seoDescription: '',
    seoKeywords: 'Next.js, Cyber Security, Tech Agency'
  });

  const bodyImageInputRef = useRef<HTMLInputElement>(null);
  const [showUrlInsertDialog, setShowUrlInsertDialog] = useState(false);
  const [insertImageUrl, setInsertImageUrl] = useState('');

  const insertMarkdown = (before: string, after: string = '') => {
    const area = document.getElementById('blog-admin-content-area') as HTMLTextAreaElement | null;
    if (!area) {
      setFormData(prev => ({ ...prev, content: prev.content + before + after }));
      return;
    }
    const start = area.selectionStart;
    const end = area.selectionEnd;
    const current = formData.content;
    const selected = current.substring(start, end);
    const updated = current.substring(0, start) + before + selected + after + current.substring(end);
    setFormData(prev => ({ ...prev, content: updated }));
    setTimeout(() => {
      area.focus();
      area.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const handleBodyImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        insertMarkdown(`\n\n![${file.name.replace(/\.[^.]+$/, '')}](${result})\n\n`);
        showToast('Local image attached into blog content!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const canCreate = hasPermission('blogs', 'create');
  const canEdit = hasPermission('blogs', 'edit');
  const canDelete = hasPermission('blogs', 'delete');
  const canPublish = hasPermission('blogs', 'publish');

  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getBlogs({
        search,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        page,
        limit: 8
      });
      if (res.success) {
        setBlogs(res.blogs);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setCategories(res.categories);
      }
    } catch {
      showToast('Failed to load blog posts', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status, page, showToast]);

  useEffect(() => {
    fetchBlogs();
  }, [fetchBlogs]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedBlog(null);
    setContentTab('editor');
    setFormData({
      title: '',
      slug: '',
      category: 'Engineering',
      excerpt: '',
      content: `### Introduction\n\nWrite your technical article here using standard formatting and structured headings.\n\n### Key Principles\n* Point 1: Edge architecture\n* Point 2: API zero-trust security\n* Point 3: Core Web Vitals optimization`,
      featuredImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80',
      author: 'Regards Tech Editorial',
      tags: 'Engineering, Next.js, Cloud',
      status: 'draft',
      featured: false,
      link: '',
      seoTitle: '',
      seoDescription: '',
      seoKeywords: 'Next.js, Web Development'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: BlogPost) => {
    setModalMode('edit');
    setSelectedBlog(b);
    setContentTab('editor');
    setFormData({
      title: b.title,
      slug: b.slug,
      category: b.category,
      excerpt: b.excerpt,
      content: b.content,
      featuredImage: b.featuredImage,
      author: b.author,
      tags: b.tags.join(', '),
      status: b.status,
      featured: b.featured,
      link: b.link || '',
      seoTitle: b.seoTitle || '',
      seoDescription: b.seoDescription || '',
      seoKeywords: (b.seoKeywords || []).join(', ')
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(s => s.trim()).filter(Boolean),
        seoKeywords: formData.seoKeywords.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (modalMode === 'create') {
        const res = await api.createBlog(payload);
        showToast(res.message, 'success');
      } else if (selectedBlog) {
        const res = await api.updateBlog(selectedBlog.id, payload);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchBlogs();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (blog: BlogPost) => {
    if (!canPublish) {
      showToast('You do not have permission to publish or unpublish blogs', 'error');
      return;
    }
    const nextStatus = blog.status === 'published' ? 'draft' : 'published';
    try {
      await api.updateBlog(blog.id, { status: nextStatus });
      showToast(`Article set to ${nextStatus}`, 'success');
      fetchBlogs();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteBlog(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchBlogs();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Regards Tech Blog & CMS</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Publish technical thought leadership, architectural case studies, and engineering updates
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        )}
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search article title, tags, or author…"
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">All Categories</option>
          {categories.map(c => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts Only</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : blogs.length === 0 ? (
        <EmptyState
          title="No blog posts found"
          description="Write your first technical publication to populate the website blog."
          action={canCreate ? { label: 'Write Article', onClick: handleOpenCreate } : undefined}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Article</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Author</th>
                  <th className="py-3.5 px-4">Views</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {blogs.map(b => (
                  <tr key={b.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Title + Thumbnail + Featured */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.featuredImage}
                          alt={b.title}
                          className="w-12 h-9 rounded-md object-cover border border-slate-800 bg-slate-950 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white truncate max-w-md">{b.title}</span>
                            {b.featured && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                              </span>
                            )}
                            {b.link && (
                              <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${isVideoUrl(b.link) ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20' : 'bg-blue-500/10 text-blue-300 border border-blue-500/20'}`}>
                                {isVideoUrl(b.link) ? <Video className="w-2.5 h-2.5" /> : <LinkIcon className="w-2.5 h-2.5" />}
                                <span>{isVideoUrl(b.link) ? 'Vlog' : 'Link'}</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                            {b.excerpt}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      {b.category}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{b.author}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-300">
                      {b.views.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleTogglePublish(b)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                          b.status === 'published' ? 'text-emerald-400' : 'text-slate-500'
                        }`}
                        title="Click to toggle publish status"
                      >
                        {b.status === 'published' ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Published
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" /> Draft
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.link && (
                          <a
                            href={b.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${isVideoUrl(b.link) ? 'text-rose-400 hover:text-rose-300' : 'text-blue-400 hover:text-blue-300'}`}
                            title={isVideoUrl(b.link) ? 'Watch Vlog Video' : 'Visit Article Link'}
                          >
                            {isVideoUrl(b.link) ? <Video className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                          </a>
                        )}

                        <button
                          onClick={() => setExploreBlog(b)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors"
                          title="Explore & Read Article"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(b)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Edit Article"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(b.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Delete Article"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            limit={8}
            onPageChange={setPage}
            itemName="articles"
          />
        </div>
      )}

      {/* Blog Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Compose Technical Article' : `Edit: ${selectedBlog?.title}`}
        subtitle="Articles are exposed via Next.js REST API (/api/public/blogs)"
        maxWidth="4xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Article Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Zero-Trust Cyber Security Architecture"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                placeholder="Engineering, Cyber Security, UI/UX, SEO"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Author Name</label>
              <input
                type="text"
                value={formData.author}
                onChange={e => setFormData({ ...formData, author: e.target.value })}
                placeholder="e.g. Sahin Miah"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                placeholder="Next.js, Security, Architecture"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Featured Banner Image (URL or Local PC Upload) */}
          <ImageUploadOrUrl
            label="Featured Banner Image *"
            value={formData.featuredImage}
            onChange={(url) => setFormData({ ...formData, featuredImage: url })}
            presets={[
              { label: 'Coding', url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' },
              { label: 'Architecture', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80' },
              { label: 'Cyber Security', url: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=800&q=80' }
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Short Excerpt (Lead-in summary)</label>
            <input
              type="text"
              value={formData.excerpt}
              onChange={e => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief preview text shown in article listings and social previews"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>External Link / Vlog URL (Optional)</span>
              <span className="text-[10px] text-indigo-400">YouTube, Vimeo, Loom or Live Web URL</span>
            </label>
            <div className="relative">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... or https://regardstech.com/..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-500 mt-1">If set, a responsive video player or direct link button will be featured in the article reader.</p>
          </div>

          {/* Content Editor with Editor / Preview Toggle */}
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <label className="text-xs font-medium text-slate-300">Article Content (Markdown supported)</label>
              
              <div className="flex items-center gap-1.5 flex-wrap">
                {contentTab === 'editor' && (
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-md p-0.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => insertMarkdown('**', '**')}
                      className="px-2 py-0.5 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Bold"
                    >
                      B
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('*', '*')}
                      className="px-2 py-0.5 text-xs italic text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Italic"
                    >
                      I
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('## ')}
                      className="px-1.5 py-0.5 text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Heading 2"
                    >
                      H2
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('> ')}
                      className="px-1.5 py-0.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Quote"
                    >
                      &ldquo;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('```\n', '\n```')}
                      className="px-1.5 py-0.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Code Block"
                    >
                      &lt;/&gt;
                    </button>
                    <button
                      type="button"
                      onClick={() => insertMarkdown('- ')}
                      className="px-1.5 py-0.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors"
                      title="Bullet List"
                    >
                      • List
                    </button>

                    <div className="w-px h-3.5 bg-slate-800 mx-0.5" />

                    {/* Link Insert Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter link URL (e.g. https://...):');
                        if (url && url.trim()) {
                          const title = prompt('Enter link text:', 'Visit Link') || 'Link';
                          insertMarkdown(`[${title}](${url.trim()})`);
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-blue-300 hover:text-white bg-blue-950/60 hover:bg-blue-900/60 border border-blue-800/40 rounded transition-colors"
                      title="Insert Hyperlink"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>Link</span>
                    </button>

                    {/* Vlog / Video Insert Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const url = prompt('Enter YouTube or Video URL (e.g. https://www.youtube.com/watch?v=...):');
                        if (url && url.trim()) {
                          insertMarkdown(`\n\n[🎥 Watch Vlog Video Walkthrough](${url.trim()})\n\n`);
                          if (!formData.link) {
                            setFormData(prev => ({ ...prev, link: url.trim() }));
                          }
                        }
                      }}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-rose-300 hover:text-white bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800/40 rounded transition-colors"
                      title="Insert Vlog / Video Link"
                    >
                      <Video className="w-3 h-3" />
                      <span>Vlog/Video</span>
                    </button>

                    <div className="w-px h-3.5 bg-slate-800 mx-0.5" />

                    {/* Image URL Insert Button */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInsertDialog(!showUrlInsertDialog)}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-800/40 rounded transition-colors"
                      title="Insert Image by Web URL"
                    >
                      <ImageIcon className="w-3 h-3" />
                      <span>Image URL</span>
                    </button>

                    {/* Image Upload from PC Button */}
                    <button
                      type="button"
                      onClick={() => bodyImageInputRef.current?.click()}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/40 rounded transition-colors"
                      title="Upload Image from your PC directly into content"
                    >
                      <UploadCloud className="w-3 h-3" />
                      <span>Upload PC Image</span>
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-md">
                  <button
                    type="button"
                    onClick={() => setContentTab('editor')}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      contentTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentTab('preview')}
                    className={`px-2 py-0.5 text-xs rounded transition-colors ${
                      contentTab === 'preview' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Live Preview
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden PC Image Input for Body */}
            <input
              ref={bodyImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleBodyImageFile(file);
                e.target.value = '';
              }}
            />

            {/* Quick Image URL Inserter Bar */}
            {showUrlInsertDialog && contentTab === 'editor' && (
              <div className="mb-2 p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/50 flex items-center gap-2 text-xs">
                <ImageIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Paste direct image link: https://images.unsplash.com/..."
                  value={insertImageUrl}
                  onChange={(e) => setInsertImageUrl(e.target.value)}
                  className="flex-1 px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (insertImageUrl.trim()) {
                      insertMarkdown(`\n\n![Article Illustration](${insertImageUrl.trim()})\n\n`);
                      setInsertImageUrl('');
                      setShowUrlInsertDialog(false);
                      showToast('Image inserted into content!', 'success');
                    }
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded text-xs transition-colors shrink-0"
                >
                  Insert Image
                </button>
                <button
                  type="button"
                  onClick={() => setShowUrlInsertDialog(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {contentTab === 'editor' ? (
              <textarea
                id="blog-admin-content-area"
                rows={10}
                value={formData.content}
                onChange={e => setFormData({ ...formData, content: e.target.value })}
                required
                placeholder="Write structured markdown content. You can insert images by clicking 'Upload PC Image' or 'Image URL' above..."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500 leading-relaxed"
              />
            ) : (
              <div className="w-full min-h-[220px] max-h-[300px] overflow-y-auto p-4 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 prose prose-invert max-w-none">
                <pre className="whitespace-pre-wrap font-sans leading-relaxed">{formData.content}</pre>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Publish Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value="draft">Draft (Work in progress)</option>
                <option value="published">Published (Visible on site)</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-indigo-600"
                />
                <span className="text-xs text-slate-300 font-medium">Pin as Featured Article</span>
              </label>
            </div>
          </div>

          {/* SEO fields */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-2 mt-2">
            <div className="text-xs font-semibold text-slate-300">SEO & Structured Keywords</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">SEO Title</label>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="Custom browser title"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Keywords</label>
                <input
                  type="text"
                  value={formData.seoKeywords}
                  onChange={e => setFormData({ ...formData, seoKeywords: e.target.value })}
                  placeholder="tech, nextjs, security"
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{modalMode === 'create' ? 'Publish/Save Article' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Explore & Read Article Modal */}
      <Modal
        isOpen={Boolean(exploreBlog)}
        onClose={() => setExploreBlog(null)}
        title={exploreBlog ? `Article: ${exploreBlog.title}` : 'Article Reader'}
        maxWidth="lg"
      >
        {exploreBlog && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Featured Image Banner */}
            <div className="relative aspect-video max-h-72 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <img
                src={exploreBlog.featuredImage}
                alt={exploreBlog.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-xs font-semibold text-white">
                  {exploreBlog.category}
                </span>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold backdrop-blur-md ${
                  exploreBlog.status === 'published' ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                }`}>
                  {exploreBlog.status}
                </span>
              </div>
            </div>

            {/* Title & Metadata */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight leading-snug">
                {exploreBlog.title}
              </h2>
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2 font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  {exploreBlog.author}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(exploreBlog.publishDate || exploreBlog.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-indigo-400">/{exploreBlog.slug}</span>
              </div>
            </div>

            {/* Excerpt */}
            {exploreBlog.excerpt && (
              <div className="p-3.5 rounded-xl bg-slate-950/80 border-l-4 border-indigo-500 border-slate-800 text-slate-200 text-xs italic leading-relaxed">
                "{exploreBlog.excerpt}"
              </div>
            )}

            {/* Vlog / Video Media or External Link Display */}
            {exploreBlog.link && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-white uppercase tracking-wider flex items-center gap-1.5">
                    {isVideoUrl(exploreBlog.link) ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-rose-400" />
                        <span>Vlog / Video Media</span>
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-3.5 h-3.5 text-blue-400" />
                        <span>Attached Live Link</span>
                      </>
                    )}
                  </h4>
                  <a
                    href={exploreBlog.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 underline inline-flex items-center gap-1"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {getYouTubeEmbedUrl(exploreBlog.link) ? (
                  <div className="aspect-video w-full rounded-xl overflow-hidden border border-slate-800 bg-black shadow-lg">
                    <iframe
                      src={getYouTubeEmbedUrl(exploreBlog.link)!}
                      title={exploreBlog.title}
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 truncate text-xs text-slate-300">
                      <LinkIcon className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-mono truncate">{exploreBlog.link}</span>
                    </div>
                    <a
                      href={exploreBlog.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1 transition-colors"
                    >
                      <span>Visit Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Article Content Body */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Article Body</h4>
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 leading-relaxed text-slate-300 whitespace-pre-wrap font-sans text-xs space-y-3">
                {exploreBlog.content}
              </div>
            </div>

            {/* Tags */}
            {exploreBlog.tags && exploreBlog.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-1.5">Topics & Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {exploreBlog.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <div>
                {exploreBlog.link ? (
                  <a
                    href={exploreBlog.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${isVideoUrl(exploreBlog.link) ? 'bg-rose-600/20 text-rose-300 hover:bg-rose-600 hover:text-white border border-rose-500/30' : 'bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white border border-indigo-500/30'}`}
                  >
                    {isVideoUrl(exploreBlog.link) ? <Video className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
                    <span>{isVideoUrl(exploreBlog.link) ? 'Watch Vlog Video' : 'Visit Live Article Link'}</span>
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">No external link attached</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const b = exploreBlog;
                      setExploreBlog(null);
                      handleOpenEdit(b);
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                  >
                    Edit This Article
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setExploreBlog(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Article?"
        message="Are you sure you want to permanently delete this article? This action cannot be undone."
        confirmLabel="Delete Article"
        isLoading={isDeleting}
      />
    </div>
  );
};
