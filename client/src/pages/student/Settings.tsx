import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { api } from '../../services/api.js';
import { Subject } from '../../types/index.js';
import {
  Settings as SettingsIcon,
  User,
  Bell,
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [weeklyGoalHours, setWeeklyGoalHours] = useState(user?.weeklyGoalHours || 15);
  const [gradeLevel, setGradeLevel] = useState(user?.gradeLevel || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');

  // Subjects
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [newSubjName, setNewSubjName] = useState('');
  const [newSubjCode, setNewSubjCode] = useState('');
  const [newSubjTargetHours, setNewSubjTargetHours] = useState(4);
  const [newSubjTopics, setNewSubjTopics] = useState('');

  // Status
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const loadSubjects = async () => {
    try {
      const data = await api.getSubjects();
      setSubjects(data.subjects);
    } catch (_) {}
  };

  useEffect(() => {
    loadSubjects();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccess(false);
    setProfileError(null);

    try {
      await api.updateProfile({
        name,
        weeklyGoalHours: Number(weeklyGoalHours),
        gradeLevel,
        timezone
      });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile settings.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjName.trim()) return;

    try {
      const topicsArray = newSubjTopics
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      await api.createSubject({
        name: newSubjName.trim(),
        code: newSubjCode.trim() || undefined,
        targetHoursPerWeek: Number(newSubjTargetHours) || 3,
        topics: topicsArray,
        color: '#F97316'
      });

      setNewSubjName('');
      setNewSubjCode('');
      setNewSubjTopics('');
      loadSubjects();
    } catch (_) {}
  };

  const handleDeleteSubject = async (id: string) => {
    if (!window.confirm('Delete this subject and its associated topics?')) return;
    try {
      await api.deleteSubject(id);
      loadSubjects();
    } catch (_) {}
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-gray-900">
          Account & Academic Preferences
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Customize your academic study workload, registered subjects, and notification behaviors
        </p>
      </div>

      {profileSuccess && (
        <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 text-xs text-green-800 flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <span>Profile preferences saved successfully.</span>
        </div>
      )}

      {profileError && (
        <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <span>{profileError}</span>
        </div>
      )}

      {/* Profile Form */}
      <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-card">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-100 mb-5">
          <User className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-gray-900">Student Profile</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Student Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Email Address (Read-only)
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Target Study Hours Per Week
              </label>
              <input
                type="number"
                value={weeklyGoalHours}
                onChange={(e) => setWeeklyGoalHours(Number(e.target.value))}
                min={5}
                max={60}
                required
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:border-orange-500"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">Used for weekly goal progress meters</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Degree / Academic Level
              </label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="e.g. Undergraduate Computer Science & Math"
                className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl focus:border-orange-500"
              />
              <p className="text-[11px] text-gray-400 mt-0.5">Helps AI tailor prediction criteria and grade benchmark depth</p>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              disabled={savingProfile}
              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Profile</span>
            </button>
          </div>
        </form>
      </div>

      {/* Subjects Management */}
      <div className="p-6 bg-white border border-gray-200 rounded-3xl shadow-card space-y-6">
        <div className="flex items-center space-x-2.5 pb-4 border-b border-gray-100">
          <BookOpen className="w-4 h-4 text-orange-500" />
          <h2 className="text-sm font-bold text-gray-900">Manage Registered Subjects</h2>
        </div>

        {/* Existing Subjects List */}
        <div className="space-y-2.5">
          {subjects.length === 0 ? (
            <p className="text-xs text-gray-400 py-4 text-center">No subjects registered yet.</p>
          ) : (
            subjects.map(s => (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between bg-white hover:border-gray-300 transition-colors"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-xs text-gray-900">{s.name}</span>
                    {s.code && (
                      <span className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-100 text-gray-700 rounded border border-gray-200">
                        {s.code}
                      </span>
                    )}
                    <span className="text-[10px] text-orange-600 font-semibold">
                      {s.targetHoursPerWeek} hrs/week
                    </span>
                  </div>
                  {s.topics && s.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {s.topics.map((t, idx) => (
                        <span key={idx} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 border border-gray-200 text-gray-600">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSubject(s.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Subject"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Add New Subject Form */}
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl space-y-3">
          <h3 className="text-xs font-bold text-gray-900">+ Add New Academic Subject</h3>
          <form onSubmit={handleAddSubject} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newSubjName}
                  onChange={(e) => setNewSubjName(e.target.value)}
                  placeholder="Subject name (e.g. Organic Chemistry)"
                  required
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={newSubjCode}
                  onChange={(e) => setNewSubjCode(e.target.value)}
                  placeholder="Code (e.g. CHEM-220)"
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <input
                  type="number"
                  value={newSubjTargetHours}
                  onChange={(e) => setNewSubjTargetHours(Number(e.target.value))}
                  min={1}
                  max={20}
                  placeholder="Target hrs/wk"
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                />
              </div>
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={newSubjTopics}
                  onChange={(e) => setNewSubjTopics(e.target.value)}
                  placeholder="Topics (e.g. Alkenes, Stereochemistry, NMR)"
                  className="w-full text-xs p-2 bg-white border border-gray-300 rounded-xl"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
              >
                Save Subject
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
