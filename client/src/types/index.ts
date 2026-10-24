export type UserRole = 'student' | 'admin';
export type UserStatus = 'active' | 'disabled';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type SessionStatus = 'scheduled' | 'in_progress' | 'completed' | 'missed' | 'rescheduled';
export type AssignmentStatus = 'not_started' | 'in_progress' | 'completed';
export type TutorMode = 'general' | 'step_by_step' | 'summary' | 'quiz' | 'exam_prep';
export type ReminderType = 'study_session' | 'assignment' | 'goal' | 'custom' | 'revision';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLoginAt?: string;
  weeklyGoalHours: number;
  gradeLevel?: string;
  timezone?: string;
  notificationPreferences?: {
    browserEnabled: boolean;
    inAppEnabled: boolean;
    reminderMinutesBefore: number;
  };
}

export interface Subject {
  id: string;
  userId: string;
  name: string;
  code?: string;
  color: string;
  targetHoursPerWeek: number;
  topics: string[];
  createdAt: string;
}

export interface StudySession {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  topic: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  durationMinutes: number;
  actualMinutesCompleted: number;
  priority: Priority;
  status: SessionStatus;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface Assignment {
  id: string;
  userId: string;
  subjectId: string;
  subjectName: string;
  title: string;
  description: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  priority: Priority;
  status: AssignmentStatus;
  notes?: string;
  links?: string[];
  completedAt?: string;
  createdAt: string;
}

export interface AcademicGoal {
  id: string;
  userId: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  targetDate: string;
  category: 'grade' | 'exam' | 'hours' | 'milestone';
  targetValue: number;
  currentValue: number;
  unit: string;
  completed: boolean;
  createdAt: string;
}

export interface Reminder {
  id: string;
  userId: string;
  title: string;
  dateTime: string;
  type: ReminderType;
  relatedId?: string;
  isCompleted: boolean;
  isDismissed: boolean;
  createdAt: string;
}

export interface InAppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'alert' | 'success';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TutorMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  quizData?: {
    title: string;
    questions: QuizQuestion[];
  };
}

export interface TutorConversation {
  id: string;
  userId: string;
  title: string;
  subjectId?: string;
  subjectName?: string;
  mode: TutorMode;
  createdAt: string;
  updatedAt: string;
  messages?: TutorMessage[];
}

export interface AuthAuditLog {
  id: string;
  userId?: string;
  email: string;
  eventType: 'login_success' | 'login_failure' | 'register' | 'logout' | 'password_reset_request' | 'password_reset_success';
  status: 'success' | 'failure';
  ip?: string;
  userAgent?: string;
  description: string;
  timestamp: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminEmail: string;
  action: 'update_user_role' | 'update_user_status' | 'delete_user' | 'export_users' | 'system_config';
  targetUserId?: string;
  targetUserEmail?: string;
  details: string;
  timestamp: string;
}

export interface DashboardMetrics {
  totalHoursCompletedThisWeek: number;
  weeklyGoalHours: number;
  weeklyProgressPercent: number;
  tasksCompletionPercent: number;
  totalAssignmentsCount: number;
  completedAssignmentsCount: number;
  pendingTasksCount: number;
  overdueTasksCount: number;
  todaySessionsCount: number;
  todayStudyMinutesCompleted: number;
  todayTargetMinutes: number;
  currentStreakDays: number;
}

export interface SubjectPrediction {
  subjectId: string;
  subjectName: string;
  color: string;
  predictedScore: number;
  letterGrade: string;
  masteryPercentage: number;
  riskStatus: 'low_risk' | 'moderate_risk' | 'high_risk';
  actualHoursSpent: number;
  targetHours: number;
  gapHours: number;
  recommendation: string;
}

export interface PredictionInsight {
  id: string;
  type: 'opportunity' | 'warning' | 'achievement' | 'tip';
  title: string;
  description: string;
  impactScorePercent: number;
  actionableStep: string;
}

export interface AcademicPredictionReport {
  overallReadinessPercentage: number;
  projectedGpaEquivalent: string;
  examReadinessStatus: 'Exam Ready' | 'On Track' | 'Needs Attention' | 'Critical Intervention';
  onTimeAssignmentProbability: number;
  studyConsistencyScore: number;
  burnoutRiskPercentage: number;
  burnoutStatus: 'Optimal' | 'Mild Fatigue' | 'High Risk';
  subjectPredictions: SubjectPrediction[];
  insights: PredictionInsight[];
  projectedVelocity: {
    currentHoursPerWeek: number;
    recommendedHoursPerWeek: number;
    completionVelocityTrend: 'accelerating' | 'steady' | 'declining';
  };
  generatedAt: string;
}
