import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { User } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  Users,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  UserX,
  UserCheck,
  Eye,
  AlertCircle,
  X,
  CheckCircle2
} from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Modals
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [userDetailStats, setUserDetailStats] = useState<any>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Confirmation state for role/status changes
  const [confirmAction, setConfirmAction] = useState<{
    type: 'role' | 'status';
    targetUser: User;
    newValue: string;
  } | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAdminUsers({
        search: searchTerm || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
        page,
        limit: 10
      });
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
      setTotalUsers(data.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch registered users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, selectedRole, selectedStatus, page]);

  const handleOpenDetail = async (user: User) => {
    setSelectedUserForDetail(user);
    setLoadingDetail(true);
    try {
      const data = await api.getAdminUserDetails(user.id);
      setUserDetailStats(data.stats);
    } catch (_) {
    } finally {
      setLoadingDetail(false);
    }
  };

  const executeConfirmAction = async () => {
    if (!confirmAction) return;
    try {
      if (confirmAction.type === 'status') {
        await api.updateUserStatus(confirmAction.targetUser.id, confirmAction.newValue as 'active' | 'disabled');
      } else {
        await api.updateUserRole(confirmAction.targetUser.id, confirmAction.newValue as 'student' | 'admin');
      }
      setConfirmAction(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Action failed.');
    }
  };

  const handleExportCsv = async () => {
    try {
      await api.downloadUsersCsv();
    } catch (err: any) {
      alert(err.message || 'Failed to download user export.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Registered Users Management
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Browse, search, audit, and administer student and administrator accounts ({totalUsers} total)
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl shadow-2xs transition-colors self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-gray-500" />
          <span>Export All to CSV</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 text-xs">
          {error}
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Search by student name or email..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 placeholder-gray-400"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Role Filter */}
          <select
            value={selectedRole}
            onChange={(e) => {
              setSelectedRole(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 bg-white border border-gray-300 rounded-xl text-gray-700 focus:border-orange-500"
          >
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="admin">Administrator</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="text-xs py-2 px-3 bg-white border border-gray-300 rounded-xl text-gray-700 focus:border-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <span>Loading registered users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-400">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>No users match the search criteria.</span>
                  </td>
                </tr>
              ) : (
                users.map((u) => {
                  const isCurrent = u.id === currentAdmin?.id;

                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{u.name}</p>
                            <p className="text-[11px] text-gray-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                            u.role === 'admin'
                              ? 'bg-gray-100 text-gray-800 border-gray-300'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            u.status === 'active'
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              u.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          ></span>
                          <span className="capitalize">{u.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-gray-500">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : 'Never'}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenDetail(u)}
                            className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Academic Statistics"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Toggle Status (Active / Disabled) */}
                          {!isCurrent && (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'status',
                                  targetUser: u,
                                  newValue: u.status === 'active' ? 'disabled' : 'active'
                                })
                              }
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.status === 'active'
                                  ? 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={u.status === 'active' ? 'Disable Account' : 'Reactivate Account'}
                            >
                              {u.status === 'active' ? (
                                <UserX className="w-4 h-4" />
                              ) : (
                                <UserCheck className="w-4 h-4" />
                              )}
                            </button>
                          )}

                          {/* Toggle Role (Student / Admin) */}
                          {!isCurrent && (
                            <button
                              onClick={() =>
                                setConfirmAction({
                                  type: 'role',
                                  targetUser: u,
                                  newValue: u.role === 'admin' ? 'student' : 'admin'
                                })
                              }
                              className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                              title={
                                u.role === 'admin'
                                  ? 'Demote to Student'
                                  : 'Promote to Administrator'
                              }
                            >
                              {u.role === 'admin' ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>
            Page {page} of {totalPages} ({totalUsers} total registered users)
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

      {/* User Detail Modal */}
      {selectedUserForDetail && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setSelectedUserForDetail(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 font-bold text-lg flex items-center justify-center">
                {selectedUserForDetail.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedUserForDetail.name}</h3>
                <p className="text-xs text-gray-500">{selectedUserForDetail.email}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
                    {selectedUserForDetail.role}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    ID: {selectedUserForDetail.id.slice(0, 8)}...
                  </span>
                </div>
              </div>
            </div>

            {loadingDetail ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <span>Fetching academic telemetry...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Subjects</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {userDetailStats?.subjectsCount || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Sessions</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {userDetailStats?.completedSessions || 0} / {userDetailStats?.totalSessions || 0}
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-center">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">Assignments</span>
                    <p className="text-lg font-bold text-gray-900 mt-1">
                      {userDetailStats?.completedAssignments || 0} / {userDetailStats?.totalAssignments || 0}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Weekly Target:</span>
                    <span className="font-semibold text-gray-900">{selectedUserForDetail.weeklyGoalHours || 15} hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Created:</span>
                    <span className="font-semibold text-gray-900">{new Date(selectedUserForDetail.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Last Successful Login:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedUserForDetail.lastLoginAt ? new Date(selectedUserForDetail.lastLoginAt).toLocaleString() : 'Never logged in'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Account Status:</span>
                    <span className="font-semibold capitalize text-gray-900">{selectedUserForDetail.status}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUserForDetail(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto mb-3">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-gray-900">Confirm Administrative Action</h3>
            <p className="text-xs text-gray-600 mt-2">
              Are you sure you want to change the {confirmAction.type} of{' '}
              <span className="font-bold text-gray-900">{confirmAction.targetUser.email}</span> to{' '}
              <span className="font-bold uppercase text-orange-600">{confirmAction.newValue}</span>?
            </p>
            <p className="text-[11px] text-gray-400 mt-1">This action will be audited.</p>

            <div className="mt-6 flex items-center space-x-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeConfirmAction}
                className="flex-1 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
