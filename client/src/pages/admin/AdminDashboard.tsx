import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api.js';
import { AuthAuditLog, AdminAuditLog } from '../../types/index.js';
import {
  Users,
  UserCheck,
  ShieldAlert,
  Clock,
  TrendingUp,
  Download,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowUpRight
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [registrationTrend, setRegistrationTrend] = useState<{ date: string; count: number }[]>([]);
  const [recentSuccess, setRecentSuccess] = useState<AuthAuditLog[]>([]);
  const [recentFailed, setRecentFailed] = useState<AuthAuditLog[]>([]);
  const [adminActions, setAdminActions] = useState<AdminAuditLog[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      const data = await api.getAdminOverview();
      setMetrics(data.metrics);
      setRegistrationTrend(data.registrationTrend);
      setRecentSuccess(data.recentSuccessfulLogins);
      setRecentFailed(data.recentFailedLogins);
      setAdminActions(data.latestAdminActions);
    } catch (err: any) {
      setError(err.message || 'Failed to load administrative overview.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleExportCsv = async () => {
    try {
      await api.downloadUsersCsv();
    } catch (err: any) {
      alert(err.message || 'Failed to download user export.');
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Gathering administrative telemetry...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            System Administration Overview
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Real-time telemetry, user account metrics, and security authentication logs
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl shadow-2xs transition-colors"
          >
            <Download className="w-4 h-4 text-gray-500" />
            <span>Export Users (CSV)</span>
          </button>
          <Link
            to="/admin/users"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors"
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs">
          {error}
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Total Registered Users</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics?.totalUsers || 0}</p>
          <div className="mt-2 flex items-center text-[11px] text-gray-500 space-x-2">
            <span>{metrics?.totalStudents || 0} students</span>
            <span>•</span>
            <span>{metrics?.totalAdmins || 0} admins</span>
          </div>
        </div>

        {/* Active Users (Last 7 Days) */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Active (Last 7 Days)</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics?.activeInLast7Days || 0}</p>
          <p className="text-[11px] text-gray-500 mt-2">
            Users logged in recently
          </p>
        </div>

        {/* Active Accounts */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Account Health</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-gray-700" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics?.activeAccounts || 0}</p>
          <p className="text-[11px] text-gray-500 mt-2">
            {metrics?.disabledAccounts || 0} disabled account(s)
          </p>
        </div>

        {/* Total Logins Recorded */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Auth Events Recorded</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{metrics?.totalLoginsRecorded || 0}</p>
          <p className="text-[11px] text-gray-500 mt-2">
            Logged in audit records
          </p>
        </div>
      </div>

      {/* Registration Growth Trend Chart */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-gray-900">New Student Registrations (Last 7 Days)</h3>
            <p className="text-xs text-gray-500">Daily breakdown of student account creation</p>
          </div>
          <TrendingUp className="w-4 h-4 text-orange-500" />
        </div>

        <div className="grid grid-cols-7 gap-2 pt-4 border-t border-gray-100">
          {registrationTrend.map((item, idx) => {
            const maxVal = Math.max(1, ...registrationTrend.map(r => r.count));
            const barHeightPercent = Math.min(100, Math.max(15, Math.round((item.count / maxVal) * 100)));
            const dateObj = new Date(item.date);
            const dayLabel = dateObj.toLocaleDateString('en-US', { weekday: 'short' });

            return (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-[11px] font-bold text-gray-700 mb-1">{item.count}</span>
                <div className="w-full h-28 bg-gray-50 rounded-xl flex items-end p-1 border border-gray-100">
                  <div
                    style={{ height: `${barHeightPercent}%` }}
                    className="w-full bg-orange-500 hover:bg-orange-600 rounded-lg transition-all duration-300"
                  ></div>
                </div>
                <span className="text-[10px] font-medium text-gray-500 mt-2">{dayLabel}</span>
                <span className="text-[9px] text-gray-400">{item.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Login Activity & Security Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Successful Logins */}
        <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-orange-500" />
              <h3 className="text-sm font-bold text-gray-900">Recent Successful Logins</h3>
            </div>
            <Link to="/admin/logs" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1">
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentSuccess.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No successful logins recorded yet</p>
            ) : (
              recentSuccess.slice(0, 5).map(log => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{log.email}</p>
                    <p className="text-[11px] text-gray-400">{log.description}</p>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Failed Logins */}
        <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-orange-600" />
              <h3 className="text-sm font-bold text-gray-900">Failed Login Attempts</h3>
            </div>
            <Link to="/admin/logs?status=failure" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1">
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-gray-100">
            {recentFailed.length === 0 ? (
              <div className="py-6 text-center text-gray-400 text-xs">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-gray-300" />
                <p>No recent failed login attempts</p>
              </div>
            ) : (
              recentFailed.slice(0, 5).map(log => (
                <div key={log.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-gray-900">{log.email}</p>
                    <p className="text-[11px] text-orange-700 font-medium">{log.description}</p>
                  </div>
                  <span className="text-[11px] text-gray-500">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Latest Administrative Activity */}
      <div className="p-6 rounded-2xl border border-gray-200 bg-white shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-gray-900" />
            <h3 className="text-sm font-bold text-gray-900">Administrative Actions Log</h3>
          </div>
          <Link to="/admin/logs?type=admin" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1">
            <span>View all admin logs</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-gray-100">
          {adminActions.length === 0 ? (
            <p className="text-xs text-gray-400 py-6 text-center">No administrative changes recorded yet</p>
          ) : (
            adminActions.map(action => (
              <div key={action.id} className="py-3 flex items-start justify-between text-xs">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-gray-900">{action.adminEmail}</span>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-gray-100 text-gray-700 border border-gray-200">
                      {action.action}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-1">{action.details}</p>
                </div>
                <span className="text-[11px] text-gray-400 shrink-0">
                  {new Date(action.timestamp).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
