import React, { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  Lock,
  Mail,
  User,
  KeyRound,
  Clock,
  Loader2,
  Copy,
  Check,
  Link
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { AdminUser, AdminPermissions } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';

const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  dashboard: { view: true },
  projects: { view: true, create: true, edit: true, delete: false },
  services: { view: true, create: false, edit: false, delete: false },
  blogs: { view: true, create: true, edit: true, delete: false, publish: false },
  testimonials: { view: true, create: false, edit: false, delete: false },
  messages: { view: true, markRead: true, delete: false },
  admins: { view: false, create: false, edit: false, delete: false },
  media: { view: true, upload: true, delete: false },
  auditLogs: { view: false }
};

export const AdminsPage: React.FC = () => {
  const { admin: currentAdmin, isSuperAdmin } = useAuth();
  const { showToast } = useToast();

  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [selectedAdmin, setSelectedAdmin] = useState<AdminUser | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin' as 'admin' | 'super_admin',
    sendVerificationEmail: true,
    isActive: true,
    permissions: { ...DEFAULT_ADMIN_PERMISSIONS }
  });

  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdmins();
      if (res.success) {
        setAdmins(res.admins);
      }
    } catch {
      showToast('Failed to load administrators', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setSelectedAdmin(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      sendVerificationEmail: false,
      isActive: true,
      permissions: JSON.parse(JSON.stringify(DEFAULT_ADMIN_PERMISSIONS))
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (a: AdminUser) => {
    setModalMode('edit');
    setSelectedAdmin(a);
    setFormData({
      name: a.name,
      email: a.email,
      password: '',
      role: a.role,
      sendVerificationEmail: false,
      isActive: a.isActive,
      permissions: JSON.parse(JSON.stringify(a.permissions))
    });
    setIsModalOpen(true);
  };

  const handleTogglePermission = (module: keyof AdminPermissions, action: string) => {
    setFormData(prev => {
      const currentMod = { ...prev.permissions[module] } as Record<string, boolean>;
      currentMod[action] = !currentMod[action];
      return {
        ...prev,
        permissions: {
          ...prev.permissions,
          [module]: currentMod
        }
      };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (modalMode === 'create') {
        const res = await api.createAdmin(formData);
        showToast(res.message, 'success');
      } else if (selectedAdmin) {
        const res = await api.updateAdmin(selectedAdmin.id, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          permissions: formData.permissions
        });
        showToast(res.message, 'success');
      }
      setIsModalOpen(false);
      fetchAdmins();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Operation failed', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (adminUser: AdminUser) => {
    try {
      const nextActive = !adminUser.isActive;
      await api.updateAdmin(adminUser.id, { isActive: nextActive });
      showToast(`Admin account ${nextActive ? 'activated' : 'deactivated'}`, 'info');
      fetchAdmins();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteAdmin(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      fetchAdmins();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Delete failed', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResendVerification = async (adminUser: AdminUser) => {
    setResendingId(adminUser.id);
    try {
      const res = await api.resendAdminVerification(adminUser.id);
      showToast(res.message, 'success');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to send verification email', 'error');
    } finally {
      setResendingId(null);
    }
  };

  const handleDirectVerify = async (adminUser: AdminUser) => {
    setVerifyingId(adminUser.id);
    try {
      const res = await api.verifyAdminDirectly(adminUser.id);
      showToast(res.message, 'success');
      fetchAdmins();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Failed to verify account', 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleCopyVerificationLink = (adminUser: AdminUser) => {
    const origin = window.location.origin;
    const link = `${origin}/api/auth/verify-link?token=${adminUser.verificationToken || ''}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedId(adminUser.id);
      showToast('1-Click verification link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 3000);
    }).catch(() => {
      showToast('Could not copy link to clipboard', 'error');
    });
  };

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center bg-slate-900/60 border border-slate-800 rounded-xl">
        <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <h3 className="text-base font-semibold text-white">Super Admin Access Required</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          Administrator and granular role permissions can only be managed by the Super Administrator account.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight">Administrators & Access Control</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage administrative credentials, email verification statuses, and role-based action permissions (RBAC)
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create Admin Account</span>
        </button>
      </div>

      {/* Admins Table */}
      {isLoading ? (
        <TableSkeleton rows={4} cols={5} />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Email Verification</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {admins.map(a => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* User name & email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={a.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&h=100&q=80'}
                          alt={a.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                        />
                        <div>
                          <div className="font-semibold text-white flex items-center gap-1.5 flex-wrap">
                            <span>{a.name}</span>
                            {a.email.toLowerCase() === 'sahinfdr89@gmail.com' && (
                              <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded font-semibold inline-flex items-center gap-1">
                                👑 Seed / Owner
                              </span>
                            )}
                            {a.id === currentAdmin?.id && (
                              <span className="text-[10px] text-indigo-400 font-normal">(You)</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">{a.email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {a.role === 'super_admin' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> Super Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-300">
                          <User className="w-3.5 h-3.5 text-slate-500" /> Admin
                        </span>
                      )}
                    </td>

                    {/* Email Verification */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {a.isEmailVerified ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Verified
                        </span>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                            <Clock className="w-3 h-3" /> Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDirectVerify(a)}
                            disabled={verifyingId === a.id}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/30 transition-colors cursor-pointer"
                            title="Directly activate and verify without waiting for an email"
                          >
                            {verifyingId === a.id ? 'Verifying...' : 'Verify Now'}
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Account Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(a)}
                        disabled={a.id === currentAdmin?.id}
                        className={`inline-flex items-center gap-1 text-xs font-medium ${
                          a.isActive ? 'text-emerald-400' : 'text-rose-400'
                        } ${a.id === currentAdmin?.id ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                        title={a.id === currentAdmin?.id ? 'Cannot deactivate self' : 'Toggle status'}
                      >
                        {a.isActive ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> Deactivated
                          </>
                        )}
                      </button>
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-[11px] text-slate-400 font-mono">
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {!a.isEmailVerified && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDirectVerify(a)}
                              disabled={verifyingId === a.id}
                              className="p-1.5 text-emerald-400 hover:text-emerald-300 rounded-md hover:bg-slate-800 transition-colors"
                              title="Directly Activate & Verify Account (Bypasses email)"
                            >
                              {verifyingId === a.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleCopyVerificationLink(a)}
                              className="p-1.5 text-blue-400 hover:text-blue-300 rounded-md hover:bg-slate-800 transition-colors"
                              title="Copy 1-Click Verification Link"
                            >
                              {copiedId === a.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Link className="w-3.5 h-3.5" />
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleResendVerification(a)}
                              disabled={resendingId === a.id}
                              className="p-1.5 text-amber-400 hover:text-amber-300 rounded-md hover:bg-slate-800 transition-colors"
                              title="Resend 1-Click Verification Email to their Gmail"
                            >
                              {resendingId === a.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Mail className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleOpenEdit(a)}
                          className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                          title="Edit Permissions & Role"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {a.id !== currentAdmin?.id && (
                          <button
                            onClick={() => setDeleteId(a.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Delete Admin Account"
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

      {/* Admin Creator / Permission Editor Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'create' ? 'Create Administrator Account' : `Edit Permissions: ${selectedAdmin?.name}`}
        subtitle="Configure module actions and granular access rights"
        maxWidth="2xl"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Full Name *</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Sarah Connor"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address *</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sahinfdr89@gmail.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {modalMode === 'create' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Temporary Initial Password *</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Must meet complexity rules"
                    required={modalMode === 'create'}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Administrator Role</label>
                <select
                  value={formData.role}
                  onChange={e => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500"
                >
                  <option value="admin">Standard Admin (Granular Permissions)</option>
                  <option value="super_admin">Super Admin (Unrestricted Full Access)</option>
                </select>
              </div>
            </div>
          )}

          {modalMode === 'create' && (
            <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2.5">
              <span className="block text-xs font-semibold text-white">Account Activation Method</span>
              <div className="space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="adminActivation"
                    checked={!formData.sendVerificationEmail}
                    onChange={() => setFormData({ ...formData, sendVerificationEmail: false })}
                    className="mt-0.5 text-indigo-600 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-emerald-400">Pre-Verify & Activate Immediately (Recommended)</span>
                    <p className="text-[11px] text-slate-400">The administrator can log in immediately with their credentials without waiting for an email link.</p>
                  </div>
                </label>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="adminActivation"
                    checked={formData.sendVerificationEmail}
                    onChange={() => setFormData({ ...formData, sendVerificationEmail: true })}
                    className="mt-0.5 text-indigo-600 bg-slate-950 border-slate-700"
                  />
                  <div>
                    <span className="text-xs font-medium text-slate-200">Require 1-Click Email Verification</span>
                    <p className="text-[11px] text-slate-400">Sends a 1-click verification email to their Gmail inbox before they can sign in.</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Granular Permissions Matrix */}
          {formData.role === 'admin' ? (
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white">Granular Role Permissions</h4>
                  <p className="text-[11px] text-slate-400">Select permitted operations for this admin</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, permissions: JSON.parse(JSON.stringify(DEFAULT_ADMIN_PERMISSIONS)) })}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Reset to Default
                </button>
              </div>

              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {/* Projects */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-xs font-semibold text-white mb-2">Projects Management</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.projects.view}
                        onChange={() => handleTogglePermission('projects', 'view')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>View</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.projects.create}
                        onChange={() => handleTogglePermission('projects', 'create')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Create</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.projects.edit}
                        onChange={() => handleTogglePermission('projects', 'edit')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Edit</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.projects.delete}
                        onChange={() => handleTogglePermission('projects', 'delete')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Delete</span>
                    </label>
                  </div>
                </div>

                {/* Services */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-xs font-semibold text-white mb-2">Services Management</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.services.view}
                        onChange={() => handleTogglePermission('services', 'view')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>View</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.services.create}
                        onChange={() => handleTogglePermission('services', 'create')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Create</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.services.edit}
                        onChange={() => handleTogglePermission('services', 'edit')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Edit</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.services.delete}
                        onChange={() => handleTogglePermission('services', 'delete')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Delete</span>
                    </label>
                  </div>
                </div>

                {/* Blogs */}
                <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                  <div className="text-xs font-semibold text-white mb-2">Blog CMS</div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs text-slate-300">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.blogs.view}
                        onChange={() => handleTogglePermission('blogs', 'view')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>View</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.blogs.create}
                        onChange={() => handleTogglePermission('blogs', 'create')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Create</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.blogs.edit}
                        onChange={() => handleTogglePermission('blogs', 'edit')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Edit</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.blogs.publish}
                        onChange={() => handleTogglePermission('blogs', 'publish')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Publish</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.permissions.blogs.delete}
                        onChange={() => handleTogglePermission('blogs', 'delete')}
                        className="rounded-sm text-indigo-600"
                      />
                      <span>Delete</span>
                    </label>
                  </div>
                </div>

                {/* Testimonials & Messages */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div className="text-xs font-semibold text-white mb-2">Testimonials</div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.testimonials.view}
                          onChange={() => handleTogglePermission('testimonials', 'view')}
                          className="rounded-sm text-indigo-600"
                        />
                        <span>View</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.testimonials.create}
                          onChange={() => handleTogglePermission('testimonials', 'create')}
                          className="rounded-sm text-indigo-600"
                        />
                        <span>Edit</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
                    <div className="text-xs font-semibold text-white mb-2">Contact Inquiries</div>
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.messages.view}
                          onChange={() => handleTogglePermission('messages', 'view')}
                          className="rounded-sm text-indigo-600"
                        />
                        <span>View</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.messages.markRead}
                          onChange={() => handleTogglePermission('messages', 'markRead')}
                          className="rounded-sm text-indigo-600"
                        />
                        <span>Reply</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-indigo-950/40 rounded-lg border border-indigo-800/60 text-indigo-200 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Super Admin role has complete unrestricted control over all modules and actions.</span>
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
              disabled={isSaving}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg flex items-center gap-1.5"
            >
              {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{modalMode === 'create' ? 'Create Admin Account' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Revoke Admin Access?"
        message="Are you sure you want to delete this administrator account? They will be immediately blocked from signing in."
        confirmLabel="Delete Admin"
        isLoading={isDeleting}
      />
    </div>
  );
};
