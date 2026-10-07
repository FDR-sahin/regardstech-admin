import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  TrendingUp,
  Tag,
  Eye
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { CaseStudy } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { ImageUploadOrUrl } from '../../components/common/ImageUploadOrUrl.tsx';

export const CaseStudiesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<CaseStudy | null>(null);
  const [exploreCaseStudy, setExploreCaseStudy] = useState<CaseStudy | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    key: '',
    title: '',
    subtitle: '',
    category: 'Agency',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
    link: '',
    tags: 'Next.js, Agency, 2026',
    accent: '#2563EB',
    client: '',
    metrics: [{ label: 'Performance', value: '99/100' }],
    overview: '',
    challenge: '',
    solution: '',
    results: '',
    status: 'published' as 'published' | 'draft'
  });

  const canCreate = hasPermission('projects', 'create');
  const canEdit = hasPermission('projects', 'edit');
  const canDelete = hasPermission('projects', 'delete');

  const fetchCaseStudies = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getCaseStudies({
        search,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined
      });
      if (res.success) {
        setCaseStudies(res.caseStudies);
      }
    } catch {
      showToast('Failed to load case studies.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status, showToast]);

  useEffect(() => {
    fetchCaseStudies();
  }, [fetchCaseStudies]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedItem(null);
    setFormData({
      key: '',
      title: '',
      subtitle: '',
      category: 'Agency',
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      link: 'https://regardstech.com/',
      tags: 'Next.js, Agency, 2026',
      accent: '#2563EB',
      client: '',
      metrics: [{ label: 'Speed', value: '+300%' }],
      overview: '',
      challenge: '',
      solution: '',
      results: '',
      status: 'published'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: CaseStudy) => {
    setModalMode('edit');
    setSelectedItem(c);
    setFormData({
      key: c.key,
      title: c.title,
      subtitle: c.subtitle,
      category: c.category,
      image: c.image,
      link: c.link,
      tags: c.tags.join(', '),
      accent: c.accent || '#2563EB',
      client: c.client || '',
      metrics: c.metrics && c.metrics.length > 0 ? c.metrics : [{ label: 'Speed', value: '+200%' }],
      overview: c.overview || '',
      challenge: c.challenge || '',
      solution: c.solution || '',
      results: c.results || '',
      status: c.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };

      if (modalMode === 'create') {
        const res = await api.createCaseStudy(payload);
        showToast(res.message, 'success');
      } else if (selectedItem) {
        const res = await api.updateCaseStudy(selectedItem.id, payload);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchCaseStudies();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Operation failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteCaseStudy(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchCaseStudies();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to delete.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Case Studies Management</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Architected portfolio showcases, client transformation stories, and theme settings
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Case Study</span>
          </button>
        )}
      </div>

      {/* Toolbar & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, client, or tag..."
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Categories</option>
            <option value="Agency">Agency</option>
            <option value="E-Commerce">E-Commerce</option>
            <option value="EdTech">EdTech</option>
            <option value="Healthcare">Healthcare</option>
            <option value="Consultancy">Consultancy</option>
          </select>

          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : caseStudies.length === 0 ? (
        <EmptyState
          title="No case studies found"
          description="Create your first client transformation showcase to display in the website showcase."
          action={canCreate ? { label: 'Add Case Study', onClick: handleOpenCreate } : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {caseStudies.map(item => (
            <div
              key={item.id}
              className="group bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-video overflow-hidden bg-slate-950">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ backgroundColor: item.accent }}
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white shadow-xs backdrop-blur-md"
                      style={{ backgroundColor: item.accent }}
                    >
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono text-slate-300 bg-slate-950/80 border border-slate-800">
                      key: {item.key}
                    </span>
                  </div>
                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md ${
                        item.status === 'published' ? 'bg-emerald-500/80 text-white' : 'bg-slate-800/80 text-slate-300'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{item.subtitle}</p>

                  {item.overview && (
                    <p className="text-xs text-slate-300 mt-2 line-clamp-2 leading-relaxed">
                      {item.overview}
                    </p>
                  )}

                  {/* Metrics Pills */}
                  {item.metrics && item.metrics.length > 0 && (
                    <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-800/60">
                      {item.metrics.map((m, i) => (
                        <div key={i} className="p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-center">
                          <div className="text-[10px] text-slate-400 truncate">{m.label}</div>
                          <div className="text-xs font-bold text-white font-mono mt-0.5">{m.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {item.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 pt-0 border-t border-slate-800/50 mt-3 flex items-center justify-between">
                {item.link ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold hover:underline inline-flex items-center gap-1"
                    style={{ color: item.accent }}
                  >
                    <span>Visit Live Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[11px] text-slate-500">No URL</span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setExploreCaseStudy(item)}
                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-md transition-colors"
                    title="Explore Case Study Details"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Edit Case Study"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                      title="Delete Case Study"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Case Study</th>
                  <th className="py-3.5 px-4">Key</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Accent</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {caseStudies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.image}
                          alt={c.title}
                          className="w-12 h-9 rounded-md object-cover border border-slate-800 bg-slate-950 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{c.title}</div>
                          <div className="text-[11px] text-slate-400 truncate">{c.subtitle}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300">{c.key}</td>
                    <td className="py-3.5 px-4 text-slate-300">{c.category}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-slate-700" style={{ backgroundColor: c.accent }} />
                        <span className="font-mono text-[10px] text-slate-400">{c.accent}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        c.status === 'published' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setExploreCaseStudy(c)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors"
                          title="Explore Case Study"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        {c.link && (
                          <a
                            href={c.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(c.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
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
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Case Study' : `Edit: ${selectedItem?.title}`}
        subtitle="Saved data immediately reflects on the Next.js CaseStudiesShowcase component"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Regards Tech"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Key (Identifier) *</label>
              <input
                type="text"
                value={formData.key}
                onChange={e => setFormData({ ...formData, key: e.target.value })}
                placeholder="e.g. regards, elabira, pdfbazar"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Subtitle / Tagline *</label>
              <input
                type="text"
                value={formData.subtitle}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Agency website & brand rebuild"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value="Agency">Agency</option>
                <option value="E-Commerce">E-Commerce</option>
                <option value="EdTech">EdTech</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Consultancy">Consultancy</option>
                <option value="FinTech">FinTech</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Live Website Link</label>
              <input
                type="url"
                value={formData.link}
                onChange={e => setFormData({ ...formData, link: e.target.value })}
                placeholder="https://regardstech.com/"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Theme Accent Color (Hex)</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.accent}
                  onChange={e => setFormData({ ...formData, accent: e.target.value })}
                  className="w-8 h-8 rounded-md bg-transparent border border-slate-800 cursor-pointer p-0"
                />
                <input
                  type="text"
                  value={formData.accent}
                  onChange={e => setFormData({ ...formData, accent: e.target.value })}
                  placeholder="#2563EB"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Cover Image (URL or Local PC Upload) */}
          <ImageUploadOrUrl
            label="Cover Image *"
            value={formData.image}
            onChange={(url) => setFormData({ ...formData, image: url })}
            presets={[
              { label: 'Agency', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' },
              { label: 'FinTech', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
              { label: 'Healthcare', url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=800&q=80' }
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Tags (Comma-separated)</label>
            <input
              type="text"
              value={formData.tags}
              onChange={e => setFormData({ ...formData, tags: e.target.value })}
              placeholder="Next.js, Agency, 2026"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Overview Description</label>
            <textarea
              rows={2}
              value={formData.overview}
              onChange={e => setFormData({ ...formData, overview: e.target.value })}
              placeholder="Full digital agency presence overhaul with sub-50ms TTFB..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Challenge</label>
              <textarea
                rows={2}
                value={formData.challenge}
                onChange={e => setFormData({ ...formData, challenge: e.target.value })}
                placeholder="Describe the client bottleneck or legacy limitations..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Solution</label>
              <textarea
                rows={2}
                value={formData.solution}
                onChange={e => setFormData({ ...formData, solution: e.target.value })}
                placeholder="Architected solution and modern frameworks applied..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400">Status:</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' })}
                className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3 py-2 rounded-lg border border-slate-800 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{modalMode === 'create' ? 'Create Case Study' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Explore Case Study Modal */}
      <Modal
        isOpen={Boolean(exploreCaseStudy)}
        onClose={() => setExploreCaseStudy(null)}
        title={exploreCaseStudy ? `Case Study: ${exploreCaseStudy.title}` : 'Case Study Details'}
        maxWidth="lg"
      >
        {exploreCaseStudy && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Banner preview */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video max-h-64 w-full">
              <img
                src={exploreCaseStudy.image}
                alt={exploreCaseStudy.title}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute top-0 left-0 right-0 h-1.5"
                style={{ backgroundColor: exploreCaseStudy.accent }}
              />
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between p-3 rounded-xl bg-slate-950/85 backdrop-blur-md border border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white"
                      style={{ backgroundColor: exploreCaseStudy.accent }}
                    >
                      {exploreCaseStudy.category}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">Key: {exploreCaseStudy.key}</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{exploreCaseStudy.title}</h3>
                </div>
                {exploreCaseStudy.link && (
                  <a
                    href={exploreCaseStudy.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shrink-0"
                  >
                    <span>Live Project</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>

            {/* Metrics */}
            {exploreCaseStudy.metrics && exploreCaseStudy.metrics.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Measured Impact & Key Metrics</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {exploreCaseStudy.metrics.map((m, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider">{m.label}</div>
                      <div className="text-base font-extrabold text-white font-mono mt-1" style={{ color: exploreCaseStudy.accent }}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Overview */}
            {exploreCaseStudy.overview && (
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Executive Overview</h4>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 leading-relaxed text-slate-300">
                  {exploreCaseStudy.overview}
                </div>
              </div>
            )}

            {/* Challenge & Solution Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-semibold text-rose-300 uppercase tracking-wider mb-1.5">The Challenge</h4>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 leading-relaxed text-slate-300 min-h-[90px]">
                  {exploreCaseStudy.challenge || 'No challenge description specified.'}
                </div>
              </div>
              <div>
                <h4 className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-1.5">The Solution</h4>
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 leading-relaxed text-slate-300 min-h-[90px]">
                  {exploreCaseStudy.solution || 'No solution description specified.'}
                </div>
              </div>
            </div>

            {/* Results */}
            {exploreCaseStudy.results && (
              <div>
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Business & Technical Results</h4>
                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 leading-relaxed text-slate-300">
                  {exploreCaseStudy.results}
                </div>
              </div>
            )}

            {/* Tags / Stack */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Tech Stack & Tags</h4>
              <div className="flex flex-wrap gap-1.5">
                {exploreCaseStudy.tags.map(t => (
                  <span key={t} className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-slate-300 text-xs font-mono">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const item = exploreCaseStudy;
                    setExploreCaseStudy(null);
                    handleOpenEdit(item);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Edit Case Study
                </button>
              )}
              <button
                type="button"
                onClick={() => setExploreCaseStudy(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Case Study"
        message="Are you sure you want to permanently delete this case study? It will be removed from the public website showcase immediately."
        confirmLabel="Delete Showcase"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  );
};
