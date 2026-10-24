import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import {
  ShieldAlert,
  Users,
  ScrollText,
  LayoutDashboard,
  LogOut,
  ArrowLeft
} from 'lucide-react';

const adminNavItems = [
  { to: '/admin/dashboard', label: 'Admin Overview', icon: LayoutDashboard },
  { to: '/admin/users', label: 'Registered Users', icon: Users },
  { to: '/admin/logs', label: 'Auth & Audit Logs', icon: ScrollText },
];

export const AdminSidebar: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4">
      <div>
        <div className="px-3 mb-4 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-orange-500" />
          <p className="text-[11px] font-bold tracking-wider uppercase text-gray-500">
            System Administration
          </p>
        </div>

        <nav className="space-y-1.5">
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-orange-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="space-y-2 pt-6 border-t border-gray-200">
        <NavLink
          to="/dashboard"
          className="flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-gray-400" />
          <span>Exit to Student Workspace</span>
        </NavLink>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-2.5 px-3.5 py-2 text-xs font-semibold text-gray-600 hover:text-red-600 hover:bg-gray-50 rounded-xl transition-colors text-left"
        >
          <LogOut className="w-4 h-4 text-gray-400" />
          <span>Sign Out of Admin</span>
        </button>
      </div>
    </aside>
  );
};
