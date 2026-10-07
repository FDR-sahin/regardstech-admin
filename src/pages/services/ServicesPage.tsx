import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Code,
  Smartphone,
  TrendingUp,
  Palette,
  ShieldCheck,
  Server,
  Sparkles,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Service } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';

const ICON_OPTIONS = [
  { name: 'Code', icon: Code },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'TrendingUp', icon: TrendingUp },
  { name: 'Palette', icon: Palette },
  { name: 'ShieldCheck', icon: ShieldCheck },
  { name: 'Server', icon: Server },
  { name: 'Sparkles', icon: Sparkles }
];

export const ServicesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [services, setServices] = useState<Service[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [exploreService, setExploreService] = useState<Service | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: 'Code',
    shortDescription: '',
    fullDescription: '',
    featuresText: 'High scalability\nREST API architecture\n24/7 Monitoring',
    status: 'active' as 'active' | 'inactive',
    seoTitle: '',
    seoDescription: ''
  });

  const canCreate = hasPermission('services', 'create');
  const canEdit = hasPermission('services', 'edit');
  const canDelete = hasPermission('services', 'delete');

  const fetchServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getServices({
        search,
        status: status !== 'all' ? status : undefined
      });
      if (res.success) {
        setServices(res.services);
      }
    } catch {
      showToast('Failed to load services', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, showToast]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedService(null);
    setFormData({
      name: '',
      slug: '',
      icon: 'Code',
      shortDescription: '',
      fullDescription: '',
      featuresText: 'Full-stack engineering\nMicroservice cloud backend\nOptimized Core Web Vitals',
      status: 'active',
      seoTitle: '',
      seoDescription: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Service) => {
    setModalMode('edit');
    setSelectedService(s);
    setFormData({
      name: s.name,
      slug: s.slug,
      icon: s.icon,
      shortDescription: s.shortDescription,
      fullDescription: s.fullDescription,
      featuresText: s.features.join('\n'),
      status: s.status,
      seoTitle: s.seoTitle || '',
      seoDescription: s.seoDescription || ''
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const payload = {
        name: formData.name,
        slug: formData.slug || undefined,
        icon: formData.icon,
        shortDescription: formData.shortDescription,
        fullDescription: formData.fullDescription,
        features: formData.featuresText.split('\n').map(l => l.trim()).filter(Boolean),
        status: formData.status,
        seoTitle: formData.seoTitle,
        seoDescription: formData.seoDescription
      };

      if (modalMode === 'create') {
        const res = await api.createService(payload);
        showToast(res.message, 'success');
      } else if (selectedService) {
        const res = await api.updateService(selectedService.id, payload);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchServices();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (service: Service) => {
    try {
      const newStatus = service.status === 'active' ? 'inactive' : 'active';
      await api.updateService(service.id, { status: newStatus });
      showToast(`Service set to ${newStatus}`, 'info');
      fetchServices();
    } catch {
      showToast('Status update failed', 'error');
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...services];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;

    setServices(newItems);
    try {
      await api.reorderServices(newItems.map(item => item.id));
      showToast('Services reordered', 'success');
    } catch {
      showToast('Reorder failed', 'error');
      fetchServices();
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteService(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchServices();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const renderIcon = (iconName: string) => {
    const found = ICON_OPTIONS.find(o => o.name === iconName);
    const Comp = found ? found.icon : Code;
    return <Comp className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Regards Tech Services</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Configure service offerings, reorder navigation hierarchy, and sync with Next.js REST routes
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Service</span>
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
            placeholder="Search service name, description, features…"
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Services Table */}
      {isLoading ? (
        <TableSkeleton rows={6} cols={4} />
      ) : services.length === 0 ? (
        <EmptyState
          title="No services found"
          description="Add a service or change search filter."
          action={canCreate ? { label: 'Add Service', onClick: handleOpenCreate } : undefined}
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-14">Order</th>
                  <th className="py-3.5 px-4">Service</th>
                  <th className="py-3.5 px-4">Slug</th>
                  <th className="py-3.5 px-4">Key Features</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {services.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Order buttons */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMove(index, 'up')}
                          disabled={index === 0}
                          className="p-1 rounded-sm text-slate-500 hover:text-white disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <span className="font-mono text-slate-400 tabular-nums w-4 text-center">
                          {s.order}
                        </span>
                        <button
                          onClick={() => handleMove(index, 'down')}
                          disabled={index === services.length - 1}
                          className="p-1 rounded-sm text-slate-500 hover:text-white disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Name + Icon */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0">
                          {renderIcon(s.icon)}
                        </div>
                        <div>
                          <div className="font-semibold text-white">{s.name}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{s.shortDescription}</div>
                        </div>
                      </div>
                    </td>

                    {/* Slug */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      /{s.slug}
                    </td>

                    {/* Features */}
                    <td className="py-3.5 px-4 max-w-xs text-slate-400 text-[11px]">
                      {s.features.slice(0, 2).join(' · ')}
                      {s.features.length > 2 && ` (+${s.features.length - 2} more)`}
                    </td>

                    {/* Status Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {canEdit ? (
                        <button
                          onClick={() => handleToggleStatus(s)}
                          className={`inline-flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                            s.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          {s.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5" /> Active
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3.5 h-3.5" /> Inactive
                            </>
                          )}
                        </button>
                      ) : (
                        <span className={`text-xs ${s.status === 'active' ? 'text-emerald-400' : 'text-slate-500'}`}>
                          {s.status}
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setExploreService(s)}
                          className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors"
                          title="Explore Service Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canEdit && (
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Edit Service"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Delete Service"
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Service Offering' : `Edit: ${selectedService?.name}`}
        maxWidth="xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Service Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Cyber Security"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Icon Representation</label>
              <select
                value={formData.icon}
                onChange={e => setFormData({ ...formData, icon: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                {ICON_OPTIONS.map(opt => (
                  <option key={opt.name} value={opt.name}>
                    {opt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Short Description (Kicker) *</label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={e => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="Single sentence summarizing the service value proposition"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Full Detailed Description</label>
            <textarea
              rows={3}
              value={formData.fullDescription}
              onChange={e => setFormData({ ...formData, fullDescription: e.target.value })}
              placeholder="Full service overview displayed on the dedicated service landing page..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Deliverables & Features (One per line)
            </label>
            <textarea
              rows={4}
              value={formData.featuresText}
              onChange={e => setFormData({ ...formData, featuresText: e.target.value })}
              placeholder="Zero-trust network architecture&#10;Penetration testing & vulnerability audits&#10;SOC2 & ISO 27001 readiness"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value="active">Active (Published on website)</option>
                <option value="inactive">Inactive (Hidden)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Custom Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={e => setFormData({ ...formData, slug: e.target.value })}
                placeholder="auto-generated from name if blank"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800/80 space-y-2 mt-2">
            <div className="text-xs font-semibold text-slate-300">SEO Settings</div>
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">SEO Title</label>
              <input
                type="text"
                value={formData.seoTitle}
                onChange={e => setFormData({ ...formData, seoTitle: e.target.value })}
                placeholder="Enterprise Web Development | Regards Tech"
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
              <span>{modalMode === 'create' ? 'Create Service' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Explore Service Details Modal */}
      <Modal
        isOpen={Boolean(exploreService)}
        onClose={() => setExploreService(null)}
        title={exploreService ? `Explore: ${exploreService.name}` : 'Service Details'}
        maxWidth="lg"
      >
        {exploreService && (
          <div className="space-y-6 text-xs text-slate-300">
            {/* Header banner */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                {renderIcon(exploreService.icon)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{exploreService.name}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                    exploreService.status === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {exploreService.status}
                  </span>
                </div>
                <p className="text-xs text-indigo-400 font-mono mt-0.5">Slug: /{exploreService.slug}</p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed">{exploreService.shortDescription}</p>
              </div>
            </div>

            {/* Detailed Description */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Service Overview & Scope</h4>
              <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 leading-relaxed whitespace-pre-line text-slate-300 text-xs">
                {exploreService.fullDescription || 'No extended description provided.'}
              </div>
            </div>

            {/* Key Capabilities / Deliverables */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Included Deliverables & Features</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {exploreService.features.map((feat, i) => (
                  <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-slate-200">{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Technical Execution Workflow */}
            <div>
              <h4 className="text-xs font-semibold text-white uppercase tracking-wider mb-2">Standard Delivery Process</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-indigo-400 font-bold uppercase">Phase 1</div>
                  <div className="text-xs text-white font-medium mt-1">Discovery</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Scope & Tech Stack</div>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-emerald-400 font-bold uppercase">Phase 2</div>
                  <div className="text-xs text-white font-medium mt-1">UI/UX Design</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Figma Prototypes</div>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-amber-400 font-bold uppercase">Phase 3</div>
                  <div className="text-xs text-white font-medium mt-1">Engineering</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Modern Codebase</div>
                </div>
                <div className="p-2.5 bg-slate-950/50 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase">Phase 4</div>
                  <div className="text-xs text-white font-medium mt-1">QA & Launch</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Cloud Deployment</div>
                </div>
              </div>
            </div>

            {/* Public REST API Endpoint Helper */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 font-mono text-[11px] flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-bold">GET</span>
                <span className="text-slate-300 ml-2">/api/public/services/{exploreService.slug}</span>
              </div>
              <span className="text-[10px] text-slate-500">Live Website REST Endpoint</span>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const s = exploreService;
                    setExploreService(null);
                    handleOpenEdit(s);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold"
                >
                  Edit This Service
                </button>
              )}
              <button
                type="button"
                onClick={() => setExploreService(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Service?"
        message="Are you sure you want to delete this service? It will no longer be listed on the public website."
        confirmLabel="Delete Service"
        isLoading={isDeleting}
      />
    </div>
  );
};
