import React, { useState, useEffect, useCallback } from 'react';
import { Search, History, CheckCircle2, AlertTriangle, ShieldCheck, Filter } from 'lucide-react';
import { api } from '../../services/api.ts';
import { AuditLog } from '../../types/index.ts';
import { useToast } from '../../context/ToastContext.tsx';
import { Pagination } from '../../components/common/Pagination.tsx';
import { TableSkeleton } from '../../components/common/LoadingSkeleton.tsx';
import { EmptyState } from '../../components/common/EmptyState.tsx';

export const AuditLogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [modules, setModules] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedModule, setSelectedModule] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.getAuditLogs({
        search,
        module: selectedModule !== 'all' ? selectedModule : undefined,
        status: selectedStatus !== 'all' ? selectedStatus : undefined,
        page,
        limit: 15
      });
      if (res.success) {
        setLogs(res.logs);
        setTotal(res.pagination.total);
        setTotalPages(res.pagination.totalPages);
        setModules(res.modules);
      }
    } catch {
      showToast('Failed to load audit logs', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [search, selectedModule, selectedStatus, page, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">System Security & Audit Trail</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Immutable audit record of all administrative operations, authentication events, and data mutations
        </p>
      </div>

      {/* Filter and Search */}
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
            placeholder="Search action, admin email, IP, or details…"
            className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-white placeholder:text-slate-500 focus:outline-hidden focus:border-indigo-500"
          />
        </div>

        <select
          value={selectedModule}
          onChange={e => {
            setSelectedModule(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">All Modules</option>
          {modules.map(m => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={e => {
            setSelectedStatus(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-hidden focus:border-indigo-500"
        >
          <option value="all">All Statuses</option>
          <option value="success">Success Only</option>
          <option value="failure">Failure / Blocked</option>
        </select>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <TableSkeleton rows={8} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={<History className="w-6 h-6" />}
          title="No audit logs found"
          description="Activity events will populate here as administrators perform operations."
        />
      ) : (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {logs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {new Date(log.timestamp).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold text-white font-sans">{log.action}</span>
                    </td>

                    {/* Module */}
                    <td className="py-3 px-4 whitespace-nowrap text-indigo-400 font-sans">
                      {log.module}
                    </td>

                    {/* Administrator */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-300 font-sans">
                      <div>{log.adminName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{log.adminEmail}</div>
                    </td>

                    {/* Details */}
                    <td className="py-3 px-4 font-sans text-slate-400 max-w-sm truncate" title={log.details}>
                      {log.details}
                      {log.recordId && <span className="text-[10px] text-slate-500 ml-1 font-mono">[{log.recordId}]</span>}
                    </td>

                    {/* IP */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400">
                      {log.ip || '127.0.0.1'}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap text-right font-sans">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> success
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400">
                          <AlertTriangle className="w-3 h-3" /> failure
                        </span>
                      )}
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
            limit={15}
            onPageChange={setPage}
            itemName="audit records"
          />
        </div>
      )}
    </div>
  );
};
