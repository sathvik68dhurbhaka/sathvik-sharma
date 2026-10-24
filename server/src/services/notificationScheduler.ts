import { v4 as uuidv4 } from 'uuid';
import { db } from '../db/index.js';

export class NotificationScheduler {
  private timer: NodeJS.Timeout | null = null;
  private notifiedReminders = new Set<string>();
  private notifiedAssignments = new Set<string>();

  public start(intervalMs = 60000) {
    if (this.timer) return;
    console.log('[Scheduler] Notification background checker started.');
    this.check();
    this.timer = setInterval(() => this.check(), intervalMs);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private check() {
    try {
      const now = new Date();
      const nowIso = now.toISOString();

      // 1. Check Reminders
      const pendingReminders = db.getAllPendingReminders();
      for (const r of pendingReminders) {
        if (r.dateTime <= nowIso && !this.notifiedReminders.has(r.id)) {
          this.notifiedReminders.add(r.id);
          db.addNotification({
            id: uuidv4(),
            userId: r.userId,
            title: `Reminder: ${r.title}`,
            message: `Scheduled reminder triggered for: ${r.title}`,
            type: 'alert',
            isRead: false,
            createdAt: nowIso
          });
        }
      }

      // 2. Check Assignments Due in next 24 Hours
      const allUsers = db.getUsers();
      const in24Hours = new Date(now.getTime() + 24 * 3600000).toISOString();

      for (const user of allUsers) {
        const assignments = db.getAssignments(user.id);
        for (const a of assignments) {
          if (a.status !== 'completed') {
            const dueDateTime = `${a.dueDate}T${a.dueTime}:00`;
            if (dueDateTime <= in24Hours && dueDateTime >= nowIso) {
              const key = `${a.id}_${a.dueDate}`;
              if (!this.notifiedAssignments.has(key)) {
                this.notifiedAssignments.add(key);
                db.addNotification({
                  id: uuidv4(),
                  userId: user.id,
                  title: `Upcoming Deadline: ${a.title}`,
                  message: `Assignment "${a.title}" for ${a.subjectName} is due within 24 hours (${a.dueDate} at ${a.dueTime}).`,
                  type: 'warning',
                  isRead: false,
                  link: '/assignments',
                  createdAt: nowIso
                });
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('[Scheduler] Error during check cycle:', err);
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
