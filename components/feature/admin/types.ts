export interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalQuizzes: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: string | null;
  averageTimeSpentSeconds: string | null;
}

export interface AttemptRow {
  id: number;
  userName: string | null;
  userEmail: string | null;
  startedAt: string;
  completedAt: string | null;
  score: number | null;
  totalQuestions: number | null;
  correctAnswers: number | null;
  timeSpentSeconds: number | null;
}

export interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export interface LeaderboardRow {
  userId: number;
  userName: string | null;
  totalAttempts: number;
  averageScore: number | null;
  bestScore: number;
}

export interface DailyActivity {
  date: string;
  attempts: number;
  avgScore: number | null;
}

export interface ReportRow {
  id: number;
  name: string;
  format: string;
  status: string;
  params: string | null;
  createdAt: string;
  creatorName: string | null;
}

export const COLORS = ["#2563eb", "#16a34a", "#eab308", "#ef4444", "#8b5cf6"];

export const ROLE_BADGES: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  user: "bg-slate-100 text-slate-600 border-slate-200",
};
