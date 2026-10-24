import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import {
  StudySession,
  Assignment,
  Reminder,
  Subject,
  DashboardMetrics,
  AcademicPredictionReport
} from '../../types/index.js';
import {
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  ArrowRight,
  Plus,
  BookOpen,
  ClipboardList,
  Target,
  Check,
  X,
  Award,
  TrendingUp
} from '../../icons.js';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [todaySessions, setTodaySessions] = useState<StudySession[]>([]);
  const [upcomingAssignments, setUpcomingAssignments] = useState<Assignment[]>([]);
  const [upcomingReminders, setUpcomingReminders] = useState<Reminder[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [predictionReport, setPredictionReport] = useState<AcademicPredictionReport | null>(null);

  // Quick action modal
  const [showAddSessionModal, setShowAddSessionModal] = useState(false);
  const [showAddAssignmentModal, setShowAddAssignmentModal] = useState(false);

  // Add session form state
  const [newSessionSubject, setNewSessionSubject] = useState('');
  const [newSessionTopic, setNewSessionTopic] = useState('');
  const [newSessionDate, setNewSessionDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSessionStartTime, setNewSessionStartTime] = useState('14:00');
  const [newSessionEndTime, setNewSessionEndTime] = useState('15:00');
  const [newSessionDuration, setNewSessionDuration] = useState(60);

  // Add assignment form state
  const [newAssignmentTitle, setNewAssignmentTitle] = useState('');
  const [newAssignmentSubject, setNewAssignmentSubject] = useState('');
  const [newAssignmentDueDate, setNewAssignmentDueDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [newAssignmentDueTime, setNewAssignmentDueTime] = useState('23:59');
  const [newAssignmentPriority, setNewAssignmentPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];

      const [analyticsData, sessionsData, assignmentsData, remindersData, subjectsData, predictionsData] = await Promise.all([
        api.getAnalytics(),
        api.getSessions({ date: todayStr }),
        api.getAssignments(),
        api.getReminders(),
        api.getSubjects(),
        api.getAiPredictions().catch(() => ({ report: null }))
      ]);

      setMetrics(analyticsData.metrics);
      setTodaySessions(sessionsData.sessions);
      setUpcomingAssignments(assignmentsData.assignments.filter(a => a.status !== 'completed').slice(0, 4));
      setUpcomingReminders(remindersData.reminders.filter(r => !r.isCompleted && !r.isDismissed).slice(0, 4));
      setSubjects(subjectsData.subjects);
      if (predictionsData?.report) {
        setPredictionReport(predictionsData.report);
      }

      if (subjectsData.subjects.length > 0) {
        setNewSessionSubject(subjectsData.subjects[0].name);
        setNewAssignmentSubject(subjectsData.subjects[0].name);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleMarkSessionCompleted = async (id: string, durationMinutes: number) => {
    try {
      await api.completeSession(id, durationMinutes);
      loadDashboardData();
    } catch (_) {}
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await api.completeReminder(id);
      loadDashboardData();
    } catch (_) {}
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionSubject || !newSessionTopic) return;

    try {
      await api.createSession({
        subjectName: newSessionSubject,
        topic: newSessionTopic,
        date: newSessionDate,
        startTime: newSessionStartTime,
        endTime: newSessionEndTime,
        durationMinutes: Number(newSessionDuration) || 60,
        priority: 'medium'
      });
      setShowAddSessionModal(false);
      setNewSessionTopic('');
      loadDashboardData();
    } catch (_) {}
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAssignmentTitle || !newAssignmentSubject) return;

    try {
      await api.createAssignment({
        title: newAssignmentTitle,
        subjectName: newAssignmentSubject,
        dueDate: newAssignmentDueDate,
        dueTime: newAssignmentDueTime,
        priority: newAssignmentPriority
      });
      setShowAddAssignmentModal(false);
      setNewAssignmentTitle('');
      loadDashboardData();
    } catch (_) {}
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-gray-500 font-medium">Loading your academic workspace...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-6 bg-gradient-to-r from-orange-50/80 to-white rounded-3xl border border-orange-200">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-orange-600 uppercase">
            {todayFormatted}
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
            Hello, {user?.name || 'Student'}! 👋
          </h1>
          <p className="text-xs text-gray-600 mt-1">
            You have completed <span className="font-bold text-gray-900">{metrics?.todayStudyMinutesCompleted || 0} minutes</span> of study today.
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={() => setShowAddSessionModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Schedule Session</span>
          </button>
          <button
            onClick={() => setShowAddAssignmentModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-400" />
            <span>Add Assignment</span>
          </button>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly Study Hours */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Weekly Progress</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">{metrics?.totalHoursCompletedThisWeek || 0}h</span>
            <span className="text-xs text-gray-400">/ {metrics?.weeklyGoalHours || 15}h goal</span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              style={{ width: `${metrics?.weeklyProgressPercent || 0}%` }}
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
            ></div>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block text-right font-medium">
            {metrics?.weeklyProgressPercent || 0}% of weekly target
          </span>
        </div>

        {/* Task Completion Rate */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Assignment Completion</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-900">{metrics?.tasksCompletionPercent || 0}%</span>
            <span className="text-xs text-gray-400">
              ({metrics?.completedAssignmentsCount || 0} / {metrics?.totalAssignmentsCount || 0})
            </span>
          </div>
          <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div
              style={{ width: `${metrics?.tasksCompletionPercent || 0}%` }}
              className="bg-orange-500 h-full rounded-full transition-all duration-500"
            ></div>
          </div>
          <span className="text-[10px] text-gray-400 mt-1 block text-right font-medium">
            {metrics?.pendingTasksCount || 0} active assignments
          </span>
        </div>

        {/* Study Streak */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Current Study Streak</span>
            <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {metrics?.currentStreakDays || 0} <span className="text-sm font-normal text-gray-500">days</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-2">
            {metrics?.currentStreakDays ? 'Keep up the momentum!' : 'Complete a session today to start a streak!'}
          </p>
        </div>

        {/* Today's Target */}
        <div className="p-5 rounded-2xl border border-gray-200 bg-white shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">Today's Schedule</span>
            <div className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-200 text-gray-700 flex items-center justify-center">
              <Calendar className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {todaySessions.length} <span className="text-sm font-normal text-gray-500">sessions</span>
          </p>
          <p className="text-[11px] text-gray-500 mt-2">
            {metrics?.todayStudyMinutesCompleted || 0} mins completed today
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Timetable & Upcoming Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Today's Timetable */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900">Today's Study Timetable</h3>
              </div>
              <Link to="/planner" className="text-xs font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-1">
                <span>View full timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {todaySessions.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
                <p className="text-xs font-medium text-gray-600">No sessions scheduled for today</p>
                <p className="text-[11px] text-gray-400 mt-1">Use the quick action or AI study planner to schedule your day.</p>
                <button
                  onClick={() => setShowAddSessionModal(true)}
                  className="mt-3 px-3.5 py-1.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-xl border border-orange-200 hover:bg-orange-100 transition-colors"
                >
                  Schedule study block
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                      session.status === 'completed'
                        ? 'bg-gray-50/60 border-gray-200 opacity-80'
                        : 'bg-white border-gray-200 hover:border-orange-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 font-bold text-xs flex flex-col items-center justify-center shrink-0 border border-orange-200">
                        <span>{session.startTime}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-gray-900">{session.subjectName}</span>
                          <span className="px-1.5 py-0.5 text-[9px] uppercase font-bold rounded bg-gray-100 text-gray-600">
                            {session.durationMinutes}m
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{session.topic}</p>
                      </div>
                    </div>

                    <div>
                      {session.status === 'completed' ? (
                        <span className="inline-flex items-center space-x-1 text-xs font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-xl border border-green-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkSessionCompleted(session.id, session.durationMinutes)}
                          className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-orange-500 hover:text-white border border-gray-200 rounded-xl transition-colors flex items-center space-x-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Mark Done</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Academic & Exam Readiness Predictor Widget */}
          <div className="p-6 rounded-3xl border border-orange-200 bg-white shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">AI Exam Success Predictor</h3>
                  <p className="text-[11px] text-gray-500">Live academic performance forecasting</p>
                </div>
              </div>
              <Link
                to="/predictions"
                className="px-3 py-1.5 text-xs font-semibold text-orange-600 hover:text-white hover:bg-orange-500 border border-orange-200 hover:border-orange-500 rounded-xl transition-all flex items-center space-x-1.5"
              >
                <span>What-If Simulator</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {predictionReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-orange-50/50 border border-orange-100">
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 block">Exam Readiness</span>
                    <span className="text-xl font-bold text-orange-600">
                      {predictionReport.overallReadinessPercentage}%
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 block">Predicted GPA</span>
                    <span className="text-xl font-bold text-gray-900">
                      {predictionReport.projectedGpaEquivalent}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-medium text-gray-500 block">On-Time Submissions</span>
                    <span className="text-xl font-bold text-gray-900">
                      {predictionReport.onTimeAssignmentProbability}%
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div>
                  <div className="flex justify-between items-center text-xs font-medium text-gray-600 mb-1.5">
                    <span>Overall Preparation Index</span>
                    <span className="font-bold text-orange-600">{predictionReport.examReadinessStatus}</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(5, predictionReport.overallReadinessPercentage))}%` }}
                    />
                  </div>
                </div>

                {/* Subject highlights */}
                {predictionReport.subjectPredictions && predictionReport.subjectPredictions.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      Subject Mastery Forecast
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {predictionReport.subjectPredictions.slice(0, 4).map((sub, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl border border-gray-100 bg-gray-50/60 flex items-center justify-between">
                          <div className="truncate mr-2">
                            <p className="text-xs font-semibold text-gray-800 truncate">{sub.subjectName}</p>
                            <p className="text-[10px] text-gray-500">{sub.masteryPercentage}% mastery</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span className="text-xs font-bold text-orange-600">{sub.predictedScore}%</span>
                            <span className="text-[10px] font-semibold text-gray-600 ml-1">({sub.letterGrade})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top recommendation preview */}
                {predictionReport.insights && predictionReport.insights.length > 0 && (
                  <div className="p-3 rounded-xl bg-orange-50/30 border border-orange-100 flex items-start space-x-2">
                    <Target className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-gray-700 leading-relaxed line-clamp-2">
                      <span className="font-semibold text-gray-900">AI Recommendation: </span>
                      {predictionReport.insights[0].actionableStep || predictionReport.insights[0].description}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl">
                Calculating initial academic forecasts from your study records...
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines & Reminders */}
        <div className="space-y-6">
          {/* Upcoming Assignments */}
          <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <ClipboardList className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900">Upcoming Deadlines</h3>
              </div>
              <Link to="/assignments" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                View all
              </Link>
            </div>

            {upcomingAssignments.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No pending assignments</p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-2xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-orange-600 uppercase">
                          {a.subjectName}
                        </span>
                        <h4 className="text-xs font-bold text-gray-900 mt-0.5">{a.title}</h4>
                      </div>
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${
                          a.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : a.priority === 'high'
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {a.priority}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-[11px] text-gray-500 space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>Due {a.dueDate} at {a.dueTime}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Reminders */}
          <div className="p-6 rounded-3xl border border-gray-200 bg-white shadow-card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-gray-900">Active Reminders</h3>
              </div>
              <Link to="/reminders" className="text-xs font-semibold text-orange-600 hover:text-orange-700">
                Manage
              </Link>
            </div>

            {upcomingReminders.length === 0 ? (
              <p className="text-xs text-gray-400 py-6 text-center">No active reminders</p>
            ) : (
              <div className="space-y-2.5">
                {upcomingReminders.map((r) => (
                  <div key={r.id} className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-gray-900">{r.title}</p>
                      <span className="text-[10px] text-gray-400">{new Date(r.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    <button
                      onClick={() => handleCompleteReminder(r.id)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Mark as completed"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Schedule Session Modal */}
      {showAddSessionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setShowAddSessionModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">Schedule Study Block</h3>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                {subjects.length > 0 ? (
                  <select
                    value={newSessionSubject}
                    onChange={(e) => setNewSessionSubject(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newSessionSubject}
                    onChange={(e) => setNewSessionSubject(e.target.value)}
                    placeholder="e.g. Calculus III"
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topic / Chapter</label>
                <input
                  type="text"
                  value={newSessionTopic}
                  onChange={(e) => setNewSessionTopic(e.target.value)}
                  placeholder="e.g. Surface Integrals Practice Problems"
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newSessionDate}
                    onChange={(e) => setNewSessionDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={newSessionDuration}
                    onChange={(e) => setNewSessionDuration(Number(e.target.value))}
                    min={15}
                    max={240}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={newSessionStartTime}
                    onChange={(e) => setNewSessionStartTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={newSessionEndTime}
                    onChange={(e) => setNewSessionEndTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddSessionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  Save Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Assignment Modal */}
      {showAddAssignmentModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setShowAddAssignmentModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Assignment</h3>

            <form onSubmit={handleCreateAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={newAssignmentTitle}
                  onChange={(e) => setNewAssignmentTitle(e.target.value)}
                  placeholder="e.g. Research Paper Draft"
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                {subjects.length > 0 ? (
                  <select
                    value={newAssignmentSubject}
                    onChange={(e) => setNewAssignmentSubject(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newAssignmentSubject}
                    onChange={(e) => setNewAssignmentSubject(e.target.value)}
                    placeholder="e.g. Modern World History"
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={newAssignmentDueDate}
                    onChange={(e) => setNewAssignmentDueDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Due Time</label>
                  <input
                    type="time"
                    value={newAssignmentDueTime}
                    onChange={(e) => setNewAssignmentDueTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                <select
                  value={newAssignmentPriority}
                  onChange={(e) => setNewAssignmentPriority(e.target.value as any)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddAssignmentModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  Save Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
