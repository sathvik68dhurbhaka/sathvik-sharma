import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  User,
  Subject,
  StudySession,
  Assignment,
  AcademicGoal,
  Reminder,
  InAppNotification,
  TutorConversation,
  TutorMessage,
  AuthAuditLog,
  AdminAuditLog
} from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel ? '/tmp' : path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const BUNDLED_DB = path.resolve(__dirname, '../../data/db.json');

export interface DatabaseSchema {
  users: User[];
  subjects: Subject[];
  studySessions: StudySession[];
  assignments: Assignment[];
  goals: AcademicGoal[];
  reminders: Reminder[];
  notifications: InAppNotification[];
  tutorConversations: TutorConversation[];
  tutorMessages: TutorMessage[];
  authAuditLogs: AuthAuditLog[];
  adminAuditLogs: AdminAuditLog[];
}

const defaultSchema: DatabaseSchema = {
  users: [],
  subjects: [],
  studySessions: [],
  assignments: [],
  goals: [],
  reminders: [],
  notifications: [],
  tutorConversations: [],
  tutorMessages: [],
  authAuditLogs: [],
  adminAuditLogs: [],
};

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (isVercel) {
        if (fs.existsSync(DB_FILE)) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          return { ...defaultSchema, ...JSON.parse(raw) };
        }
        if (fs.existsSync(BUNDLED_DB)) {
          const raw = fs.readFileSync(BUNDLED_DB, 'utf-8');
          const parsed = JSON.parse(raw);
          this.saveImmediate(parsed);
          return { ...defaultSchema, ...parsed };
        }
      } else {
        if (!fs.existsSync(DATA_DIR)) {
          fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        if (fs.existsSync(DB_FILE)) {
          const raw = fs.readFileSync(DB_FILE, 'utf-8');
          return { ...defaultSchema, ...JSON.parse(raw) };
        }
      }
    } catch (err) {
      console.error('[DB] Error loading database file, initializing defaults:', err);
    }
    return defaultSchema;
  }

  private saveImmediate(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[DB] Error saving database file:', err);
    }
  }

  public save() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(this.data);
    }, 100);
  }

  public flushSync() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }
    this.saveImmediate(this.data);
  }

  // --- Users ---
  public getUsers() { return this.data.users; }
  public getUserById(id: string) { return this.data.users.find(u => u.id === id); }
  public getUserByEmail(email: string) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
  }
  public addUser(user: User) {
    this.data.users.push(user);
    this.save();
  }
  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return null;
  }

  // --- Subjects ---
  public getSubjects(userId: string) {
    return this.data.subjects.filter(s => s.userId === userId);
  }
  public getSubjectById(id: string) {
    return this.data.subjects.find(s => s.id === id);
  }
  public addSubject(subject: Subject) {
    this.data.subjects.push(subject);
    this.save();
  }
  public updateSubject(id: string, updates: Partial<Subject>) {
    const idx = this.data.subjects.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.subjects[idx] = { ...this.data.subjects[idx], ...updates };
      this.save();
      return this.data.subjects[idx];
    }
    return null;
  }
  public deleteSubject(id: string) {
    this.data.subjects = this.data.subjects.filter(s => s.id !== id);
    this.save();
  }

  // --- Study Sessions ---
  public getStudySessions(userId: string) {
    return this.data.studySessions.filter(s => s.userId === userId);
  }
  public getStudySessionById(id: string) {
    return this.data.studySessions.find(s => s.id === id);
  }
  public addStudySession(session: StudySession) {
    this.data.studySessions.push(session);
    this.save();
  }
  public updateStudySession(id: string, updates: Partial<StudySession>) {
    const idx = this.data.studySessions.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.data.studySessions[idx] = { ...this.data.studySessions[idx], ...updates };
      this.save();
      return this.data.studySessions[idx];
    }
    return null;
  }
  public deleteStudySession(id: string) {
    this.data.studySessions = this.data.studySessions.filter(s => s.id !== id);
    this.save();
  }

  // --- Assignments ---
  public getAssignments(userId: string) {
    return this.data.assignments.filter(a => a.userId === userId);
  }
  public getAssignmentById(id: string) {
    return this.data.assignments.find(a => a.id === id);
  }
  public addAssignment(assignment: Assignment) {
    this.data.assignments.push(assignment);
    this.save();
  }
  public updateAssignment(id: string, updates: Partial<Assignment>) {
    const idx = this.data.assignments.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates };
      this.save();
      return this.data.assignments[idx];
    }
    return null;
  }
  public deleteAssignment(id: string) {
    this.data.assignments = this.data.assignments.filter(a => a.id !== id);
    this.save();
  }

  // --- Goals ---
  public getGoals(userId: string) {
    return this.data.goals.filter(g => g.userId === userId);
  }
  public addGoal(goal: AcademicGoal) {
    this.data.goals.push(goal);
    this.save();
  }
  public updateGoal(id: string, updates: Partial<AcademicGoal>) {
    const idx = this.data.goals.findIndex(g => g.id === id);
    if (idx !== -1) {
      this.data.goals[idx] = { ...this.data.goals[idx], ...updates };
      this.save();
      return this.data.goals[idx];
    }
    return null;
  }
  public deleteGoal(id: string) {
    this.data.goals = this.data.goals.filter(g => g.id !== id);
    this.save();
  }

  // --- Reminders ---
  public getReminders(userId: string) {
    return this.data.reminders.filter(r => r.userId === userId);
  }
  public getAllPendingReminders() {
    return this.data.reminders.filter(r => !r.isCompleted && !r.isDismissed);
  }
  public addReminder(reminder: Reminder) {
    this.data.reminders.push(reminder);
    this.save();
  }
  public updateReminder(id: string, updates: Partial<Reminder>) {
    const idx = this.data.reminders.findIndex(r => r.id === id);
    if (idx !== -1) {
      this.data.reminders[idx] = { ...this.data.reminders[idx], ...updates };
      this.save();
      return this.data.reminders[idx];
    }
    return null;
  }
  public deleteReminder(id: string) {
    this.data.reminders = this.data.reminders.filter(r => r.id !== id);
    this.save();
  }

  // --- Notifications ---
  public getNotifications(userId: string) {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  public addNotification(notification: InAppNotification) {
    this.data.notifications.push(notification);
    this.save();
  }
  public markNotificationAsRead(id: string) {
    const n = this.data.notifications.find(item => item.id === id);
    if (n) {
      n.isRead = true;
      this.save();
    }
  }
  public clearAllNotifications(userId: string) {
    this.data.notifications = this.data.notifications.filter(n => n.userId !== userId);
    this.save();
  }

  // --- AI Tutor Conversations & Messages ---
  public getConversations(userId: string) {
    return this.data.tutorConversations
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
  public getConversationById(id: string) {
    const conv = this.data.tutorConversations.find(c => c.id === id);
    if (!conv) return null;
    const messages = this.data.tutorMessages
      .filter(m => m.conversationId === id)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return { ...conv, messages };
  }
  public addConversation(conv: TutorConversation) {
    this.data.tutorConversations.push(conv);
    this.save();
  }
  public updateConversation(id: string, updates: Partial<TutorConversation>) {
    const idx = this.data.tutorConversations.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.data.tutorConversations[idx] = {
        ...this.data.tutorConversations[idx],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this.save();
      return this.data.tutorConversations[idx];
    }
    return null;
  }
  public deleteConversation(id: string) {
    this.data.tutorConversations = this.data.tutorConversations.filter(c => c.id !== id);
    this.data.tutorMessages = this.data.tutorMessages.filter(m => m.conversationId !== id);
    this.save();
  }
  public addMessage(message: TutorMessage) {
    this.data.tutorMessages.push(message);
    const conv = this.data.tutorConversations.find(c => c.id === message.conversationId);
    if (conv) {
      conv.updatedAt = new Date().toISOString();
    }
    this.save();
  }

  // --- Audit Logs ---
  public addAuthAuditLog(log: AuthAuditLog) {
    this.data.authAuditLogs.push(log);
    this.save();
  }
  public getAuthAuditLogs(options?: {
    email?: string;
    eventType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    let logs = [...this.data.authAuditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    if (options?.email) {
      const q = options.email.toLowerCase();
      logs = logs.filter(l => l.email.toLowerCase().includes(q));
    }
    if (options?.eventType) {
      logs = logs.filter(l => l.eventType === options.eventType);
    }
    if (options?.status) {
      logs = logs.filter(l => l.status === options.status);
    }
    const total = logs.length;
    const offset = options?.offset || 0;
    const limit = options?.limit || 50;
    return {
      total,
      logs: logs.slice(offset, offset + limit)
    };
  }

  public addAdminAuditLog(log: AdminAuditLog) {
    this.data.adminAuditLogs.push(log);
    this.save();
  }
  public getAdminAuditLogs(limit = 50, offset = 0) {
    const logs = [...this.data.adminAuditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return {
      total: logs.length,
      logs: logs.slice(offset, offset + limit)
    };
  }
}

export const db = new Database();
