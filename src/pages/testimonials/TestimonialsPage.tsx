import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  Building,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { Testimonial } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { ImageUploadOrUrl } from '../../components/common/ImageUploadOrUrl.tsx';

export const TestimonialsPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedItem, setSelectedItem] = useState<Testimonial | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    clientName: '',
    clientPhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80',
    position: 'Chief Technology Officer',
    company: '',
    review: '',
    rating: 5,
    status: 'active' as 'active' | 'inactive'
  });

  const canCreate = hasPermission('testimonials', 'create');
  const canEdit = hasPermission('testimonials', 'edit');
  const canDelete = hasPermission('testimonials', 'delete');

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getTestimonials({
        search,
        status: status !== 'all' ? status : undefined
      });
      if (res.success) {
        setTestimonials(res.testimonials);
      }
    } catch {
      showToast('Failed to load testimonials', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, showToast]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedItem(null);
    setFormData({
      clientName: '',
      clientPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80',
      position: 'VP of Product',
      company: '',
      review: '',
      rating: 5,
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: Testimonial) => {
    setModalMode('edit');
    setSelectedItem(t);
    setFormData({
      clientName: t.clientName,
      clientPhoto: t.clientPhoto,
      position: t.position,
      company: t.company,
      review: t.review,
      rating: t.rating,
      status: t.status
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const res = await api.createTestimonial(formData);
        showToast(res.message, 'success');
      } else if (selectedItem) {
        const res = await api.updateTestimonial(selectedItem.id, formData);
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchTestimonials();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Save failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async (item: Testimonial) => {
    try {
      const nextStatus = item.status === 'active' ? 'inactive' : 'active';
      await api.updateTestimonial(item.id, { status: nextStatus });
      showToast(`Testimonial status set to ${nextStatus}`, 'info');
      fetchTestimonials();
    } catch {
      showToast('Status update failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteTestimonial(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchTestimonials();
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
          <h2 className="text-lg font-bold text-white tracking-tight">Client Testimonials & Reviews</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage executive client reviews and ratings displayed across the website social proof section
          </p>
        </div>

        {canCreate && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Testimonial</span>
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
            placeholder="Search by client name, company, or review content…"
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

      {/* Testimonials Grid Cards */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : testimonials.length === 0 ? (
        <EmptyState
          title="No testimonials found"
          description="Add positive feedback from satisfied clients to elevate your brand reputation."
          action={canCreate ? { label: 'Add Testimonial', onClick: handleOpenCreate } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map(t => (
            <div
              key={t.id}
              className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 shadow-xs flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  {/* Rating Stars */}
                  <div className="flex items-center gap-1 text-amber-400">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3.5 h-3.5 ${
                          i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                        }`}
                      />
                    ))}
                    <span className="text-[11px] font-mono text-slate-400 ml-1 tabular-nums">
                      {t.rating}.0
                    </span>
                  </div>

                  {/* Status Toggle */}
                  {canEdit ? (
                    <button
                      onClick={() => handleToggleStatus(t)}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium cursor-pointer ${
                        t.status === 'active' ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      {t.status === 'active' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> Inactive
                        </>
                      )}
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 capitalize">{t.status}</span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic mb-4">
                  &ldquo;{t.review}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <div className="flex items-center gap-3">
                  <img
                    src={t.clientPhoto}
                    alt={t.clientName}
                    className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">{t.clientName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <span>{t.position}</span>
                      <span>·</span>
                      <span className="text-slate-300">{t.company}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                      title="Edit Testimonial"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => setDeleteId(t.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                      title="Delete Testimonial"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Add Client Testimonial' : `Edit: ${selectedItem?.clientName}`}
        maxWidth="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Client Full Name *</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={e => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="e.g. David Miller"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Company / Organization *</label>
              <input
                type="text"
                value={formData.company}
                onChange={e => setFormData({ ...formData, company: e.target.value })}
                placeholder="e.g. OmniPay Financial"
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Position / Designation</label>
              <input
                type="text"
                value={formData.position}
                onChange={e => setFormData({ ...formData, position: e.target.value })}
                placeholder="e.g. Chief Technology Officer"
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Star Rating (1 - 5)</label>
              <select
                value={formData.rating}
                onChange={e => setFormData({ ...formData, rating: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                <option value={3}>⭐⭐⭐ (3 Stars)</option>
              </select>
            </div>
          </div>

          {/* Client Photo (URL or Local PC Upload) */}
          <ImageUploadOrUrl
            label="Client Avatar / Photo"
            value={formData.clientPhoto}
            onChange={(url) => setFormData({ ...formData, clientPhoto: url })}
            aspectRatio="square"
            presets={[
              { label: 'Executive Male', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&h=200&q=80' },
              { label: 'Executive Female', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&h=200&q=80' },
              { label: 'Tech Lead', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&h=200&q=80' }
            ]}
          />

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Client Review Text *</label>
            <textarea
              rows={4}
              value={formData.review}
              onChange={e => setFormData({ ...formData, review: e.target.value })}
              placeholder="Describe the client outcome, engineering caliber, and results achieved with Regards Tech..."
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            >
              <option value="active">Active (Visible on public website)</option>
              <option value="inactive">Inactive (Archived)</option>
            </select>
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
              <span>{modalMode === 'create' ? 'Add Review' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Testimonial?"
        message="Are you sure you want to remove this client testimonial from your website?"
        confirmLabel="Delete Testimonial"
        isLoading={isDeleting}
      />
    </div>
  );
};
