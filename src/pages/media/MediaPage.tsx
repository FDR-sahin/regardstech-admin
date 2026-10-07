import React, { useState, useEffect, useCallback } from 'react';
import {
  Upload,
  Search,
  Copy,
  Trash2,
  Check,
  ImageIcon,
  Plus,
  Loader2
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { MediaItem } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';

export const MediaPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [media, setMedia] = useState<MediaItem[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'url' | 'file'>('url');
  const [fileName, setFileName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canUpload = hasPermission('media', 'upload');
  const canDelete = hasPermission('media', 'delete');

  const fetchMedia = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getMedia(search);
      if (res.success) {
        setMedia(res.media);
      }
    } catch {
      showToast('Failed to load media assets', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, showToast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showToast('Image URL copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFileUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileName || !fileUrl) {
      showToast('File name and image source are required', 'error');
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.uploadMedia({
        fileName,
        fileUrl,
        fileType: 'image/jpeg',
        fileSize: 125000
      });
      showToast(res.message, 'success');
      setIsModalOpen(false);
      setFileName('');
      setFileUrl('');
      fetchMedia();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteMedia(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchMedia();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Media & Asset Library</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Store, preview, and copy image assets for use across projects, services, and blogs
          </p>
        </div>

        {canUpload && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Image Asset</span>
          </button>
        )}
      </div>

      {/* Search */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search media by file name…"
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video bg-slate-900 rounded-xl border border-slate-800" />
          ))}
        </div>
      ) : media.length === 0 ? (
        <EmptyState
          icon={<ImageIcon className="w-6 h-6" />}
          title="No media assets"
          description="Upload images or add image URLs to build your asset library."
          action={canUpload ? { label: 'Upload Asset', onClick: () => setIsModalOpen(true) } : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map(item => (
            <div
              key={item.id}
              className="group bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs hover:border-slate-700 transition-colors flex flex-col justify-between"
            >
              <div className="relative aspect-video bg-slate-950 overflow-hidden">
                <img
                  src={item.fileUrl}
                  alt={item.fileName}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <button
                  onClick={() => handleCopy(item.fileUrl, item.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-md bg-slate-950/80 text-white backdrop-blur-xs hover:bg-indigo-600 transition-colors"
                  title="Copy Image URL"
                >
                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="p-3">
                <div className="font-semibold text-white text-xs truncate" title={item.fileName}>
                  {item.fileName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                  <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    onClick={() => handleCopy(item.fileUrl, item.id)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === item.id ? 'Copied!' : 'Copy URL'}</span>
                  </button>

                  {canDelete && (
                    <button
                      onClick={() => setDeleteId(item.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete asset"
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

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Image Asset"
        subtitle="Add images to your content library"
        maxWidth="md"
      >
        <form onSubmit={handleSubmitUpload} className="space-y-4">
          <div className="flex items-center gap-2 p-1 bg-slate-950 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setUploadType('url')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                uploadType === 'url' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Direct Image URL
            </button>
            <button
              type="button"
              onClick={() => setUploadType('file')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-colors ${
                uploadType === 'file' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Upload Local File
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Asset Label / File Name *</label>
            <input
              type="text"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder="e.g. hero-dashboard-preview.png"
              required
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
            />
          </div>

          {uploadType === 'url' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">External Image URL *</label>
              <input
                type="text"
                value={fileUrl}
                onChange={e => setFileUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                required
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Choose Image File *</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500"
              />
            </div>
          )}

          {/* Preview */}
          {fileUrl && (
            <div className="aspect-video bg-slate-950 rounded-lg border border-slate-800 overflow-hidden">
              <img src={fileUrl} alt="Preview" className="w-full h-full object-cover" />
            </div>
          )}

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
              disabled={isUploading || !fileUrl}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5"
            >
              {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Save to Library</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Image Asset?"
        message="Are you sure you want to remove this image from the media gallery?"
        confirmLabel="Delete Asset"
        isLoading={isDeleting}
      />
    </div>
  );
};
