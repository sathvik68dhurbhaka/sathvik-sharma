import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';
import { Subject, StudySession, Assignment, AcademicGoal, Reminder, InAppNotification } from '../types/index.js';

const router = Router();

// Apply authentication to all academic endpoints
router.use(authenticate);

// ==========================================
// SUBJECTS
// ==========================================

// GET /api/subjects
router.get('/subjects', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const subjects = db.getSubjects(userId);
  return res.json({ subjects });
});

// POST /api/subjects
router.post('/subjects', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { name, code, color, targetHoursPerWeek, topics } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Subject name is required.' });
  }

  const newSubject: Subject = {
    id: uuidv4(),
    userId,
    name: name.trim(),
    code: code ? code.trim() : undefined,
    color: color || '#F97316',
    targetHoursPerWeek: Number(targetHoursPerWeek) || 3,
    topics: Array.isArray(topics) ? topics : [],
    createdAt: new Date().toISOString()
  };

  db.addSubject(newSubject);
  return res.status(201).json({ subject: newSubject });
});

// PUT /api/subjects/:id
router.put('/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const subjectId = req.params.id;
  const existing = db.getSubjectById(subjectId);

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  const { name, code, color, targetHoursPerWeek, topics } = req.body;
  const updates: Partial<Subject> = {};
  if (name) updates.name = name.trim();
  if (code !== undefined) updates.code = code;
  if (color) updates.color = color;
  if (targetHoursPerWeek !== undefined) updates.targetHoursPerWeek = Number(targetHoursPerWeek);
  if (Array.isArray(topics)) updates.topics = topics;

  const updated = db.updateSubject(subjectId, updates);
  return res.json({ subject: updated });
});

// DELETE /api/subjects/:id
router.delete('/subjects/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const subjectId = req.params.id;
  const existing = db.getSubjectById(subjectId);

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Subject not found.' });
  }

  db.deleteSubject(subjectId);
  return res.json({ message: 'Subject removed successfully.' });
});

// ==========================================
// STUDY SESSIONS & TIMETABLE
// ==========================================

// GET /api/sessions
router.get('/sessions', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { date, startDate, endDate, subjectId } = req.query;

  let sessions = db.getStudySessions(userId);

  if (date && typeof date === 'string') {
    sessions = sessions.filter(s => s.date === date);
  }
  if (startDate && typeof startDate === 'string') {
    sessions = sessions.filter(s => s.date >= startDate);
  }
  if (endDate && typeof endDate === 'string') {
    sessions = sessions.filter(s => s.date <= endDate);
  }
  if (subjectId && typeof subjectId === 'string') {
    sessions = sessions.filter(s => s.subjectId === subjectId);
  }

  // Sort by date then startTime
  sessions.sort((a, b) => {
    const diff = a.date.localeCompare(b.date);
    if (diff !== 0) return diff;
    return a.startTime.localeCompare(b.startTime);
  });

  return res.json({ sessions });
});

// POST /api/sessions
router.post('/sessions', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { subjectId, subjectName, topic, date, startTime, endTime, durationMinutes, priority, notes } = req.body;

  if (!subjectName || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Subject, date, start time, and end time are required.' });
  }

  const newSession: StudySession = {
    id: uuidv4(),
    userId,
    subjectId: subjectId || 'general',
    subjectName: subjectName.trim(),
    topic: topic ? topic.trim() : 'General Revision',
    date,
    startTime,
    endTime,
    durationMinutes: Number(durationMinutes) || 60,
    actualMinutesCompleted: 0,
    priority: priority || 'medium',
    status: 'scheduled',
    notes: notes || '',
    createdAt: new Date().toISOString()
  };

  db.addStudySession(newSession);
  return res.status(201).json({ session: newSession });
});

// PUT /api/sessions/:id
router.put('/sessions/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const sessionId = req.params.id;
  const existing = db.getStudySessionById(sessionId);

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Study session not found.' });
  }

  const updates = { ...req.body };
  delete updates.id;
  delete updates.userId;

  const updated = db.updateStudySession(sessionId, updates);
  return res.json({ session: updated });
});

// POST /api/sessions/:id/complete
router.post('/sessions/:id/complete', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const sessionId = req.params.id;
  const { minutesCompleted } = req.body;

  const existing = db.getStudySessionById(sessionId);
  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Study session not found.' });
  }

  const actualMinutes = minutesCompleted !== undefined ? Number(minutesCompleted) : existing.durationMinutes;
  const updated = db.updateStudySession(sessionId, {
    status: 'completed',
    actualMinutesCompleted: actualMinutes,
    completedAt: new Date().toISOString()
  });

  return res.json({ session: updated, message: 'Session marked as completed!' });
});

// POST /api/sessions/:id/reschedule
router.post('/sessions/:id/reschedule', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const sessionId = req.params.id;
  const { newDate, newStartTime, newEndTime } = req.body;

  const existing = db.getStudySessionById(sessionId);
  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Study session not found.' });
  }

  const updated = db.updateStudySession(sessionId, {
    date: newDate || existing.date,
    startTime: newStartTime || existing.startTime,
    endTime: newEndTime || existing.endTime,
    status: 'rescheduled'
  });

  return res.json({ session: updated, message: 'Session rescheduled successfully.' });
});

// DELETE /api/sessions/:id
router.delete('/sessions/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const sessionId = req.params.id;
  const existing = db.getStudySessionById(sessionId);

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Study session not found.' });
  }

  db.deleteStudySession(sessionId);
  return res.json({ message: 'Study session deleted.' });
});

// ==========================================
// ASSIGNMENTS
// ==========================================

// GET /api/assignments
router.get('/assignments', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { status, subjectId, priority } = req.query;

  let assignments = db.getAssignments(userId);

  if (status && typeof status === 'string') {
    assignments = assignments.filter(a => a.status === status);
  }
  if (subjectId && typeof subjectId === 'string') {
    assignments = assignments.filter(a => a.subjectId === subjectId);
  }
  if (priority && typeof priority === 'string') {
    assignments = assignments.filter(a => a.priority === priority);
  }

  // Sort by dueDate then dueTime
  assignments.sort((a, b) => {
    const diff = a.dueDate.localeCompare(b.dueDate);
    if (diff !== 0) return diff;
    return a.dueTime.localeCompare(b.dueTime);
  });

  return res.json({ assignments });
});

// POST /api/assignments
router.post('/assignments', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { title, description, subjectId, subjectName, dueDate, dueTime, priority, notes, links } = req.body;

  if (!title || !dueDate || !dueTime) {
    return res.status(400).json({ error: 'Title, due date, and due time are required.' });
  }

  const newAssignment: Assignment = {
    id: uuidv4(),
    userId,
    subjectId: subjectId || 'general',
    subjectName: subjectName || 'General',
    title: title.trim(),
    description: description ? description.trim() : '',
    dueDate,
    dueTime,
    priority: priority || 'medium',
    status: 'not_started',
    notes: notes || '',
    links: Array.isArray(links) ? links : [],
    createdAt: new Date().toISOString()
  };

  db.addAssignment(newAssignment);

  // Automatically create a reminder for this assignment
  const reminderDateTime = `${dueDate}T${dueTime}:00`;
  db.addReminder({
    id: uuidv4(),
    userId,
    title: `Assignment Due: ${newAssignment.title}`,
    dateTime: reminderDateTime,
    type: 'assignment',
    relatedId: newAssignment.id,
    isCompleted: false,
    isDismissed: false,
    createdAt: new Date().toISOString()
  });

  return res.status(201).json({ assignment: newAssignment });
});

// PUT /api/assignments/:id
router.put('/assignments/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const assignmentId = req.params.id;
  const existing = db.getAssignmentById(assignmentId);

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  const updates = { ...req.body };
  delete updates.id;
  delete updates.userId;

  if (updates.status === 'completed' && existing.status !== 'completed') {
    updates.completedAt = new Date().toISOString();
  }

  const updated = db.updateAssignment(assignmentId, updates);
  return res.json({ assignment: updated });
});

// DELETE /api/assignments/:id
router.delete('/assignments/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const assignmentId = req.params.id;
  const existing = db.getAssignmentById(assignmentId);

  if (!existing || existing.userId !== userId) {
    return res.status(404).json({ error: 'Assignment not found.' });
  }

  db.deleteAssignment(assignmentId);
  return res.json({ message: 'Assignment deleted successfully.' });
});

// ==========================================
// GOALS
// ==========================================

// GET /api/goals
router.get('/goals', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const goals = db.getGoals(userId);
  return res.json({ goals });
});

// POST /api/goals
router.post('/goals', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { title, subjectId, subjectName, targetDate, category, targetValue, currentValue, unit } = req.body;

  if (!title || !targetDate) {
    return res.status(400).json({ error: 'Goal title and target date are required.' });
  }

  const newGoal: AcademicGoal = {
    id: uuidv4(),
    userId,
    title: title.trim(),
    subjectId: subjectId || undefined,
    subjectName: subjectName || undefined,
    targetDate,
    category: category || 'milestone',
    targetValue: Number(targetValue) || 100,
    currentValue: Number(currentValue) || 0,
    unit: unit || '%',
    completed: Number(currentValue) >= Number(targetValue),
    createdAt: new Date().toISOString()
  };

  db.addGoal(newGoal);
  return res.status(201).json({ goal: newGoal });
});

// PUT /api/goals/:id
router.put('/goals/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const goalId = req.params.id;
  const goals = db.getGoals(userId);
  const existing = goals.find(g => g.id === goalId);

  if (!existing) {
    return res.status(404).json({ error: 'Goal not found.' });
  }

  const updates = { ...req.body };
  delete updates.id;
  delete updates.userId;

  if (updates.currentValue !== undefined || updates.targetValue !== undefined) {
    const curr = updates.currentValue !== undefined ? Number(updates.currentValue) : existing.currentValue;
    const tgt = updates.targetValue !== undefined ? Number(updates.targetValue) : existing.targetValue;
    updates.completed = curr >= tgt;
  }

  const updated = db.updateGoal(goalId, updates);
  return res.json({ goal: updated });
});

// DELETE /api/goals/:id
router.delete('/goals/:id', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  db.deleteGoal(req.params.id);
  return res.json({ message: 'Goal removed.' });
});

// ==========================================
// REMINDERS
// ==========================================

// GET /api/reminders
router.get('/reminders', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const reminders = db.getReminders(userId);
  reminders.sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
  return res.json({ reminders });
});

// POST /api/reminders
router.post('/reminders', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const { title, dateTime, type, relatedId } = req.body;

  if (!title || !dateTime) {
    return res.status(400).json({ error: 'Title and date/time are required.' });
  }

  const newReminder: Reminder = {
    id: uuidv4(),
    userId,
    title: title.trim(),
    dateTime,
    type: type || 'custom',
    relatedId,
    isCompleted: false,
    isDismissed: false,
    createdAt: new Date().toISOString()
  };

  db.addReminder(newReminder);
  return res.status(201).json({ reminder: newReminder });
});

// POST /api/reminders/:id/complete
router.post('/reminders/:id/complete', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const updated = db.updateReminder(req.params.id, { isCompleted: true });
  return res.json({ reminder: updated });
});

// POST /api/reminders/:id/dismiss
router.post('/reminders/:id/dismiss', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const updated = db.updateReminder(req.params.id, { isDismissed: true });
  return res.json({ reminder: updated });
});

// DELETE /api/reminders/:id
router.delete('/reminders/:id', (req: AuthenticatedRequest, res: Response) => {
  db.deleteReminder(req.params.id);
  return res.json({ message: 'Reminder deleted.' });
});

// ==========================================
// NOTIFICATIONS
// ==========================================

// GET /api/notifications
router.get('/notifications', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const notifications = db.getNotifications(userId);
  const unreadCount = notifications.filter(n => !n.isRead).length;
  return res.json({ notifications, unreadCount });
});

// POST /api/notifications/:id/read
router.post('/notifications/:id/read', (req: AuthenticatedRequest, res: Response) => {
  db.markNotificationAsRead(req.params.id);
  return res.json({ message: 'Notification marked as read.' });
});

// DELETE /api/notifications/clear
router.delete('/notifications/clear', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  db.clearAllNotifications(userId);
  return res.json({ message: 'Notifications cleared.' });
});

// ==========================================
// ANALYTICS & DASHBOARD METRICS
// ==========================================

router.get('/analytics', (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const user = db.getUserById(userId);

  const sessions = db.getStudySessions(userId);
  const assignments = db.getAssignments(userId);
  const goals = db.getGoals(userId);

  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Today's sessions & minutes
  const todaySessions = sessions.filter(s => s.date === todayStr);
  const todayCompletedMinutes = todaySessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.actualMinutesCompleted || s.durationMinutes), 0);
  const todayPlannedMinutes = todaySessions.reduce((sum, s) => sum + s.durationMinutes, 0);

  // 2. This week's study hours (Mon - Sun)
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 is Sun, 1 is Mon...
  const distanceToMonday = (dayOfWeek + 6) % 7;
  const monday = new Date(now);
  monday.setDate(now.getDate() - distanceToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const mondayStr = monday.toISOString().split('T')[0];
  const sundayStr = sunday.toISOString().split('T')[0];

  const thisWeekSessions = sessions.filter(s => s.date >= mondayStr && s.date <= sundayStr);
  const totalMinutesThisWeek = thisWeekSessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + (s.actualMinutesCompleted || s.durationMinutes), 0);
  const totalHoursThisWeek = parseFloat((totalMinutesThisWeek / 60).toFixed(1));

  // Daily breakdown for this week
  const weekDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const dailyDistribution = weekDayNames.map((dayName, idx) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + idx);
    const dateKey = d.toISOString().split('T')[0];
    const daySessions = sessions.filter(s => s.date === dateKey && s.status === 'completed');
    const dayMinutes = daySessions.reduce((sum, s) => sum + (s.actualMinutesCompleted || s.durationMinutes), 0);
    return {
      day: dayName,
      date: dateKey,
      hours: parseFloat((dayMinutes / 60).toFixed(1)),
      minutes: dayMinutes
    };
  });

  // 3. Subject distribution
  const subjectHoursMap: Record<string, { name: string; hours: number; color?: string }> = {};
  for (const s of sessions) {
    if (s.status === 'completed') {
      const minutes = s.actualMinutesCompleted || s.durationMinutes;
      if (!subjectHoursMap[s.subjectName]) {
        const subj = db.getSubjects(userId).find(sub => sub.name.toLowerCase() === s.subjectName.toLowerCase());
        subjectHoursMap[s.subjectName] = {
          name: s.subjectName,
          hours: 0,
          color: subj?.color || '#F97316'
        };
      }
      subjectHoursMap[s.subjectName].hours += parseFloat((minutes / 60).toFixed(1));
    }
  }
  const studyTimeBySubject = Object.values(subjectHoursMap);

  // 4. Assignments statistics
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const pendingAssignments = assignments.filter(a => a.status !== 'completed').length;

  const nowDateTime = new Date().toISOString();
  const overdueAssignments = assignments.filter(a => {
    if (a.status === 'completed') return false;
    const due = `${a.dueDate}T${a.dueTime}:00`;
    return due < nowDateTime;
  }).length;

  const taskCompletionPercent = totalAssignments > 0
    ? Math.round((completedAssignments / totalAssignments) * 100)
    : 0;

  // 5. Goals completion rate
  const totalGoals = goals.length;
  const completedGoals = goals.filter(g => g.completed).length;
  const goalsCompletionRate = totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;

  // 6. Streak calculation (consecutive days of completed sessions ending today or yesterday)
  const completedDates = new Set(
    sessions
      .filter(s => s.status === 'completed')
      .map(s => s.date)
  );

  let currentStreak = 0;
  let checkDate = new Date();
  
  // If no completed session today, check if streak was active yesterday
  const todayKey = checkDate.toISOString().split('T')[0];
  if (!completedDates.has(todayKey)) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const key = checkDate.toISOString().split('T')[0];
    if (completedDates.has(key)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  const weeklyGoalHours = user?.weeklyGoalHours || 15;
  const weeklyProgressPercent = Math.min(100, Math.round((totalHoursThisWeek / weeklyGoalHours) * 100));

  return res.json({
    metrics: {
      totalHoursCompletedThisWeek: totalHoursThisWeek,
      weeklyGoalHours,
      weeklyProgressPercent,
      tasksCompletionPercent: taskCompletionPercent,
      totalAssignmentsCount: totalAssignments,
      completedAssignmentsCount: completedAssignments,
      pendingTasksCount: pendingAssignments,
      overdueTasksCount: overdueAssignments,
      todaySessionsCount: todaySessions.length,
      todayStudyMinutesCompleted: todayCompletedMinutes,
      todayTargetMinutes: todayPlannedMinutes || 120,
      currentStreakDays: currentStreak
    },
    charts: {
      dailyStudyHours: dailyDistribution,
      studyTimeBySubject,
      assignmentsStatus: {
        completed: completedAssignments,
        pending: pendingAssignments - overdueAssignments,
        overdue: overdueAssignments
      },
      goalsStatus: {
        completed: completedGoals,
        active: totalGoals - completedGoals,
        rate: goalsCompletionRate
      }
    }
  });
});

export default router;
