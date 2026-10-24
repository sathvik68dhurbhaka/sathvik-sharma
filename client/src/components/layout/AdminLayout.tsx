import React from 'react';
import { Outlet, Navigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { AdminSidebar } from './AdminSidebar.js';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';

export const AdminLayout: React.FC = () => {
  const { user, isAuthenticated, isAdmin, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-gray-500 font-medium">Verifying administrator authorization...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="max-w-md w-full p-8 rounded-2xl border border-gray-200 text-center shadow-card">
          <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Access Restricted</h2>
          <p className="text-xs text-gray-600 mt-2">
            Your authenticated account ({user?.email}) does not hold administrator privileges.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/dashboard"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
            >
              Return to Student Dashboard
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Top Admin Bar */}
      <header className="h-16 bg-white border-b border-gray-200 sticky top-0 z-30 flex items-center justify-between px-6">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-gray-900 tracking-tight">AI Study Manager</span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-50 text-orange-600 rounded-full border border-orange-200 uppercase tracking-wider">
                Admin Control Panel
              </span>
            </div>
            <p className="text-[11px] text-gray-500 hidden sm:block">
              Secure auditing, user governance, and system telemetry
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="text-xs text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-gray-400" />
            <span className="hidden sm:inline">Student View</span>
          </Link>
          <div className="h-4 w-px bg-gray-200"></div>
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-full bg-orange-100 text-orange-700 font-bold text-xs flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-900 hidden md:inline">{user?.name}</span>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        <AdminSidebar />
        <main className="flex-1 bg-white p-6 md:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
