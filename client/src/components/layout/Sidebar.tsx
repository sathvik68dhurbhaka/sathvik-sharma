import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Bot,
  Target,
  BarChart3,
  Settings,
  Sparkles
} from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/planner', label: 'Timetable & Planner', icon: CalendarDays },
  { to: '/assignments', label: 'Assignments', icon: ClipboardList },
  { to: '/predictions', label: 'AI Grade Predictor', icon: Sparkles, badge: 'AI' },
  { to: '/reminders', label: 'Reminders & Goals', icon: Target },
  { to: '/analytics', label: 'Study Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-4rem)] flex flex-col justify-between py-6 px-4">
      <div>
        <div className="px-3 mb-4">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-gray-400">
            Academic Workspace
          </p>
        </div>

        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-orange-50 text-orange-600 font-semibold border-l-4 border-orange-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="px-1.5 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-md">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* AI Predictor Quick Access Card */}
      <div className="mt-6 p-4 rounded-2xl bg-orange-50/60 border border-orange-200 text-center">
        <div className="w-8 h-8 mx-auto mb-2 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-sm">
          <Sparkles className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-gray-900">Exam Success Predictor</p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          See your forecasted grades & success probabilities.
        </p>
        <NavLink
          to="/predictions"
          className="mt-3 block w-full py-1.5 px-3 bg-white text-orange-600 hover:bg-orange-50 border border-orange-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
        >
          View Predictions
        </NavLink>
      </div>
    </aside>
  );
};
