import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api.js';
import { AuthAuditLog, AdminAuditLog } from '../../types/index.js';
import {
  ScrollText,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react';

export const AdminLogs: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as 'auth' | 'admin') || 'auth';
  const initialStatus = searchParams.get('status') || '';

  const [activeTab, setActiveTab] = useState<'auth' | 'admin'>(initialType);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [emailFilter, setEmailFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAuditLogs({
        type: activeTab,
        email: emailFilter || undefined,
        eventType: eventTypeFilter || undefined,
        status: statusFilter || undefined,
        page,
        limit: 15
      });
      setLogs(data.logs);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [activeTab, emailFilter, eventTypeFilter, statusFilter, page]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            System Security & Audit Trail
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Immutable records of authentication attempts, administrative updates, and security events
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5 text-gray-500" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-3 border-b border-gray-200 pb-2">
        <button
          onClick={() => {
            setActiveTab('auth');
            setPage(1);
          }}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'auth'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Authentication Events
        </button>
        <button
          onClick={() => {
            setActiveTab('admin');
            setPage(1);
          }}
          className={`pb-2 px-1 text-xs font-semibold border-b-2 transition-colors ${
            activeTab === 'admin'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Administrator Action Audits
        </button>
      </div>

      {/* Filters */}
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center gap-3">
        {activeTab === 'auth' ? (
          <>
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={emailFilter}
                onChange={(e) => {
                  setEmailFilter(e.target.value);
                  setPage(1);
                }}
                placeholder="Filter by account email..."
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
              />
            </div>

            <div className="flex items-center space-x-3 w-full md:w-auto">
              {/* Event Type Filter */}
              <select
                value={eventTypeFilter}
                onChange={(e) => {
                  setEventTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs py-2 px-3 bg-white border border-gray-300 rounded-xl text-gray-700 focus:border-orange-500"
              >
                <option value="">All Event Types</option>
                <option value="login_success">Login Success</option>
                <option value="login_failure">Login Failure</option>
                <option value="register">Registration</option>
                <option value="logout">Logout</option>
                <option value="password_reset_request">Password Reset Request</option>
                <option value="password_reset_success">Password Reset Success</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="text-xs py-2 px-3 bg-white border border-gray-300 rounded-xl text-gray-700 focus:border-orange-500"
              >
                <option value="">All Statuses</option>
                <option value="success">Success</option>
                <option value="failure">Failure</option>
              </select>
            </div>
          </>
        ) : (
          <p className="text-xs text-gray-500">
            Showing administrative mutations, permission grants, user status toggles, and data export operations.
          </p>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs">
          {error}
        </div>
      )}

      {/* Audit Logs Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'auth' ? (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">User / Email</th>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">IP / User Agent</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span>Retrieving auth logs...</span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-gray-400">
                      <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <span>No matching authentication events found.</span>
                    </td>
                  </tr>
                ) : (
                  logs.map((log: AuthAuditLog) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        {log.status === 'success' ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-50 text-green-700 border border-green-200">
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                            <span>Success</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-200">
                            <XCircle className="w-3 h-3 text-red-600" />
                            <span>Failed</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-semibold text-gray-900">{log.email}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-700 rounded border border-gray-200">
                          {log.eventType}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{log.description}</td>
                      <td className="py-3 px-4 text-[11px] text-gray-400 truncate max-w-[140px]">
                        {log.ip || 'Localhost'}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Administrator</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target User</th>
                  <th className="py-3 px-4">Details</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <span>Retrieving admin logs...</span>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-gray-400">
                      <ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <span>No administrative actions recorded yet.</span>
                    </td>
                  </tr>
                ) : (
                  logs.map((action: AdminAuditLog) => (
                    <tr key={action.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-gray-900">{action.adminEmail}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-orange-50 text-orange-700 rounded border border-orange-200">
                          {action.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{action.targetUserEmail || 'N/A'}</td>
                      <td className="py-3 px-4 text-gray-600 max-w-sm truncate">{action.details}</td>
                      <td className="py-3 px-4 text-right text-gray-500 whitespace-nowrap">
                        {new Date(action.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {page} of {totalPages} ({totalCount} entries)
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
