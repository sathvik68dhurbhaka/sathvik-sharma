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
  DashboardMetrics,
  AuthAuditLog,
  AdminAuditLog,
  TutorMode
} from '../types/index.js';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('token');
  if (token) {
    return { Authorization: `Bearer ${token}` };
  }
  return {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || response.statusText || 'Request failed';
    throw new ApiError(errorMsg, response.status);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: { name: string; email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  login: (payload: { email: string; password: string }) =>
    request<{ message: string; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  logout: () =>
    request<{ message: string }>('/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    request<{ message: string; resetToken?: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    }),

  resetPassword: (payload: { token: string; newPassword: string }) =>
    request<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getMe: () =>
    request<{ user: User }>('/auth/me'),

  updateProfile: (updates: Partial<User>) =>
    request<{ message: string; user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  // Subjects
  getSubjects: () =>
    request<{ subjects: Subject[] }>('/subjects'),

  createSubject: (payload: Partial<Subject>) =>
    request<{ subject: Subject }>('/subjects', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateSubject: (id: string, updates: Partial<Subject>) =>
    request<{ subject: Subject }>(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteSubject: (id: string) =>
    request<{ message: string }>(`/subjects/${id}`, { method: 'DELETE' }),

  // Study Sessions
  getSessions: (query?: { date?: string; startDate?: string; endDate?: string; subjectId?: string }) => {
    const params = new URLSearchParams(query as Record<string, string>).toString();
    return request<{ sessions: StudySession[] }>(`/sessions${params ? `?${params}` : ''}`);
  },

  createSession: (payload: Partial<StudySession>) =>
    request<{ session: StudySession }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateSession: (id: string, updates: Partial<StudySession>) =>
    request<{ session: StudySession }>(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  completeSession: (id: string, minutesCompleted?: number) =>
    request<{ session: StudySession; message: string }>(`/sessions/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify({ minutesCompleted })
    }),

  rescheduleSession: (id: string, newDate: string, newStartTime: string, newEndTime: string) =>
    request<{ session: StudySession; message: string }>(`/sessions/${id}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ newDate, newStartTime, newEndTime })
    }),

  deleteSession: (id: string) =>
    request<{ message: string }>(`/sessions/${id}`, { method: 'DELETE' }),

  // Assignments
  getAssignments: (query?: { status?: string; subjectId?: string; priority?: string }) => {
    const params = new URLSearchParams(query as Record<string, string>).toString();
    return request<{ assignments: Assignment[] }>(`/assignments${params ? `?${params}` : ''}`);
  },

  createAssignment: (payload: Partial<Assignment>) =>
    request<{ assignment: Assignment }>('/assignments', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateAssignment: (id: string, updates: Partial<Assignment>) =>
    request<{ assignment: Assignment }>(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteAssignment: (id: string) =>
    request<{ message: string }>(`/assignments/${id}`, { method: 'DELETE' }),

  // Goals
  getGoals: () =>
    request<{ goals: AcademicGoal[] }>('/goals'),

  createGoal: (payload: Partial<AcademicGoal>) =>
    request<{ goal: AcademicGoal }>('/goals', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  updateGoal: (id: string, updates: Partial<AcademicGoal>) =>
    request<{ goal: AcademicGoal }>(`/goals/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    }),

  deleteGoal: (id: string) =>
    request<{ message: string }>(`/goals/${id}`, { method: 'DELETE' }),

  // Reminders
  getReminders: () =>
    request<{ reminders: Reminder[] }>('/reminders'),

  createReminder: (payload: Partial<Reminder>) =>
    request<{ reminder: Reminder }>('/reminders', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  completeReminder: (id: string) =>
    request<{ reminder: Reminder }>(`/reminders/${id}/complete`, { method: 'POST' }),

  dismissReminder: (id: string) =>
    request<{ reminder: Reminder }>(`/reminders/${id}/dismiss`, { method: 'POST' }),

  deleteReminder: (id: string) =>
    request<{ message: string }>(`/reminders/${id}`, { method: 'DELETE' }),

  // Notifications
  getNotifications: () =>
    request<{ notifications: InAppNotification[]; unreadCount: number }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ message: string }>(`/notifications/${id}/read`, { method: 'POST' }),

  clearNotifications: () =>
    request<{ message: string }>('/notifications/clear', { method: 'DELETE' }),

  // Analytics
  getAnalytics: () =>
    request<{
      metrics: DashboardMetrics;
      charts: {
        dailyStudyHours: { day: string; date: string; hours: number; minutes: number }[];
        studyTimeBySubject: { name: string; hours: number; color?: string }[];
        assignmentsStatus: { completed: number; pending: number; overdue: number };
        goalsStatus: { completed: number; active: number; rate: number };
      };
    }>('/analytics'),

  // AI
  getAiStatus: () =>
    request<{
      status: {
        configured: boolean;
        primaryProvider: string;
        geminiConfigured: boolean;
        openaiConfigured: boolean;
        model: string;
      };
    }>('/ai/status'),

  // AI Academic Predictor & Exam Success Engine
  getAiPredictions: () =>
    request<{ report: import('../types/index.js').AcademicPredictionReport }>('/ai/predictions'),

  runPredictionSimulation: (payload: {
    addedHoursPerWeek?: number;
    targetedSubjectId?: string;
    assignmentEarlyBoost?: boolean;
  }) =>
    request<{ report: import('../types/index.js').AcademicPredictionReport }>('/ai/predict-simulation', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  getConversations: () =>
    request<{ conversations: TutorConversation[] }>('/ai/conversations'),

  getConversation: (id: string) =>
    request<{ conversation: TutorConversation }>('/ai/conversations/' + id),

  deleteConversation: (id: string) =>
    request<{ message: string }>('/ai/conversations/' + id, { method: 'DELETE' }),

  sendTutorMessage: (payload: {
    conversationId?: string;
    message: string;
    mode: TutorMode;
    subjectId?: string;
    subjectName?: string;
  }) =>
    request<{
      conversationId: string;
      message: TutorMessage;
      provider: string;
      modelUsed: string;
    }>('/ai/tutor', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  generatePlan: (payload: {
    availableHoursPerDay: number;
    startDate: string;
    endDate: string;
    examDates?: { subjectName: string; examDate: string }[];
    weakAreas?: string[];
    preferredStartTime?: string;
  }) =>
    request<{
      summary: string;
      reasoning: string;
      plan: {
        subjectName: string;
        topic: string;
        date: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        priority: 'low' | 'medium' | 'high' | 'urgent';
        reasoning: string;
      }[];
    }>('/ai/generate-plan', {
      method: 'POST',
      body: JSON.stringify(payload)
    }),

  applyPlan: (sessions: any[]) =>
    request<{ message: string; sessions: StudySession[] }>('/ai/apply-plan', {
      method: 'POST',
      body: JSON.stringify({ sessions })
    }),

  // Admin
  getAdminOverview: () =>
    request<{
      metrics: {
        totalUsers: number;
        totalStudents: number;
        totalAdmins: number;
        activeAccounts: number;
        disabledAccounts: number;
        activeInLast7Days: number;
        totalLoginsRecorded: number;
      };
      registrationTrend: { date: string; count: number }[];
      recentSuccessfulLogins: AuthAuditLog[];
      recentFailedLogins: AuthAuditLog[];
      recentActivity: AuthAuditLog[];
      latestAdminActions: AdminAuditLog[];
    }>('/admin/overview'),

  getAdminUsers: (params?: { search?: string; role?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{
      users: User[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/users${query ? `?${query}` : ''}`);
  },

  getAdminUserDetails: (id: string) =>
    request<{
      user: User;
      stats: {
        totalSessions: number;
        completedSessions: number;
        totalAssignments: number;
        completedAssignments: number;
        subjectsCount: number;
      };
    }>(`/admin/users/${id}`),

  updateUserStatus: (id: string, status: 'active' | 'disabled') =>
    request<{ message: string; user: User }>(`/admin/users/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    }),

  updateUserRole: (id: string, role: 'student' | 'admin') =>
    request<{ message: string; user: User }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    }),

  getAuditLogs: (params?: { type?: 'auth' | 'admin'; email?: string; eventType?: string; status?: string; page?: number; limit?: number }) => {
    const query = new URLSearchParams(params as any).toString();
    return request<{
      logs: any[];
      pagination: { total: number; page: number; limit: number; totalPages: number };
    }>(`/admin/audit-logs${query ? `?${query}` : ''}`);
  },

  downloadUsersCsv: async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_BASE}/admin/export-users`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!response.ok) throw new Error('Failed to export CSV');
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registered_users_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};
