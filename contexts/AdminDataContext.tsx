import React, { createContext, useContext, useState, useMemo, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../lib/api";
import {
  Stats, AttemptRow, UserRow, LeaderboardRow, DailyActivity, ReportRow
} from "@/components/feature/admin/types";

interface AdminDataContextType {
  stats: Stats | null;
  attempts: AttemptRow[];
  users: UserRow[];
  leaderboard: LeaderboardRow[];
  dailyActivity: DailyActivity[];
  reportsList: ReportRow[];
  loading: boolean;
  error: string;
  roleFilter: "all" | "super_admin" | "admin" | "user";
  setRoleFilter: (v: "all" | "super_admin" | "admin" | "user") => void;
  userSearch: string;
  setUserSearch: (v: string) => void;
  userSort: { key: keyof UserRow; dir: "asc" | "desc" };
  setUserSort: (v: { key: keyof UserRow; dir: "asc" | "desc" }) => void;
  selectedUser: UserRow | null;
  setSelectedUser: (v: UserRow | null) => void;
  userDetailOpen: boolean;
  setUserDetailOpen: (v: boolean) => void;
  reportFormOpen: boolean;
  setReportFormOpen: (v: boolean) => void;
  generatingReport: boolean;
  fetchAll: () => Promise<void>;
  handleRoleChange: (userId: number, newRole: string) => Promise<void>;
  handleStatusToggle: (userId: number, currentActive: boolean) => Promise<void>;
  handleDeleteUser: (userId: number) => Promise<void>;
  handleGenerateReport: (name: string, format: string, params: any) => Promise<void>;
  handleDownloadReport: (report: ReportRow) => Promise<void>;
  openUserDetail: (user: UserRow) => void;
  filteredUsers: UserRow[];
  completionRate: string;
  scoreDistribution: { name: string; count: number }[];
  roleDistribution: { name: string; value: number }[];
  isSuperAdmin: boolean;
  isAdmin: boolean;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

interface AdminDataProviderProps {
  userRole: string;
  children: React.ReactNode;
}

export const AdminDataProvider: React.FC<AdminDataProviderProps> = ({ userRole, children }) => {
  const { t } = useTranslation();
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;

  const [stats, setStats] = useState<Stats | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "super_admin" | "admin" | "user">("all");
  const [userSearch, setUserSearch] = useState("");
  const [userSort, setUserSort] = useState<{ key: keyof UserRow; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [reportsList, setReportsList] = useState<ReportRow[]>([]);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, attemptsRes, usersRes, leaderboardRes, activityRes, reportsRes] = await Promise.all([
        api.admin.getStats(),
        api.admin.getAttempts(),
        api.admin.getUsers(),
        api.admin.getLeaderboard(),
        api.admin.getDailyActivity(),
        api.admin.getReports().catch(() => ({ reports: [] })),
      ]);
      setStats(statsRes);
      setAttempts(attemptsRes.attempts || []);
      setUsers(usersRes.users || []);
      setLeaderboard(leaderboardRes.leaderboard || []);
      setDailyActivity(activityRes.activity || []);
      setReportsList(reportsRes.reports || []);
    } catch (err: any) {
      setError(err.message || t('admin.errors.loadDashboard'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, [fetchAll]);

  const handleRoleChange = useCallback(async (userId: number, newRole: string) => {
    try {
      await api.admin.updateRole(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      alert(err.message || t('admin.errors.updateRole'));
    }
  }, []);

  const handleStatusToggle = useCallback(async (userId: number, currentActive: boolean) => {
    try {
      await api.admin.updateStatus(userId, { isActive: !currentActive });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u)));
    } catch (err: any) {
      alert(err.message || t('admin.errors.updateStatus'));
    }
  }, []);

  const handleDeleteUser = useCallback(async (userId: number) => {
    if (!confirm(t('admin.errors.deleteConfirm'))) return;
    try {
      await api.admin.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert(err.message || t('admin.errors.deleteUser'));
    }
  }, []);

  const handleGenerateReport = useCallback(async (name: string, format: string, params: any) => {
    try {
      setGeneratingReport(true);
      const res = await api.admin.generateReport({ name, format, params });
      setReportsList((prev) => [res.report, ...prev]);
      setReportFormOpen(false);
    } catch (err: any) {
      alert(err.message || t('admin.errors.generateReport'));
    } finally {
      setGeneratingReport(false);
    }
  }, []);

  const handleDownloadReport = useCallback(async (report: ReportRow) => {
    try {
      const res = await api.admin.downloadReport(report.id);
      if (!res.ok) throw new Error(t('admin.errors.downloadFailed'));
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name}.${report.format}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert(t('admin.errors.downloadReport'));
    }
  }, []);

  const openUserDetail = useCallback((user: UserRow) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  }, []);

  const filteredUsers = useMemo(() => {
    let list = roleFilter === "all" ? users : users.filter((u) => u.role === roleFilter);
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
    }
    list = [...list].sort((a, b) => {
      const { key, dir } = userSort;
      const av = a[key] ?? "";
      const bv = b[key] ?? "";
      if (av < bv) return dir === "asc" ? -1 : 1;
      if (av > bv) return dir === "asc" ? 1 : -1;
      return 0;
    });
    return list;
  }, [users, roleFilter, userSearch, userSort]);

  const completionRate = stats && stats.totalAttempts > 0
    ? ((stats.completedAttempts / stats.totalAttempts) * 100).toFixed(1)
    : "0";

  const scoreDistribution = useMemo(() => {
    const bins = [
      { name: "0-20%", count: 0 },
      { name: "21-40%", count: 0 },
      { name: "41-60%", count: 0 },
      { name: "61-80%", count: 0 },
      { name: "81-100%", count: 0 },
    ];
    attempts.forEach((a) => {
      if (a.score == null || a.totalQuestions == null) return;
      const pct = (a.score / a.totalQuestions) * 100;
      if (pct <= 20) bins[0].count++;
      else if (pct <= 40) bins[1].count++;
      else if (pct <= 60) bins[2].count++;
      else if (pct <= 80) bins[3].count++;
      else bins[4].count++;
    });
    return bins;
  }, [attempts]);

  const roleDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    users.forEach((u) => { counts[u.role] = (counts[u.role] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const value = useMemo(() => ({
    stats, attempts, users, leaderboard, dailyActivity, reportsList,
    loading, error, roleFilter, setRoleFilter, userSearch, setUserSearch,
    userSort, setUserSort, selectedUser, setSelectedUser, userDetailOpen, setUserDetailOpen,
    reportFormOpen, setReportFormOpen, generatingReport,
    fetchAll, handleRoleChange, handleStatusToggle, handleDeleteUser,
    handleGenerateReport, handleDownloadReport, openUserDetail,
    filteredUsers, completionRate, scoreDistribution, roleDistribution,
    isSuperAdmin, isAdmin,
  }), [
    stats, attempts, users, leaderboard, dailyActivity, reportsList,
    loading, error, roleFilter, userSearch, userSort, selectedUser, userDetailOpen,
    reportFormOpen, generatingReport, fetchAll, handleRoleChange, handleStatusToggle,
    handleDeleteUser, handleGenerateReport, handleDownloadReport, openUserDetail,
    filteredUsers, completionRate, scoreDistribution, roleDistribution,
    isSuperAdmin, isAdmin,
  ]);

  return (
    <AdminDataContext.Provider value={value}>
      {children}
    </AdminDataContext.Provider>
  );
};

export const useAdminData = () => {
  const context = useContext(AdminDataContext);
  if (!context) throw new Error("useAdminData must be used within AdminDataProvider");
  return context;
};
