import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Reminder, AcademicGoal, Subject } from '../../types/index.js';
import {
  Target,
  Bell,
  Plus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Calendar,
  X,
  Check,
  Award,
  BellRing
} from 'lucide-react';

export const RemindersGoals: React.FC = () => {
  const [goals, setGoals] = useState<AcademicGoal[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Browser notification permission state
  const [browserPerm, setBrowserPerm] = useState<string>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  // Add Goal Modal
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalCategory, setGoalCategory] = useState<'grade' | 'exam' | 'hours' | 'milestone'>('grade');
  const [goalTargetValue, setGoalTargetValue] = useState(90);
  const [goalCurrentValue, setGoalCurrentValue] = useState(75);
  const [goalUnit, setGoalUnit] = useState('%');
  const [goalTargetDate, setGoalTargetDate] = useState(
    new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0]
  );
  const [goalSubject, setGoalSubject] = useState('');

  // Add Reminder Modal
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [reminderTitle, setReminderTitle] = useState('');
  const [reminderDateTime, setReminderDateTime] = useState(
    new Date(Date.now() + 3600000 * 4).toISOString().slice(0, 16)
  );
  const [reminderType, setReminderType] = useState<any>('custom');

  const loadData = async () => {
    try {
      setLoading(true);
      const [goalsData, remindersData, subjectsData] = await Promise.all([
        api.getGoals(),
        api.getReminders(),
        api.getSubjects()
      ]);
      setGoals(goalsData.goals);
      setReminders(remindersData.reminders);
      setSubjects(subjectsData.subjects);
      if (subjectsData.subjects.length > 0 && !goalSubject) {
        setGoalSubject(subjectsData.subjects[0].name);
      }
    } catch (err) {
      console.error('[RemindersGoals] Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const requestBrowserNotification = async () => {
    if (typeof Notification === 'undefined') {
      alert('Browser notifications are not supported in this browser.');
      return;
    }
    const perm = await Notification.requestPermission();
    setBrowserPerm(perm);
    if (perm === 'granted') {
      new Notification('AI Study Manager', {
        body: 'Browser notifications have been successfully enabled!',
        icon: '/favicon.ico'
      });
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goalTitle || !goalTargetDate) return;

    try {
      await api.createGoal({
        title: goalTitle,
        category: goalCategory,
        targetValue: Number(goalTargetValue),
        currentValue: Number(goalCurrentValue),
        unit: goalUnit,
        targetDate: goalTargetDate,
        subjectName: goalSubject || undefined
      });
      setShowGoalModal(false);
      setGoalTitle('');
      loadData();
    } catch (_) {}
  };

  const handleUpdateGoalProgress = async (goal: AcademicGoal, delta: number) => {
    const nextVal = Math.max(0, goal.currentValue + delta);
    try {
      await api.updateGoal(goal.id, { currentValue: nextVal });
      loadData();
    } catch (_) {}
  };

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      await api.deleteGoal(id);
      loadData();
    } catch (_) {}
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderTitle || !reminderDateTime) return;

    try {
      await api.createReminder({
        title: reminderTitle,
        dateTime: reminderDateTime,
        type: reminderType
      });
      setShowReminderModal(false);
      setReminderTitle('');
      loadData();
    } catch (_) {}
  };

  const handleCompleteReminder = async (id: string) => {
    try {
      await api.completeReminder(id);
      loadData();
    } catch (_) {}
  };

  const handleDismissReminder = async (id: string) => {
    try {
      await api.dismissReminder(id);
      loadData();
    } catch (_) {}
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await api.deleteReminder(id);
      loadData();
    } catch (_) {}
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Academic Goals & Reminders
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track milestones, exam grade targets, study alerts, and scheduled notifications
          </p>
        </div>

        {/* Browser notification toggle */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          {browserPerm !== 'granted' ? (
            <button
              onClick={requestBrowserNotification}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-semibold rounded-xl transition-colors"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Enable Browser Notifications</span>
            </button>
          ) : (
            <span className="inline-flex items-center space-x-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 text-xs font-semibold rounded-xl">
              <Check className="w-3.5 h-3.5" />
              <span>Browser Alerts Active</span>
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* LEFT COLUMN: ACADEMIC GOALS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-orange-500" />
              <h2 className="text-base font-bold text-gray-900">Academic Goals</h2>
            </div>
            <button
              onClick={() => setShowGoalModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Goal</span>
            </button>
          </div>

          <div className="space-y-3">
            {goals.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 rounded-2xl">
                <Target className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                <p className="text-xs font-medium text-gray-600">No academic goals set yet</p>
                <p className="text-[11px] text-gray-400 mt-1">Set grade targets, problem set counts, or study hour goals.</p>
              </div>
            ) : (
              goals.map((g) => {
                const percent = Math.min(100, Math.round((g.currentValue / g.targetValue) * 100));

                return (
                  <div
                    key={g.id}
                    className="p-4 bg-white border border-gray-200 rounded-2xl shadow-2xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        {g.subjectName && (
                          <span className="text-[10px] font-semibold text-orange-600 uppercase">
                            {g.subjectName}
                          </span>
                        )}
                        <h3 className="text-xs font-bold text-gray-900 mt-0.5">{g.title}</h3>
                        <p className="text-[11px] text-gray-400">Target Date: {g.targetDate}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {g.completed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-50 text-green-700 border border-green-200 flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Achieved</span>
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteGoal(g.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1 font-semibold">
                        <span className="text-gray-600">
                          {g.currentValue} / {g.targetValue} {g.unit}
                        </span>
                        <span className="text-orange-600">{percent}%</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${percent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            g.completed ? 'bg-green-500' : 'bg-orange-500'
                          }`}
                        ></div>
                      </div>
                    </div>

                    {/* Quick increment buttons */}
                    <div className="flex items-center justify-end space-x-1 pt-1 text-[11px]">
                      <span className="text-gray-400 mr-2 text-[10px]">Update:</span>
                      <button
                        onClick={() => handleUpdateGoalProgress(g, -1)}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                      >
                        -1
                      </button>
                      <button
                        onClick={() => handleUpdateGoalProgress(g, 1)}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                      >
                        +1
                      </button>
                      <button
                        onClick={() => handleUpdateGoalProgress(g, 5)}
                        className="px-2 py-0.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                      >
                        +5
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: REMINDERS & ALERTS */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-4 h-4 text-orange-500" />
              <h2 className="text-base font-bold text-gray-900">Reminders & Alerts</h2>
            </div>
            <button
              onClick={() => setShowReminderModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 rounded-xl text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-gray-400" />
              <span>Add Reminder</span>
            </button>
          </div>

          <div className="space-y-3">
            {reminders.length === 0 ? (
              <div className="p-8 text-center text-gray-400 bg-white border border-gray-200 rounded-2xl">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-gray-400" />
                <p className="text-xs font-medium text-gray-600">No active reminders</p>
                <p className="text-[11px] text-gray-400 mt-1">Schedule alerts for problem sets or exam revisions.</p>
              </div>
            ) : (
              reminders.map((r) => (
                <div
                  key={r.id}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    r.isCompleted || r.isDismissed
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'bg-white border-gray-200 shadow-2xs hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      <Clock className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${r.isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                        {r.title}
                      </p>
                      <div className="flex items-center space-x-2 text-[11px] text-gray-500 mt-0.5">
                        <span>{new Date(r.dateTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <span>•</span>
                        <span className="uppercase text-[9px] font-semibold text-gray-400">{r.type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!r.isCompleted && (
                      <button
                        onClick={() => handleCompleteReminder(r.id)}
                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Mark Completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteReminder(r.id)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {/* CREATE GOAL MODAL */}
      {showGoalModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setShowGoalModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">Set Academic Goal</h3>

            <form onSubmit={handleCreateGoal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Goal Title</label>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="e.g. Score 90%+ on Calculus Midterm"
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject</label>
                <select
                  value={goalSubject}
                  onChange={(e) => setGoalSubject(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="">General Academic</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category</label>
                  <select
                    value={goalCategory}
                    onChange={(e) => setGoalCategory(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  >
                    <option value="grade">Grade Target</option>
                    <option value="exam">Exam Score</option>
                    <option value="hours">Study Hours</option>
                    <option value="milestone">Milestone / Problems</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Date</label>
                  <input
                    type="date"
                    value={goalTargetDate}
                    onChange={(e) => setGoalTargetDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Target Val</label>
                  <input
                    type="number"
                    value={goalTargetValue}
                    onChange={(e) => setGoalTargetValue(Number(e.target.value))}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Current Val</label>
                  <input
                    type="number"
                    value={goalCurrentValue}
                    onChange={(e) => setGoalCurrentValue(Number(e.target.value))}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Unit</label>
                  <input
                    type="text"
                    value={goalUnit}
                    onChange={(e) => setGoalUnit(e.target.value)}
                    placeholder="%, hrs, problems"
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE REMINDER MODAL */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setShowReminderModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">Add Study Reminder</h3>

            <form onSubmit={handleCreateReminder} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Reminder Title</label>
                <input
                  type="text"
                  value={reminderTitle}
                  onChange={(e) => setReminderTitle(e.target.value)}
                  placeholder="e.g. Review physics formulas before lab"
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Alert Date & Time</label>
                <input
                  type="datetime-local"
                  value={reminderDateTime}
                  onChange={(e) => setReminderDateTime(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Type</label>
                <select
                  value={reminderType}
                  onChange={(e) => setReminderType(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                >
                  <option value="custom">Custom Reminder</option>
                  <option value="revision">Exam Revision</option>
                  <option value="study_session">Study Session Alert</option>
                  <option value="assignment">Assignment Deadline</option>
                </select>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReminderModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  Save Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
