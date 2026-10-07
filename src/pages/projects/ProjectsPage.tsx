import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  ExternalLink,
  Github,
  Edit2,
  Trash2,
  Filter,
  CheckCircle2,
  Clock,
  FileCode,
  Star,
  Loader2,
  LayoutGrid,
  List
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Project } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { ImageUploadOrUrl } from '../../components/common/ImageUploadOrUrl.tsx';

export const ProjectsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [isLoading, setIsLoading] = useState(true);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    category: 'Web Development',
    shortDescription: '',
    description: '',
    technologies: 'React, Next.js, Node.js, Tailwind CSS',
    clientName: '',
    projectUrl: '',
    githubUrl: '',
    completionDate: '2026-03-01',
    featured: false,
    status: 'published' as 'published' | 'draft' | 'in_progress',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    seoTitle: '',
    seoDescription: ''
  });

  const canCreate = hasPermission('projects', 'create');
  const canEdit = hasPermission('projects', 'edit');
  const canDelete = hasPermission('projects', 'delete');

  const fetchProjects = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getProjects({
        search,
        category: category !== 'all' ? category : undefined,
        status: status !== 'all' ? status : undefined,
        page,
        limit: 8
      });
      if (res.success) {
        setProjects(res.projects);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setCategories(res.categories);
      }
    } catch {
      showToast('Failed to load projects.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, category, status, page, showToast]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedProject(null);
    setFormData({
      title: '',
      slug: '',
      category: 'Web Development',
      shortDescription: '',
      description: '',
      technologies: 'Next.js, TypeScript, Tailwind CSS, PostgreSQL',
      clientName: '',
      projectUrl: '',
      githubUrl: '',
      completionDate: new Date().toISOString().split('T')[0],
      featured: false,
      status: 'published',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
      seoTitle: '',
      seoDescription: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Project) => {
    setModalMode('edit');
    setSelectedProject(p);
    setFormData({
      title: p.title,
      slug: p.slug,
      category: p.category,
      shortDescription: p.shortDescription,
      description: p.description,
      technologies: p.technologies.join(', '),
      clientName: p.clientName || '',
      projectUrl: p.projectUrl || '',
      githubUrl: p.githubUrl || '',
      completionDate: p.completionDate || '',
      featured: p.featured,
      status: p.status,
      imageUrl: p.imageUrl,
      seoTitle: p.seoTitle || '',
      seoDescription: p.seoDescription || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        technologies: formData.technologies.split(',').map(s => s.trim()).filter(Boolean)
      };

      if (modalMode === 'create') {
        const res = await api.createProject(payload);
        showToast(res.message, 'success');
      } else if (selectedProject) {
        const res = await api.updateProject(selectedProject.id, payload);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchProjects();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteProject(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchProjects();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed.', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Regards Tech Projects Portfolio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage case studies and showcase projects published to the Next.js website
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Project</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search projects by title, category, or technology…"
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters:</span>
          </div>

          <select
            value={category}
            onChange={e => {
              setCategory(e.target.value);
              setPage(1);
            }}
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
            onChange={e => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-2.5 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
          >
            <option value="all">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="in_progress">In Progress</option>
          </select>

          {/* View Mode Toggle: Cards Grid vs Table */}
          <div className="flex items-center p-0.5 bg-slate-950 border border-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Compact Table View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Display */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description="Try changing your search keywords or filter criteria, or add your first project."
          action={canCreate ? { label: 'Create Project', onClick: handleOpenCreate } : undefined}
        />
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map(p => (
              <div
                key={p.id}
                className="group bg-slate-900/70 border border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative aspect-video overflow-hidden bg-slate-950">
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-600/90 text-white backdrop-blur-md border border-indigo-400/30">
                        {p.category}
                      </span>
                      {p.featured && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/90 text-slate-950 backdrop-blur-md flex items-center gap-1">
                          <Star className="w-2.5 h-2.5 fill-slate-950" /> Featured
                        </span>
                      )}
                    </div>
                    <div className="absolute top-2.5 right-2.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-md ${
                          p.status === 'published'
                            ? 'bg-emerald-500/80 text-white'
                            : p.status === 'in_progress'
                            ? 'bg-cyan-500/80 text-white'
                            : 'bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {p.title}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {p.shortDescription}
                    </p>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {p.technologies.slice(0, 3).map(tech => (
                        <span
                          key={tech}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-300"
                        >
                          {tech}
                        </span>
                      ))}
                      {p.technologies.length > 3 && (
                        <span className="text-[10px] px-1.5 py-0.5 text-slate-500">
                          +{p.technologies.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 border-t border-slate-800/50 mt-3 flex items-center justify-between">
                  {p.projectUrl ? (
                    <a
                      href={p.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                    >
                      <span>Visit Site</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[11px] text-slate-500">No external link</span>
                  )}

                  <div className="flex items-center gap-1">
                    {canEdit && (
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Edit Project"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeleteId(p.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            limit={8}
            onPageChange={setPage}
            itemName="projects"
          />
        </div>
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Project</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Technologies</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Title + Thumbnail + Featured */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imageUrl}
                          alt={p.title}
                          className="w-12 h-9 rounded-md object-cover border border-slate-800 bg-slate-950 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white truncate">{p.title}</span>
                            {p.featured && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400">
                                <Star className="w-3 h-3 fill-amber-400" />
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm mt-0.5">
                            {p.shortDescription}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-300">
                      {p.category}
                    </td>

                    {/* Technologies - clean text list */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="text-slate-400 truncate text-[11px]">
                        {p.technologies.slice(0, 3).join(' · ')}
                        {p.technologies.length > 3 && ` +${p.technologies.length - 3}`}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {p.status === 'published' && (
                        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Published
                        </span>
                      )}
                      {p.status === 'in_progress' && (
                        <span className="inline-flex items-center gap-1.5 text-cyan-400 font-medium text-[11px]">
                          <Clock className="w-3.5 h-3.5" /> In Progress
                        </span>
                      )}
                      {p.status === 'draft' && (
                        <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium text-[11px]">
                          <FileCode className="w-3.5 h-3.5" /> Draft
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.projectUrl && (
                          <a
                            href={p.projectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                            title="Open Live URL"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}

                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Edit Project"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Delete Project"
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

          {/* Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={total}
            limit={8}
            onPageChange={setPage}
            itemName="projects"
          />
        </div>
      )}

      {/* Add / Edit Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add New Project' : `Edit: ${selectedProject?.title}`}
        subtitle="This project data is directly served to the Regards Tech Next.js website"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. FinTech NextGen Banking Portal"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value="E-Commerce">E-Commerce</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Agency & Branding">Agency & Branding</option>
                <option value="Web & App Development">Web & App Development</option>
                <option value="Digital Marketing">Digital Marketing</option>
                <option value="Graphic Design">Graphic Design</option>
                <option value="Cyber Security">Cyber Security</option>
                <option value="FinTech & Banking">FinTech & Banking</option>
                <option value="Consultancy & Advisory">Consultancy & Advisory</option>
                <option value="SaaS & Cloud">SaaS & Cloud</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Custom Slug (Auto-generated if left blank)</label>
            <input
              type="text"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              placeholder="fintech-banking-portal"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Short Description (Kicker) *</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Brief 1-line overview displayed on grid cards"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed architecture, scope of work, and enterprise business results achieved..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Technologies (Comma separated)</label>
              <input
                type="text"
                value={formData.technologies}
                onChange={e => setFormData({ ...formData, technologies: e.target.value })}
                placeholder="React, Next.js, TypeScript, Tailwind"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client Name</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. OmniPay Financial Global"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Project Live URL</label>
              <input
                type="url"
                value={formData.projectUrl}
                onChange={e => setFormData({ ...formData, projectUrl: e.target.value })}
                placeholder="https://client-demo.com"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">GitHub Repo URL</label>
              <input
                type="url"
                value={formData.githubUrl}
                onChange={e => setFormData({ ...formData, githubUrl: e.target.value })}
                placeholder="https://github.com/regardstech/repo"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Image (URL or Local PC Upload) */}
          <ImageUploadOrUrl
            label="Project Image *"
            value={formData.imageUrl}
            onChange={(url) => setFormData({ ...formData, imageUrl: url })}
            presets={[
              { label: 'FinTech', url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80' },
              { label: 'E-Commerce', url: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80' },
              { label: 'Cloud App', url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80' }
            ]}
          />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Publish Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'published' | 'draft' | 'in_progress' })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Completion Date</label>
              <input
                type="date"
                value={formData.completionDate}
                onChange={e => setFormData({ ...formData, completionDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                  className="w-4 h-4 rounded-sm border-slate-700 bg-slate-950 text-indigo-600"
                />
                <span className="text-xs text-slate-300 font-medium">Featured on Home Page</span>
              </label>
            </div>
          </div>

          {/* SEO fields */}
          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-3 mt-2">
            <div className="text-xs font-semibold text-slate-300">Search Engine Optimization (SEO)</div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">SEO Meta Title</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="NextGen Banking Case Study | Regards Tech"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">SEO Meta Description</label>
              <input
                type="text"
                value={formData.seoDescription}
                onChange={e => setFormData({ ...formData, seoDescription: e.target.value })}
                placeholder="High-converting meta description for Google indexing"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md text-xs text-white"
              />
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
              <span>{modalMode === 'create' ? 'Create Project' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirmation Dialog for Deleting */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message="Are you sure you want to delete this project? It will be removed from your website portfolio immediately."
        confirmLabel="Delete Project"
        isLoading={isDeleting}
      />
    </div>
  );
};
