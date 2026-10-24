import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const defaultSchema = {
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
    data;
    saveTimeout = null;
    constructor() {
        this.data = this.load();
    }
    load() {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            if (fs.existsSync(DB_FILE)) {
                const raw = fs.readFileSync(DB_FILE, 'utf-8');
                return { ...defaultSchema, ...JSON.parse(raw) };
            }
        }
        catch (err) {
            console.error('[DB] Error loading database file, initializing defaults:', err);
        }
        this.saveImmediate(defaultSchema);
        return defaultSchema;
    }
    saveImmediate(data) {
        try {
            if (!fs.existsSync(DATA_DIR)) {
                fs.mkdirSync(DATA_DIR, { recursive: true });
            }
            fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
        catch (err) {
            console.error('[DB] Error saving database file:', err);
        }
    }
    save() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        this.saveTimeout = setTimeout(() => {
            this.saveImmediate(this.data);
        }, 100);
    }
    flushSync() {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
            this.saveTimeout = null;
        }
        this.saveImmediate(this.data);
    }
    // --- Users ---
    getUsers() { return this.data.users; }
    getUserById(id) { return this.data.users.find(u => u.id === id); }
    getUserByEmail(email) {
        return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
    }
    addUser(user) {
        this.data.users.push(user);
        this.save();
    }
    updateUser(id, updates) {
        const idx = this.data.users.findIndex(u => u.id === id);
        if (idx !== -1) {
            this.data.users[idx] = { ...this.data.users[idx], ...updates };
            this.save();
            return this.data.users[idx];
        }
        return null;
    }
    // --- Subjects ---
    getSubjects(userId) {
        return this.data.subjects.filter(s => s.userId === userId);
    }
    getSubjectById(id) {
        return this.data.subjects.find(s => s.id === id);
    }
    addSubject(subject) {
        this.data.subjects.push(subject);
        this.save();
    }
    updateSubject(id, updates) {
        const idx = this.data.subjects.findIndex(s => s.id === id);
        if (idx !== -1) {
            this.data.subjects[idx] = { ...this.data.subjects[idx], ...updates };
            this.save();
            return this.data.subjects[idx];
        }
        return null;
    }
    deleteSubject(id) {
        this.data.subjects = this.data.subjects.filter(s => s.id !== id);
        this.save();
    }
    // --- Study Sessions ---
    getStudySessions(userId) {
        return this.data.studySessions.filter(s => s.userId === userId);
    }
    getStudySessionById(id) {
        return this.data.studySessions.find(s => s.id === id);
    }
    addStudySession(session) {
        this.data.studySessions.push(session);
        this.save();
    }
    updateStudySession(id, updates) {
        const idx = this.data.studySessions.findIndex(s => s.id === id);
        if (idx !== -1) {
            this.data.studySessions[idx] = { ...this.data.studySessions[idx], ...updates };
            this.save();
            return this.data.studySessions[idx];
        }
        return null;
    }
    deleteStudySession(id) {
        this.data.studySessions = this.data.studySessions.filter(s => s.id !== id);
        this.save();
    }
    // --- Assignments ---
    getAssignments(userId) {
        return this.data.assignments.filter(a => a.userId === userId);
    }
    getAssignmentById(id) {
        return this.data.assignments.find(a => a.id === id);
    }
    addAssignment(assignment) {
        this.data.assignments.push(assignment);
        this.save();
    }
    updateAssignment(id, updates) {
        const idx = this.data.assignments.findIndex(a => a.id === id);
        if (idx !== -1) {
            this.data.assignments[idx] = { ...this.data.assignments[idx], ...updates };
            this.save();
            return this.data.assignments[idx];
        }
        return null;
    }
    deleteAssignment(id) {
        this.data.assignments = this.data.assignments.filter(a => a.id !== id);
        this.save();
    }
    // --- Goals ---
    getGoals(userId) {
        return this.data.goals.filter(g => g.userId === userId);
    }
    addGoal(goal) {
        this.data.goals.push(goal);
        this.save();
    }
    updateGoal(id, updates) {
        const idx = this.data.goals.findIndex(g => g.id === id);
        if (idx !== -1) {
            this.data.goals[idx] = { ...this.data.goals[idx], ...updates };
            this.save();
            return this.data.goals[idx];
        }
        return null;
    }
    deleteGoal(id) {
        this.data.goals = this.data.goals.filter(g => g.id !== id);
        this.save();
    }
    // --- Reminders ---
    getReminders(userId) {
        return this.data.reminders.filter(r => r.userId === userId);
    }
    getAllPendingReminders() {
        return this.data.reminders.filter(r => !r.isCompleted && !r.isDismissed);
    }
    addReminder(reminder) {
        this.data.reminders.push(reminder);
        this.save();
    }
    updateReminder(id, updates) {
        const idx = this.data.reminders.findIndex(r => r.id === id);
        if (idx !== -1) {
            this.data.reminders[idx] = { ...this.data.reminders[idx], ...updates };
            this.save();
            return this.data.reminders[idx];
        }
        return null;
    }
    deleteReminder(id) {
        this.data.reminders = this.data.reminders.filter(r => r.id !== id);
        this.save();
    }
    // --- Notifications ---
    getNotifications(userId) {
        return this.data.notifications
            .filter(n => n.userId === userId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    addNotification(notification) {
        this.data.notifications.push(notification);
        this.save();
    }
    markNotificationAsRead(id) {
        const n = this.data.notifications.find(item => item.id === id);
        if (n) {
            n.isRead = true;
            this.save();
        }
    }
    clearAllNotifications(userId) {
        this.data.notifications = this.data.notifications.filter(n => n.userId !== userId);
        this.save();
    }
    // --- AI Tutor Conversations & Messages ---
    getConversations(userId) {
        return this.data.tutorConversations
            .filter(c => c.userId === userId)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    getConversationById(id) {
        const conv = this.data.tutorConversations.find(c => c.id === id);
        if (!conv)
            return null;
        const messages = this.data.tutorMessages
            .filter(m => m.conversationId === id)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        return { ...conv, messages };
    }
    addConversation(conv) {
        this.data.tutorConversations.push(conv);
        this.save();
    }
    updateConversation(id, updates) {
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
    deleteConversation(id) {
        this.data.tutorConversations = this.data.tutorConversations.filter(c => c.id !== id);
        this.data.tutorMessages = this.data.tutorMessages.filter(m => m.conversationId !== id);
        this.save();
    }
    addMessage(message) {
        this.data.tutorMessages.push(message);
        const conv = this.data.tutorConversations.find(c => c.id === message.conversationId);
        if (conv) {
            conv.updatedAt = new Date().toISOString();
        }
        this.save();
    }
    // --- Audit Logs ---
    addAuthAuditLog(log) {
        this.data.authAuditLogs.push(log);
        this.save();
    }
    getAuthAuditLogs(options) {
        let logs = [...this.data.authAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
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
    addAdminAuditLog(log) {
        this.data.adminAuditLogs.push(log);
        this.save();
    }
    getAdminAuditLogs(limit = 50, offset = 0) {
        const logs = [...this.data.adminAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        return {
            total: logs.length,
            logs: logs.slice(offset, offset + limit)
        };
    }
}
export const db = new Database();
