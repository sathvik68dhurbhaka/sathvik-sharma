import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.js';
import { Assignment, Subject } from '../../types/index.js';
import {
  ClipboardList,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  Search,
  Trash2,
  Edit3,
  ExternalLink,
  X,
  Check
} from 'lucide-react';

export const Assignments: React.FC = () => {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'overdue' | 'completed'>('all');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubject, setFormSubject] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('23:59');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [formNotes, setFormNotes] = useState('');
  const [formLinks, setFormLinks] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [assignmentsData, subjectsData] = await Promise.all([
        api.getAssignments(),
        api.getSubjects()
      ]);
      setAssignments(assignmentsData.assignments);
      setSubjects(subjectsData.subjects);
      if (subjectsData.subjects.length > 0 && !formSubject) {
        setFormSubject(subjectsData.subjects[0].name);
      }
    } catch (err) {
      console.error('[Assignments] Error loading:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingAssignment(null);
    setFormTitle('');
    setFormDescription('');
    setFormSubject(subjects.length > 0 ? subjects[0].name : 'General');
    const defaultDue = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];
    setFormDueDate(defaultDue);
    setFormDueTime('23:59');
    setFormPriority('medium');
    setFormNotes('');
    setFormLinks('');
    setShowModal(true);
  };

  const openEditModal = (a: Assignment) => {
    setEditingAssignment(a);
    setFormTitle(a.title);
    setFormDescription(a.description || '');
    setFormSubject(a.subjectName);
    setFormDueDate(a.dueDate);
    setFormDueTime(a.dueTime);
    setFormPriority(a.priority);
    setFormNotes(a.notes || '');
    setFormLinks((a.links || []).join(', '));
    setShowModal(true);
  };

  const handleSaveAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formSubject || !formDueDate) return;

    const linksArray = formLinks
      .split(',')
      .map(l => l.trim())
      .filter(Boolean);

    try {
      if (editingAssignment) {
        await api.updateAssignment(editingAssignment.id, {
          title: formTitle,
          description: formDescription,
          subjectName: formSubject,
          dueDate: formDueDate,
          dueTime: formDueTime,
          priority: formPriority,
          notes: formNotes,
          links: linksArray
        });
      } else {
        await api.createAssignment({
          title: formTitle,
          description: formDescription,
          subjectName: formSubject,
          dueDate: formDueDate,
          dueTime: formDueTime,
          priority: formPriority,
          notes: formNotes,
          links: linksArray
        });
      }
      setShowModal(false);
      loadData();
    } catch (_) {}
  };

  const handleToggleStatus = async (a: Assignment) => {
    const nextStatus =
      a.status === 'completed'
        ? 'in_progress'
        : a.status === 'in_progress'
        ? 'completed'
        : 'in_progress';

    try {
      await api.updateAssignment(a.id, { status: nextStatus });
      loadData();
    } catch (_) {}
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      await api.deleteAssignment(id);
      loadData();
    } catch (_) {}
  };

  // Filter assignments
  const nowIso = new Date().toISOString();

  let filtered = assignments.filter((a) => {
    // Search
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match =
        a.title.toLowerCase().includes(q) ||
        a.subjectName.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Subject
    if (selectedSubject && a.subjectName !== selectedSubject) return false;

    // Priority
    if (selectedPriority && a.priority !== selectedPriority) return false;

    // Tabs
    const dueDateTime = `${a.dueDate}T${a.dueTime}:00`;
    const isOverdue = a.status !== 'completed' && dueDateTime < nowIso;

    if (activeTab === 'completed') return a.status === 'completed';
    if (activeTab === 'overdue') return isOverdue;
    if (activeTab === 'upcoming') return a.status !== 'completed' && !isOverdue;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">
            Assignments & Deadlines
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Track problem sets, lab reports, essays, and exam deliverables with urgency indicators
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Tabs and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-gray-200 pb-3">
        {/* Tabs */}
        <div className="flex items-center space-x-2">
          {(['all', 'upcoming', 'overdue', 'completed'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-orange-50 text-orange-600 border border-orange-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-56">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search assignments..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-xl focus:border-orange-500"
            />
          </div>

          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="text-xs py-1.5 px-2.5 bg-white border border-gray-300 rounded-xl text-gray-700"
          >
            <option value="">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Assignments List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-20 text-center text-gray-400 text-xs">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <span>Loading assignments...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400 bg-white border border-gray-200 rounded-3xl p-8">
            <ClipboardList className="w-10 h-10 mx-auto mb-2 opacity-30 text-gray-400" />
            <p className="text-xs font-medium text-gray-600">No assignments match your view</p>
            <button
              onClick={openCreateModal}
              className="mt-3 px-3 py-1.5 bg-orange-50 text-orange-600 text-xs font-semibold rounded-xl border border-orange-200"
            >
              Add an assignment
            </button>
          </div>
        ) : (
          filtered.map((a) => {
            const dueDateTime = `${a.dueDate}T${a.dueTime}:00`;
            const isOverdue = a.status !== 'completed' && dueDateTime < nowIso;

            return (
              <div
                key={a.id}
                className={`p-5 rounded-2xl border transition-all ${
                  a.status === 'completed'
                    ? 'bg-gray-50/70 border-gray-200 opacity-80'
                    : isOverdue
                    ? 'bg-red-50/20 border-red-300 shadow-2xs'
                    : 'bg-white border-gray-200 hover:border-orange-300 shadow-2xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start space-x-3.5">
                    {/* Checkbox toggle */}
                    <button
                      onClick={() => handleToggleStatus(a)}
                      className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        a.status === 'completed'
                          ? 'bg-green-600 border-green-600 text-white'
                          : 'border-gray-300 hover:border-orange-500 bg-white'
                      }`}
                    >
                      {a.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                    </button>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wide">
                          {a.subjectName}
                        </span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            a.priority === 'urgent'
                              ? 'bg-red-100 text-red-700'
                              : a.priority === 'high'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {a.priority}
                        </span>
                        {isOverdue && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 flex items-center space-x-1">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Overdue</span>
                          </span>
                        )}
                      </div>

                      <h3
                        className={`text-sm font-bold text-gray-900 mt-1 ${
                          a.status === 'completed' ? 'line-through text-gray-500' : ''
                        }`}
                      >
                        {a.title}
                      </h3>

                      {a.description && (
                        <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                          {a.description}
                        </p>
                      )}

                      {/* Links */}
                      {a.links && a.links.length > 0 && (
                        <div className="flex items-center space-x-2 mt-2">
                          {a.links.map((link, idx) => (
                            <a
                              key={idx}
                              href={link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-orange-600 hover:underline flex items-center space-x-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>Reference Link</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions & Due Date */}
                  <div className="flex items-center space-x-4 self-end sm:self-auto shrink-0">
                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-xs text-gray-600 font-medium">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span>{a.dueDate}</span>
                      </div>
                      <span className="text-[10px] text-gray-400 block">{a.dueTime}</span>
                    </div>

                    <div className="flex items-center space-x-1 border-l border-gray-200 pl-3">
                      <button
                        onClick={() => openEditModal(a)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Edit Assignment"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(a.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Assignment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full rounded-3xl p-6 border border-gray-200 shadow-dropdown relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-bold text-gray-900 mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Add New Assignment'}
            </h3>

            <form onSubmit={handleSaveAssignment} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Midterm Problem Set 3"
                  required
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Subject
                </label>
                {subjects.length > 0 ? (
                  <select
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formSubject}
                    onChange={(e) => setFormSubject(e.target.value)}
                    placeholder="e.g. Mathematics"
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Description / Task Instructions
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Details, chapters to cover, derivation steps..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                    required
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    value={formPriority}
                    onChange={(e) => setFormPriority(e.target.value as any)}
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    External Links
                  </label>
                  <input
                    type="text"
                    value={formLinks}
                    onChange={(e) => setFormLinks(e.target.value)}
                    placeholder="https://... (comma separated)"
                    className="w-full text-xs p-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="mt-5 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-orange-500 hover:bg-orange-600 rounded-xl"
                >
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
