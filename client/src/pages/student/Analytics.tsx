import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { DashboardMetrics } from '../../types/index.js';
import {
  BarChart3,
  Clock,
  TrendingUp,
  Flame,
  Target,
  ClipboardList,
  Calendar,
  Award
} from 'lucide-react';

export const Analytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [charts, setCharts] = useState<any>(null);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.getAnalytics();
      setMetrics(data.metrics);
      setCharts(data.charts);
    } catch (err) {
      console.error('[Analytics] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Computing academic study analytics...</p>
      </div>
    );
  }

  const dailyHours = charts?.dailyStudyHours || [];
  const maxDailyHour = Math.max(1, ...dailyHours.map((d: any) => d.hours));
  const subjectsHours = charts?.studyTimeBySubject || [];
  const totalSubjectHours = subjectsHours.reduce((sum: number, s: any) => sum + s.hours, 0) || 1;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Study Performance & Academic Analytics
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Objective telemetry calculated from actual recorded study sessions and completed deliverables
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Weekly Hours Completed</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {metrics?.totalHoursCompletedThisWeek || 0} <span className="text-sm font-normal text-gray-500">hrs</span>
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              style={{ width: `${metrics?.weeklyProgressPercent || 0}%` }}
              className="bg-orange-500 h-full rounded-full transition-all"
            ></div>
          </div>
          <p className="text-[10px] text-gray-400 mt-1.5 text-right font-medium">
            {metrics?.weeklyProgressPercent || 0}% of {metrics?.weeklyGoalHours || 15}h goal
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Consecutive Study Streak</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {metrics?.currentStreakDays || 0} <span className="text-sm font-normal text-gray-500">days</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-3 flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>Active consistency streak</span>
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Assignment Completion</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {metrics?.tasksCompletionPercent || 0}%
          </p>
          <p className="text-[11px] text-gray-500 mt-3">
            {metrics?.completedAssignmentsCount || 0} of {metrics?.totalAssignmentsCount || 0} assignments done
          </p>
        </div>

        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <span className="text-xs font-semibold text-gray-500">Goals Achievement</span>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {charts?.goalsStatus?.rate || 0}%
          </p>
          <p className="text-[11px] text-gray-500 mt-3">
            {charts?.goalsStatus?.completed || 0} targets achieved
          </p>
        </div>
      </div>

      {/* Daily Study Hours Breakdown (Mon - Sun) */}
      <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Weekly Study Hours (Monday – Sunday)</h2>
            <p className="text-xs text-gray-500">Time spent per day during the current academic week</p>
          </div>
          <TrendingUp className="w-4 h-4 text-orange-500" />
        </div>

        <div className="grid grid-cols-7 gap-3 pt-6 border-t border-gray-100">
          {dailyHours.map((item: any, idx: number) => {
            const barHeight = Math.min(100, Math.max(10, Math.round((item.hours / maxDailyHour) * 100)));
            const isToday = item.date === new Date().toISOString().split('T')[0];

            return (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-800 mb-1">{item.hours}h</span>
                <div className="w-full h-36 bg-gray-50 rounded-2xl flex items-end p-1.5 border border-gray-100">
                  <div
                    style={{ height: `${barHeight}%` }}
                    className={`w-full rounded-xl transition-all duration-500 ${
                      isToday ? 'bg-orange-500 ring-2 ring-orange-200' : 'bg-orange-400 hover:bg-orange-500'
                    }`}
                  ></div>
                </div>
                <span className={`text-xs mt-2 font-semibold ${isToday ? 'text-orange-600' : 'text-gray-700'}`}>
                  {item.day}
                </span>
                <span className="text-[10px] text-gray-400">{item.date.slice(5)}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: Study Time by Subject & Deliverables Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Subject Breakdown */}
        <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-900">Study Time by Subject</h3>
            <span className="text-xs text-gray-400">{subjectsHours.length} Subjects Tracked</span>
          </div>

          {subjectsHours.length === 0 ? (
            <p className="text-xs text-gray-400 py-10 text-center">
              No completed sessions recorded yet. Completed sessions will distribute here.
            </p>
          ) : (
            <div className="space-y-4">
              {subjectsHours.map((s: any, idx: number) => {
                const percent = Math.round((s.hours / totalSubjectHours) * 100);

                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-gray-900">{s.name}</span>
                      <span className="text-gray-500">{s.hours}h ({percent}%)</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${percent}%`, backgroundColor: s.color || '#F97316' }}
                        className="h-full rounded-full transition-all"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Assignment & Deliverables Breakdown */}
        <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-card">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Deliverables & Milestone Status</h3>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-4 rounded-2xl bg-green-50/60 border border-green-200">
              <span className="text-[11px] font-semibold text-green-800 uppercase">Completed</span>
              <p className="text-2xl font-bold text-green-900 mt-1">
                {charts?.assignmentsStatus?.completed || 0}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200">
              <span className="text-[11px] font-semibold text-gray-700 uppercase">Pending</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {charts?.assignmentsStatus?.pending || 0}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-red-50/60 border border-red-200">
              <span className="text-[11px] font-semibold text-red-800 uppercase">Overdue</span>
              <p className="text-2xl font-bold text-red-900 mt-1">
                {charts?.assignmentsStatus?.overdue || 0}
              </p>
            </div>
          </div>

          <div className="mt-6 p-4 rounded-2xl bg-orange-50/40 border border-orange-200 flex items-start space-x-3 text-xs text-gray-700">
            <Award className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-gray-900">Academic Productivity Insight</p>
              <p className="text-gray-600 mt-0.5">
                Maintaining your {metrics?.currentStreakDays || 0}-day study streak boosts retention by up to 45% according to spaced repetition research.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
