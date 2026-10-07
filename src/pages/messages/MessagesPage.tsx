import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Trash2,
  Reply,
  Send,
  Eye,
  Loader2,
  Inbox
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { ContactMessage } from '../../types/index.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useToast } from '../../context/ToastContext.tsx';
import { Modal } from '../../components/common/Modal.tsx';
import { ConfirmDialog } from '../../components/common/ConfirmDialog.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';

export const MessagesPage: React.FC = () => {
  const { hasPermission } = useAuth();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSendingReply, setIsSendingReply] = useState(false);

  // Delete
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canMarkRead = hasPermission('messages', 'markRead');
  const canDelete = hasPermission('messages', 'delete');

  const fetchMessages = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getMessages({
        search,
        status: status !== 'all' ? status : undefined,
        page,
        limit: 8
      });
      if (res.success) {
        setMessages(res.messages);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setUnreadCount(res.unreadCount);
      }
    } catch {
      showToast('Failed to load contact messages', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, status, page, showToast]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleOpenDetail = (m: ContactMessage) => {
    setSelectedMessage(m);
    setReplyText(m.replyNote || '');

    // If unread, mark as read
    if (m.status === 'unread' && canMarkRead) {
      api.updateMessageStatus(m.id, 'read').then(() => {
        setMessages(prev => prev.map(item => item.id === m.id ? { ...item, status: 'read' } : item));
        setUnreadCount(prev => Math.max(0, prev - 1));
      });
    }
  };

  const handleToggleRead = async (m: ContactMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextStatus = m.status === 'unread' ? 'read' : 'unread';
    try {
      await api.updateMessageStatus(m.id, nextStatus);
      showToast(`Marked as ${nextStatus}`, 'info');
      fetchMessages();
    } catch {
      showToast('Failed to update status', 'error');
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage || !replyText.trim()) return;

    setIsSendingReply(true);
    try {
      const res = await api.replyMessage(selectedMessage.id, replyText);
      showToast(res.message, res.delivered ? 'success' : 'info');
      setSelectedMessage(res.contactMessage);
      setReplyText('');
      fetchMessages();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Reply failed', 'error');
    } finally {
      setIsSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      const res = await api.deleteMessage(deleteId);
      showToast(res.message, 'success');
      setDeleteId(null);
      if (selectedMessage?.id === deleteId) {
        setSelectedMessage(null);
      }
      fetchMessages();
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
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white tracking-tight">Website Contact Inquiries</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold tabular-nums">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Incoming prospective client inquiries received directly from the Regards Tech Next.js website form
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-900/60 border border-slate-800 rounded-xl">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search inquiries by sender name, email, subject, or message body…"
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <select
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">All Inquiries</option>
          <option value="unread">Unread Only</option>
          <option value="read">Read Only</option>
          <option value="replied">Replied Only</option>
        </select>
      </div>

      {/* Messages Table */}
      {isLoading ? (
        <TableSkeleton rows={5} cols={5} />
      ) : messages.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-6 h-6" />}
          title="No contact messages"
          description="Inquiries submitted via the Regards Tech website contact form will appear here in real time."
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-10">Status</th>
                  <th className="py-3.5 px-4">Sender</th>
                  <th className="py-3.5 px-4">Subject & Excerpt</th>
                  <th className="py-3.5 px-4">Received</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {messages.map(m => (
                  <tr
                    key={m.id}
                    onClick={() => handleOpenDetail(m)}
                    className={`cursor-pointer transition-colors ${
                      m.status === 'unread' ? 'bg-indigo-950/20 font-medium' : 'hover:bg-slate-800/30'
                    }`}
                  >
                    {/* Status indicator dot */}
                    <td className="py-3.5 px-4">
                      {m.status === 'unread' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" title="Unread inquiry" />
                      )}
                      {m.status === 'read' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-600 block" title="Read" />
                      )}
                      {m.status === 'replied' && (
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" title="Replied" />
                      )}
                    </td>

                    {/* Sender details */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{m.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500" />
                        <span>{m.email}</span>
                      </div>
                      {m.phone && (
                        <div className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Phone className="w-2.5 h-2.5" />
                          <span>{m.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Subject + Excerpt */}
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="text-white truncate font-medium">{m.subject}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{m.message}</div>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-400 text-[11px] font-mono">
                      {new Date(m.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        {canMarkRead && (
                          <button
                            onClick={e => handleToggleRead(m, e)}
                            className="p-1.5 text-slate-400 hover:text-indigo-400 rounded-md hover:bg-slate-800 transition-colors"
                            title={m.status === 'unread' ? 'Mark as Read' : 'Mark as Unread'}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDetail(m)}
                          className="p-1.5 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors"
                          title="View Message"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {canDelete && (
                          <button
                            onClick={() => setDeleteId(m.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-md hover:bg-slate-800 transition-colors"
                            title="Delete Message"
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
            itemName="messages"
          />
        </div>
      )}

      {/* Message Detail & Reply Modal */}
      {selectedMessage && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedMessage(null)}
          title={`Inquiry from ${selectedMessage.name}`}
          subtitle={`Received on ${new Date(selectedMessage.createdAt).toLocaleString()}`}
          maxWidth="2xl"
        >
          <div className="space-y-4 text-xs">
            {/* Sender card */}
            <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Email Address</span>
                <a
                  href={`mailto:${selectedMessage.email}`}
                  className="text-indigo-400 hover:underline font-mono text-xs flex items-center gap-1 mt-0.5"
                >
                  <Mail className="w-3 h-3" /> {selectedMessage.email}
                </a>
              </div>

              <div>
                <span className="text-slate-500 block text-[10px] uppercase tracking-wider">Phone Contact</span>
                <span className="text-slate-300 font-mono text-xs flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-500" />
                  {selectedMessage.phone || 'Not provided'}
                </span>
              </div>
            </div>

            {/* Subject & Full Message */}
            <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2">
              <div className="font-semibold text-white text-sm">{selectedMessage.subject}</div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-wrap pt-2 border-t border-slate-800/80">
                {selectedMessage.message}
              </div>
            </div>

            {/* Previous reply note if already answered */}
            {selectedMessage.replyNote && (
              <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-800/40 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-emerald-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Email Reply Dispatched to {selectedMessage.email}
                  </span>
                  {selectedMessage.repliedAt && (
                    <span className="text-slate-400 font-normal">
                      {new Date(selectedMessage.repliedAt).toLocaleString()}
                    </span>
                  )}
                </div>
                <div className="text-slate-200 whitespace-pre-wrap pl-5 text-xs bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  {selectedMessage.replyNote}
                </div>
              </div>
            )}

            {/* Email Reply Composer */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">
                    {selectedMessage.replyNote ? 'Send Another Reply / Follow-up Email' : `Email Reply to ${selectedMessage.name}`}
                  </label>
                  <span className="text-[11px] text-indigo-400 font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Dispatched to {selectedMessage.email}
                  </span>
                </div>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder={`Write your response to ${selectedMessage.name}. This will be sent as a professional branded email to ${selectedMessage.email}...`}
                  required
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-400">
                  <span className="text-slate-500">Sender will receive your reply with Regards Tech header & footer.</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMessage(null)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white bg-slate-800"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingReply}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 flex items-center gap-1.5 transition-colors"
                  >
                    {isSendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Send Email Reply</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Delete Contact Inquiry?"
        message="Are you sure you want to permanently delete this message record?"
        confirmLabel="Delete Message"
        isLoading={isDeleting}
      />
    </div>
  );
};
