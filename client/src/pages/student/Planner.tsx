import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { StudySession, Subject } from '../../types/index.js';
import {
  CalendarDays,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  Calendar,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Edit,
  Trash2,
  Check,
  RotateCcw
} from 'lucide-react';

export const Planner: React.FC = () => {
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'daily'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // AI Plan Generator Modal
  const [showAiPlanModal, setShowAiPlanModal] = useState<boolean>(false);
  const [aiGenerating, setAiGenerating] = useState<boolean>(false);
  const [availableDailyHours, setAvailableDailyHours] = useState<number>(3);
  const [planStartDate, setPlanStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [planEndDate, setPlanEndDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [weakAreasInput, setWeakAreasInput] = useState<string>('Integration by parts, Graph traversals');
  const [generatedPlan, setGeneratedPlan] = useState<any[] | null>(null);
  const [planSummary, setPlanSummary] = useState<string>('');
  const [aiPlanError, setAiPlanError] = useState<string | null>(null);

  // Manual Session Modal
  const [showSessionModal, setShowSessionModal] = useState<boolean>(false);
  const [sessionSubject, setSessionSubject] = useState<string>('');
  const [sessionTopic, setSessionTopic] = useState<string>('');
  const [sessionDate, setSessionDate] = useState<string>(selectedDate);
  const [sessionStartTime, setSessionStartTime] = useState<string>('09:00');
  const [sessionEndTime, setSessionEndTime] = useState<string>('10:30');
  const [sessionDuration, setSessionDuration] = useState<number>(90);
  const [sessionPriority, setSessionPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');

  // Reschedule Modal
  const [rescheduleSessionTarget, setRescheduleSessionTarget] = useState<StudySession | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleStartTime, setRescheduleStartTime] = useState<string>('');
  const [rescheduleEndTime, setRescheduleEndTime] = useState<string>('');

  const loadPlannerData = async () => {
    try {
      setLoading(true);
      const [sessionsData, subjectsData] = await Promise.all([
        api.getSessions(),
        api.getSubjects()
      ]);
      setSessions(sessionsData.sessions);
      setSubjects(subjectsData.subjects);
      if (subjectsData.subjects.length > 0) {
        setSessionSubject(subjectsData.subjects[0].name);
      }
    } catch (err) {
      console.error('[Planner] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlannerData();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionSubject || !sessionTopic) return;

    try {
      await api.createSession({
        subjectName: sessionSubject,
        topic: sessionTopic,
        date: sessionDate,
        startTime: sessionStartTime,
        endTime: sessionEndTime,
        durationMinutes: sessionDuration,
        priority: sessionPriority
      });
      setShowSessionModal(false);
      setSessionTopic('');
      loadPlannerData();
    } catch (_) {}
  };

  const handleMarkCompleted = async (id: string, duration: number) => {
    try {
      await api.completeSession(id, duration);
      loadPlannerData();
    } catch (_) {}
  };

  const handleDeleteSession = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this study block?')) return;
    try {
      await api.deleteSession(id);
      loadPlannerData();
    } catch (_) {}
  };

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rescheduleSessionTarget) return;

    try {
      await api.rescheduleSession(
        rescheduleSessionTarget.id,
        rescheduleDate,
        rescheduleStartTime,
        rescheduleEndTime
      );
      setRescheduleSessionTarget(null);
      loadPlannerData();
    } catch (_) {}
  };

  // AI Plan Generation
  const handleGenerateAiPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setAiGenerating(true);
    setAiPlanError(null);
    setGeneratedPlan(null);

    try {
      const weakAreas = weakAreasInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await api.generatePlan({
        availableHoursPerDay: availableDailyHours,
        startDate: planStartDate,
        endDate: planEndDate,
        weakAreas
      });

      setGeneratedPlan(res.plan);
      setPlanSummary(res.summary);
    } catch (err: any) {
      setAiPlanError(err.message || 'Failed to generate study plan.');
    } finally {
      setAiGenerating(false);
    }
  };

  const handleApplyAiPlan = async () => {
    if (!generatedPlan || generatedPlan.length === 0) return;

    try {
      await api.applyPlan(generatedPlan);
      setShowAiPlanModal(false);
      setGeneratedPlan(null);
      loadPlannerData();
    } catch (err: any) {
      alert(err.message || 'Failed to apply plan.');
    }
  };

  // Calculations for Weekly View
  const getWeekDates = (baseDateStr: string) => {
    const base = new Date(baseDateStr);
    const day = base.getDay();
    const diff = (day + 6) % 7;
    const monday = new Date(base);
    monday.setDate(base.getDate() - diff);

    const week: { dateStr: string; dayName: string; formatted: string }[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const str = d.toISOString().split('T')[0];
      week.push({
        dateStr: str,
        dayName: dayNames[i],
        formatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
    return week;
  };

  const weekDays = getWeekDates(selectedDate);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Timetable & Study Planner
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Organize daily and weekly study blocks, track actual hours, and generate AI schedules
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAiPlanModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Study Planner</span>
          </button>
          <button
            onClick={() => {
              setSessionDate(selectedDate);
              setShowSessionModal(true);
            }}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4 text-gray-400" />
            <span>Add Session</span>
          </button>
        </div>
      </div>

      {/* View Switcher & Date Controls */}
      <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() - (viewMode === 'weekly' ? 7 : 1));
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-600"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="text-xs font-semibold text-gray-900 px-3 py-1.5 border border-gray-300 rounded-xl"
          />
          <button
            onClick={() => {
              const d = new Date(selectedDate);
              d.setDate(d.getDate() + (viewMode === 'weekly' ? 7 : 1));
              setSelectedDate(d.toISOString().split('T')[0]);
            }}
            className="p-1.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-600"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
            className="px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 bg-gray-100 rounded-lg"
          >
            Today
          </button>
        </div>

        <div className="flex items-center space-x-1 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'weekly'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Weekly Grid
          </button>
          <button
            onClick={() => setViewMode('daily')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors ${
              viewMode === 'daily'
                ? 'bg-white text-gray-900 shadow-2xs'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Daily Agenda
          </button>
        </div>
      </div>

      {/* WEEKLY GRID VIEW */}
      {viewMode === 'weekly' && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          {weekDays.map((day) => {
            const daySessions = sessions.filter(s => s.date === day.dateStr);
            const isToday = day.dateStr === new Date().toISOString().split('T')[0];

            return (
              <div
                key={day.dateStr}
                className={`p-3.5 rounded-2xl border min-h-[360px] flex flex-col justify-between ${
                  isToday
                    ? 'bg-orange-50/30 border-orange-300 ring-1 ring-orange-400'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 mb-3">
                    <div>
                      <p className={`text-xs font-bold ${isToday ? 'text-orange-600' : 'text-gray-900'}`}>
                        {day.dayName.slice(0, 3)}
                      </p>
                      <p className="text-[10px] text-gray-400">{day.formatted}</p>
                    </div>
                    {isToday && (
                      <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                    )}
                  </div>

                  {daySessions.length === 0 ? (
                    <p className="text-[11px] text-gray-300 text-center py-10">No sessions</p>
                  ) : (
                    <div className="space-y-2.5">
                      {daySessions.map((session) => (
                        <div
                          key={session.id}
                          className={`p-2.5 rounded-xl border text-xs transition-all ${
                            session.status === 'completed'
                              ? 'bg-gray-50 border-gray-200 opacity-70'
                              : 'bg-white border-gray-200 hover:border-orange-300 shadow-2xs'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-semibold text-gray-500 mb-1">
                            <span>{session.startTime} - {session.endTime}</span>
                            <span className="text-orange-600">{session.durationMinutes}m</span>
                          </div>
                          <p className="font-bold text-gray-900 truncate">{session.subjectName}</p>
                          <p className="text-[11px] text-gray-600 truncate mt-0.5">{session.topic}</p>

                          <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between">
                            {session.status === 'completed' ? (
                              <span className="text-[10px] font-bold text-green-700 flex items-center space-x-1">
                                <CheckCircle2 className="w-3 h-3 text-green-600" />
                                <span>Done</span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMarkCompleted(session.id, session.durationMinutes)}
                                className="text-[10px] font-semibold text-orange-600 hover:text-orange-700 flex items-center space-x-0.5"
                              >
                                <Check className="w-3 h-3" />
                                <span>Complete</span>
                              </button>
                            )}

                            <div className="flex items-center space-x-1 text-gray-400">
                              <button
                                onClick={() => {
                                  setRescheduleSessionTarget(session);
                                  setRescheduleDate(session.date);
                                  setRescheduleStartTime(session.startTime);
                                  setRescheduleEndTime(session.endTime);
                                }}
                                className="hover:text-gray-700 p-0.5"
                                title="Reschedule"
                              >
                                <RotateCcw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleDeleteSession(session.id)}
                                className="hover:text-red-600 p-0.5"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setSessionDate(day.dateStr);
                    setShowSessionModal(true);
                  }}
                  className="mt-3 w-full py-1 text-[11px] font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors border border-dashed border-gray-200"
                >
                  + Add
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* DAILY AGENDA VIEW */}
      {viewMode === 'daily' && (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">
                Agenda for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              <p className="text-xs text-gray-500">
                {sessions.filter(s => s.date === selectedDate).length} study sessions planned
              </p>
            </div>
            <button
              onClick={() => {
                setSessionDate(selectedDate);
                setShowSessionModal(true);
              }}
              className="px-3.5 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-xl hover:bg-orange-600 transition-colors"
            >
              + Add Study Session
            </button>
          </div>

          <div className="space-y-3">
            {sessions.filter(s => s.date === selectedDate).length === 0 ? (
              <div className="py-16 text-center text-gray-400">
                <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-xs">No sessions scheduled for this date</p>
              </div>
            ) : (
              sessions
                .filter(s => s.date === selectedDate)
                .map((session) => (
                  <div
                    key={session.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between ${
                      session.status === 'completed'
                        ? 'bg-gray-50/60 border-gray-200 opacity-80'
                        : 'bg-white border-gray-200 hover:border-orange-300 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-16 text-center py-1.5 rounded-xl bg-orange-50 border border-orange-200 text-orange-700 shrink-0">
                        <span className="text-xs font-bold block">{session.startTime}</span>
                        <span className="text-[10px] text-gray-400">{session.endTime}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-gray-900">{session.subjectName}</span>
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase bg-gray-100 text-gray-600">
                            {session.durationMinutes} mins
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{session.topic}</p>
                        {session.notes && (
                          <p className="text-[11px] text-gray-400 mt-0.5 italic">{session.notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {session.status === 'completed' ? (
                        <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-xl text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Completed</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleMarkCompleted(session.id, session.durationMinutes)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold transition-colors"
                        >
                          Mark Completed
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setRescheduleSessionTarget(session);
                          setRescheduleDate(session.date);
                          setRescheduleStartTime(session.startTime);
                          setRescheduleEndTime(session.endTime);
                        }}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl"
                        title="Reschedule"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* AI STUDY PLANNER MODAL */}
      {showAiPlanModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAiPlanModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">AI Intelligent Study Planner</h3>
                <p className="text-xs text-gray-500">
                  Generate an optimal, balanced academic timetable based on your workload and priorities
                </p>
              </div>
            </div>

            {aiPlanError && (
              <div className="my-4 p-3.5 rounded-xl bg-orange-50 border border-orange-200 text-xs text-orange-800 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5 shrink-0" />
                <p>{aiPlanError}</p>
              </div>
            )}

            {!generatedPlan ? (
              <form onSubmit={handleGenerateAiPlan} className="space-y-4 mt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Target Study Hours / Day
                    </label>
                    <input
                      type="number"
                      value={availableDailyHours}
                      onChange={(e) => setAvailableDailyHours(Number(e.target.value))}
                      min={1}
                      max={12}
                      required
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={planStartDate}
                      onChange={(e) => setPlanStartDate(e.target.value)}
                      required
                      className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    End Date (Planning horizon)
                  </label>
                  <input
                    type="date"
                    value={planEndDate}
                    onChange={(e) => setPlanEndDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Key Weak Areas or Priority Topics
                  </label>
                  <input
                    type="text"
                    value={weakAreasInput}
                    onChange={(e) => setWeakAreasInput(e.target.value)}
                    placeholder="e.g. Multivariable Integrals, Dynamic Programming, Gauss Law"
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Separate topics with commas</p>
                </div>

                <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-600">
                  <p className="font-semibold text-gray-900 mb-1">Planning with your registered subjects:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {subjects.map(s => (
                      <span key={s.id} className="px-2 py-0.5 rounded-lg bg-white border border-gray-200 text-gray-800 text-[11px]">
                        {s.name} ({s.targetHoursPerWeek}h/wk)
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAiPlanModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={aiGenerating}
                    className="px-5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    {aiGenerating ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Calculating Optimal Schedule...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Generate Study Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 mt-5">
                <div className="p-4 rounded-2xl bg-orange-50/60 border border-orange-200">
                  <p className="text-xs font-bold text-gray-900">{planSummary}</p>
                  <p className="text-[11px] text-gray-600 mt-1">
                    Review the {generatedPlan.length} proposed study blocks below. You can apply them directly to your live timetable.
                  </p>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 divide-y divide-gray-100">
                  {generatedPlan.map((p, idx) => (
                    <div key={idx} className="pt-2 flex items-start justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{p.subjectName}</span>
                          <span className="text-[10px] text-gray-400">
                            {p.date} • {p.startTime} - {p.endTime} ({p.durationMinutes}m)
                          </span>
                        </div>
                        <p className="text-gray-600 mt-0.5">{p.topic}</p>
                        {p.reasoning && (
                          <p className="text-[10px] text-orange-700 italic mt-0.5">Strategy: {p.reasoning}</p>
                        )}
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase rounded bg-gray-100 text-gray-700">
                        {p.priority}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-100">
                  <button
                    onClick={() => setGeneratedPlan(null)}
                    className="text-xs text-gray-500 hover:text-gray-900 font-semibold"
                  >
                    ← Recalculate
                  </button>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowAiPlanModal(false)}
                      className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={handleApplyAiPlan}
                      className="px-5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors flex items-center space-x-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply to Timetable</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MANUAL SESSION MODAL */}
      {showSessionModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setShowSessionModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Study Session</h3>

            <form onSubmit={handleCreateSession} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                {subjects.length > 0 ? (
                  <select
                    value={sessionSubject}
                    onChange={(e) => setSessionSubject(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  >
                    {subjects.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={sessionSubject}
                    onChange={(e) => setSessionSubject(e.target.value)}
                    placeholder="e.g. Calculus"
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Topic</label>
                <input
                  type="text"
                  value={sessionTopic}
                  onChange={(e) => setSessionTopic(e.target.value)}
                  placeholder="e.g. Partial derivatives"
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={sessionDuration}
                    onChange={(e) => setSessionDuration(Number(e.target.value))}
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
                    value={sessionStartTime}
                    onChange={(e) => setSessionStartTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={sessionEndTime}
                    onChange={(e) => setSessionEndTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowSessionModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  Save Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleSessionTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-sm w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setRescheduleSessionTarget(null)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-bold text-gray-900 mb-2">Reschedule Session</h3>
            <p className="text-xs text-gray-500 mb-4">{rescheduleSessionTarget.subjectName}: {rescheduleSessionTarget.topic}</p>

            <form onSubmit={handleReschedule} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">New Date</label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  required
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={rescheduleStartTime}
                    onChange={(e) => setRescheduleStartTime(e.target.value)}
                    required
                    className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">End Time</label>
                  <input
                    type="time"
                    value={rescheduleEndTime}
                    onChange={(e) => setRescheduleEndTime(e.target.value)}
                    required
                    className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRescheduleSessionTarget(null)}
                  className="px-3 py-1.5 text-xs text-gray-700 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 text-xs text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
