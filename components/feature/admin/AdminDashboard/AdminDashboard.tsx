import React, { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area
} from "recharts";
import { api } from "@/lib/api";

interface AdminDashboardProps {
  userRole: string;
}

interface Stats {
  totalUsers: number;
  activeUsers: number;
  totalQuizzes: number;
  totalAttempts: number;
  completedAttempts: number;
  averageScore: string | null;
  averageTimeSpentSeconds: string | null;
}

interface AttemptRow {
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

interface UserRow {
  id: number;
  email: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface LeaderboardRow {
  userId: number;
  userName: string | null;
  totalAttempts: number;
  averageScore: number | null;
  bestScore: number;
}

interface DailyActivity {
  date: string;
  attempts: number;
  avgScore: number | null;
}

interface ReportRow {
  id: number;
  name: string;
  format: string;
  status: string;
  params: string | null;
  createdAt: string;
  creatorName: string | null;
}

const COLORS = ["#2563eb", "#16a34a", "#eab308", "#ef4444", "#8b5cf6"];

const ROLE_BADGES: Record<string, string> = {
  super_admin: "bg-purple-100 text-purple-700 border-purple-200",
  admin: "bg-blue-100 text-blue-700 border-blue-200",
  user: "bg-slate-100 text-slate-600 border-slate-200",
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ userRole }) => {
  const { t, i18n } = useTranslation();
  const language = i18n.language as "en" | "id";
  const isSuperAdmin = userRole === "super_admin";
  const isAdmin = userRole === "admin" || isSuperAdmin;
  const [stats, setStats] = useState<Stats | null>(null);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<"overview" | "attempts" | "users" | "leaderboard" | "reports">("overview");
  const [roleFilter, setRoleFilter] = useState<"all" | "super_admin" | "admin" | "user">("all");
  const [userSearch, setUserSearch] = useState("");
  const [userSort, setUserSort] = useState<{ key: keyof UserRow; dir: "asc" | "desc" }>({ key: "createdAt", dir: "desc" });
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [userDetailOpen, setUserDetailOpen] = useState(false);
  const [reportsList, setReportsList] = useState<ReportRow[]>([]);
  const [reportFormOpen, setReportFormOpen] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);

  const fetchAll = async () => {
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
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      await api.admin.updateRole(userId, { role: newRole });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
    } catch (err: any) {
      alert(err.message || t('admin.errors.updateRole'));
    }
  };

  const handleStatusToggle = async (userId: number, currentActive: boolean) => {
    try {
      await api.admin.updateStatus(userId, { isActive: !currentActive });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, isActive: !currentActive } : u)));
    } catch (err: any) {
      alert(err.message || t('admin.errors.updateStatus'));
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!confirm(t('admin.errors.deleteConfirm'))) return;
    try {
      await api.admin.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err: any) {
      alert(err.message || t('admin.errors.deleteUser'));
    }
  };

  const handleGenerateReport = async (name: string, format: string, params: any) => {
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
  };

  const handleDownloadReport = async (report: ReportRow) => {
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
  };

  const openUserDetail = (user: UserRow) => {
    setSelectedUser(user);
    setUserDetailOpen(true);
  };

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
    return Object.entries(counts)
      .filter(([name]) => name !== "super_admin")
      .map(([name, value]) => ({ name, value }));
  }, [users]);

  const toggleSort = (key: keyof UserRow) => {
    setUserSort((prev) => ({ key, dir: prev.key === key && prev.dir === "asc" ? "desc" : "asc" }));
  };

  const SortIcon = ({ column }: { column: keyof UserRow }) => {
    if (userSort.key !== column) return <span className="text-slate-300 ml-1">↕</span>;
    return <span className="text-blue-600 ml-1">{userSort.dir === "asc" ? "↑" : "↓"}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50/50">
        <div className="flex flex-col items-center gap-4">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">{t('admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50/50">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-10 max-w-md text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">{t('admin.error')}</h3>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={fetchAll} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-200 active:scale-95">
            {t('admin.retry')}
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview" as const, icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
    { id: "users" as const, icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
    { id: "attempts" as const, icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" },
    { id: "leaderboard" as const, icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
    { id: "reports" as const, icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 animate-in fade-in duration-500">
      <div className="w-full mx-auto px-4 py-8 flex gap-6">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0 hidden lg:block">
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 sticky top-8">
            <div className="flex items-center gap-4 px-2 py-6 mb-6 border-b border-slate-50">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-200">A</div>
              <div>
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">{t('admin.console')}</h2>
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userRole === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + userRole)}</p>
                </div>
              </div>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${activeTab === tab.id ? "scale-110" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                  {t(`admin.tabs.${tab.id}`)}
                </button>
              ))}
            </nav>
            <div className="mt-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('admin.systemStatus')}</p>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                {t('admin.allSystemsOperational')}
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 z-50 px-2 py-2 flex justify-around">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg ${activeTab === tab.id ? "text-blue-600" : "text-slate-400"}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
              <span className="text-[10px] font-bold">{t(`admin.tabs.${tab.id}`)}</span>
            </button>
          ))}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t(`admin.tabs.${activeTab}`)}</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">
              {t(`admin.tabDescriptions.${activeTab}`)}
            </p>
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === "overview" && stats && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard icon="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" label={t('admin.stats.totalUsers')} value={stats.totalUsers} accent="blue" trend={{ value: "12%", positive: true }} />
                <StatCard icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" label={t('admin.stats.activeUsers')} value={stats.activeUsers} accent="emerald" trend={{ value: "5%", positive: true }} />
                <StatCard icon="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" label={t('admin.stats.attempts')} value={stats.totalAttempts} accent="indigo" trend={{ value: "8%", positive: true }} />
                <StatCard icon="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" label={t('admin.stats.avgScore')} value={stats.averageScore ? `${stats.averageScore}%` : "N/A"} accent="amber" />
                <StatCard icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" label={t('admin.stats.completion')} value={`${completionRate}%`} accent="rose" trend={{ value: "3%", positive: false }} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <ChartCard title={t('admin.charts.dailyActivity')}>
                  <ResponsiveContainer width="100%" height={260}>
                    <AreaChart data={dailyActivity}>
                      <defs><linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.15}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <ReTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Area type="monotone" dataKey="attempts" stroke="#2563eb" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAttempts)" dot={{ r: 3, fill: "#2563eb", strokeWidth: 0 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('admin.charts.scoreDistribution')}>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={scoreDistribution} barCategoryGap="20%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                      <ReTooltip cursor={{ fill: "#f8fafc", radius: 8 }} contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                      <Bar dataKey="count" fill="#2563eb" radius={[8, 8, 0, 0]} maxBarSize={48} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('admin.charts.roleDistribution')}>
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={roleDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none" paddingAngle={4}>
                        {roleDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                      <ReTooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard title={t('admin.charts.topPerformers')}>
                  <div className="space-y-3 pt-2">
                    {leaderboard.slice(0, 5).map((entry, idx) => (
                      <div key={entry.userId} className="flex items-center justify-between p-3 bg-slate-50/80 hover:bg-slate-100 rounded-xl transition-colors">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-black ${
                            idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"
                          }`}>{idx + 1}</span>
                          <div>
                            <span className="text-sm font-bold text-slate-800">{entry.userName || t('admin.anonymous')}</span>
                            <span className="text-xs text-slate-400 ml-2">{entry.totalAttempts} {t('admin.attemptsCount')}</span>
                          </div>
                        </div>
                        <span className="text-lg font-black text-blue-600">{entry.bestScore}</span>
                      </div>
                    ))}
                  </div>
                </ChartCard>
              </div>
            </div>
          )}

          {/* ── Users Tab ── */}
          {activeTab === "users" && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  <input
                    type="text"
                    placeholder={t('admin.searchUsers')}
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
                <div className="flex p-1 bg-slate-100 rounded-2xl">
                  {(["all", "super_admin", "admin", "user"] as const).map((r) => (
                    <button key={r} onClick={() => setRoleFilter(r)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${roleFilter === r ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
                      {r === "all" ? t('admin.roles.all') : r === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + r)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50/50">
                        {(["name", "email", "role", "isActive", "createdAt"] as (keyof UserRow)[]).map((col) => (
                          <th key={col} onClick={() => toggleSort(col)} className="text-left px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 cursor-pointer hover:text-slate-600 select-none transition-colors">
                            <span className="flex items-center gap-2">{col === "isActive" ? t('admin.tableHeaders.status') : col === "createdAt" ? t('admin.tableHeaders.joined') : t('admin.tableHeaders.' + col)} <SortIcon column={col} /></span>
                          </th>
                        ))}
                        <th className="text-right px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('admin.tableHeaders.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-slate-50/50 transition-all duration-300">
                          <td className="px-6 py-5">
                            <button onClick={() => openUserDetail(u)} className="flex items-center gap-4 text-left group/btn">
                              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-blue-600 font-black text-sm group-hover/btn:scale-110 transition-transform">{u.name.charAt(0).toUpperCase()}</div>
                              <div>
                                <span className="block font-black text-slate-800 group-hover/btn:text-blue-600 transition-colors">{u.name}</span>
                                <span className="text-[10px] font-bold text-slate-400">{t('admin.idLabel', { id: u.id })}</span>
                              </div>
                            </button>
                          </td>
                          <td className="px-6 py-5 text-slate-500 font-medium">{u.email}</td>
                          <td className="px-6 py-5">
                            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${ROLE_BADGES[u.role] || ROLE_BADGES.user}`}>{u.role === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + u.role)}</span>
                          </td>
                          <td className="px-6 py-5">
                            <span className={`inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${u.isActive ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-rose-50 text-rose-600 border-rose-100"}`}>
                              <span className={`w-2 h-2 rounded-full animate-pulse ${u.isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                              {u.isActive ? t('admin.status.active') : t('admin.status.suspended')}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-slate-400 font-medium text-xs">{new Date(u.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: "short", day: "numeric", year: "numeric" })}</td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                              {isSuperAdmin && (
                                <select
                                  value={u.role}
                                  onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                  className="text-[10px] font-black uppercase tracking-widest border-2 border-slate-100 rounded-xl px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white cursor-pointer hover:border-blue-200 transition-all"
                                >
                                  <option value="user">{t('admin.roles.user')}</option>
                                  <option value="admin">{t('admin.roles.admin')}</option>
                                  <option value="super_admin">{t('admin.roles.superAdmin')}</option>
                                </select>
                              )}
                              {(isSuperAdmin || (isAdmin && u.role === "user")) && u.id !== (selectedUser?.id ?? 0) && (
                                <button
                                  onClick={() => handleStatusToggle(u.id, u.isActive)}
                                  className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${u.isActive ? "bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white" : "bg-emerald-50 text-emerald-500 hover:bg-emerald-500 hover:text-white"}`}
                                  title={u.isActive ? t('admin.actions.suspendAccount') : t('admin.actions.activateAccount')}
                                >
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={u.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} /></svg>
                                </button>
                              )}
                              {isSuperAdmin && (
                                <button onClick={() => handleDeleteUser(u.id)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white transition-all" title={t('admin.actions.deleteAccount')}>
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800">{t('admin.noUsersFound')}</h4>
                      <p className="text-sm text-slate-400">{t('admin.adjustSearchFilters')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Attempts Tab ── */}
          {activeTab === "attempts" && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.user')}</th>
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.started')}</th>
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.status')}</th>
                    <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.score')}</th>
                    <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.time')}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {attempts.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <div className="font-bold text-slate-800">{a.userName || t('admin.guest')}</div>
                          <div className="text-xs text-slate-400">{a.userEmail || "—"}</div>
                        </td>
                        <td className="px-5 py-4 text-slate-500 text-xs">{new Date(a.startedAt).toLocaleDateString()}</td>
                        <td className="px-5 py-4">
                          {a.completedAt ? (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">{t('admin.finalResult')}</span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">{t('admin.inProgress')}</span>
                          )}
                        </td>
                        <td className="px-5 py-4 text-right font-bold text-slate-800">{a.score != null ? `${a.score}/${a.totalQuestions}` : "—"}</td>
                        <td className="px-5 py-4 text-right text-slate-500 text-xs">{a.timeSpentSeconds ? `${a.timeSpentSeconds}s` : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Leaderboard Tab ── */}
          {activeTab === "leaderboard" && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-slate-100">
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.rank')}</th>
                    <th className="text-left px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.user')}</th>
                    <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.attempts')}</th>
                    <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.avgScore')}</th>
                    <th className="text-right px-5 py-4 text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.best')}</th>
                  </tr></thead>
                  <tbody className="divide-y divide-slate-50">
                    {leaderboard.map((entry, idx) => (
                      <tr key={entry.userId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-black ${idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-slate-200 text-slate-700" : idx === 2 ? "bg-orange-100 text-orange-700" : "bg-slate-100 text-slate-400"}`}>{idx + 1}</span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-800">{entry.userName || t('admin.anonymous')}</td>
                        <td className="px-5 py-4 text-right text-slate-500">{entry.totalAttempts}</td>
                        <td className="px-5 py-4 text-right font-bold text-slate-700">{entry.averageScore ? Number(entry.averageScore).toFixed(1) : "—"}</td>
                        <td className="px-5 py-4 text-right font-black text-blue-600 text-lg">{entry.bestScore}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Reports Tab ── */}
          {activeTab === "reports" && (
            <div className="space-y-8">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-lg font-black text-slate-900 tracking-tight">{t('admin.reportGenerator')}</h3>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.exportSystemData')}</p>
                  </div>
                  <button onClick={() => setReportFormOpen((v) => !v)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportFormOpen ? "bg-rose-50 text-rose-500" : "bg-blue-50 text-blue-600"}`}>
                    {reportFormOpen ? t('admin.cancel') : t('admin.createNew')}
                    <svg className={`w-4 h-4 transition-transform duration-300 ${reportFormOpen ? "rotate-45" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                {reportFormOpen && (
                  <div className="animate-in slide-in-from-top-4 duration-300">
                    <ReportForm onGenerate={handleGenerateReport} loading={generatingReport} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{t('admin.generatedArchive')}</h3>
                </div>
                {reportsList.length === 0 ? (
                  <div className="py-20 text-center flex flex-col items-center gap-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <p className="text-sm font-bold text-slate-400">{t('admin.noReports')}</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50/30">
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.name')}</th>
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.format')}</th>
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.status')}</th>
                          <th className="text-left px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.generated')}</th>
                          <th className="text-right px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">{t('admin.tableHeaders.actions')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {reportsList.map((r) => (
                          <tr key={r.id} className="group hover:bg-slate-50/50 transition-colors">
                            <td className="px-8 py-6 font-black text-slate-800">{r.name}</td>
                            <td className="px-8 py-6">
                              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 border-2 border-slate-200/50">{r.format.toUpperCase()}</span>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${
                                r.status === "ready" ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                r.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                "bg-rose-50 text-rose-700 border-rose-100"
                              }`}>{t('admin.reportStatus.' + r.status)}</span>
                            </td>
                            <td className="px-8 py-6 text-slate-400 font-medium text-xs">{new Date(r.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: "short", day: "numeric", year: "numeric" })}</td>
                            <td className="px-8 py-6 text-right">
                              <div className="flex items-center justify-end gap-3">
                                {r.status === "ready" && (
                                  <button onClick={() => handleDownloadReport(r)} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95">{t('admin.download')}</button>
                                )}
                                {isSuperAdmin && (
                                  <button onClick={() => api.admin.getReportAccessLogs(r.id).then((res) => alert(`${t('admin.downloads')}: ${res.logs?.length || 0}`))} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all" title={t('admin.accessLogs')}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.708 0 3.305.429 4.704 1.185M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* User Detail Modal */}
      {userDetailOpen && selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setUserDetailOpen(false)} />
      )}
    </div>
  );
};

function StatCard({ icon, label, value, accent, trend }: { icon: string; label: string; value: string | number; accent: string; trend?: { value: string; positive: boolean } }) {
  const gradients: Record<string, string> = {
    blue: "from-blue-600 to-indigo-600 shadow-blue-200",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-200",
    indigo: "from-indigo-600 to-violet-600 shadow-indigo-200",
    amber: "from-amber-500 to-orange-600 shadow-amber-200",
    rose: "from-rose-500 to-pink-600 shadow-rose-200",
  };
  return (
    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-300 group">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${gradients[accent]} flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} /></svg>
        </div>
        {trend && (
          <div className={`px-2 py-1 rounded-lg text-[10px] font-black flex items-center gap-1 ${trend.positive ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"}`}>
            {trend.positive ? "↑" : "↓"} {trend.value}
          </div>
        )}
      </div>
      <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.15em] mb-1">{label}</p>
      <p className="text-3xl font-black text-slate-900 tracking-tight">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-500">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{title}</h3>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/20"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/40"></div>
          <div className="w-1.5 h-1.5 rounded-full bg-blue-600/60"></div>
        </div>
      </div>
      {children}
    </div>
  );
}

function ReportForm({ onGenerate, loading }: { onGenerate: (name: string, format: string, params: any) => void; loading: boolean }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [format, setFormat] = useState("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [segment, setSegment] = useState("all");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onGenerate(name, format, { dateFrom: dateFrom || undefined, dateTo: dateTo || undefined, userSegment: segment });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.reportName')}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder={t('admin.reportForm.reportNamePlaceholder')} required />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.format')}</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
            <option value="csv">{t('admin.reportForm.csv')}</option>
            <option value="pdf">{t('admin.reportForm.pdf')}</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.dateFrom')}</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.dateTo')}</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{t('admin.reportForm.userSegment')}</label>
        <select value={segment} onChange={(e) => setSegment(e.target.value)} className="w-full sm:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white">
          <option value="all">{t('admin.reportForm.allUsers')}</option>
          <option value="user">{t('admin.reportForm.regularUsersOnly')}</option>
          <option value="admin">{t('admin.reportForm.adminsOnly')}</option>
        </select>
      </div>
      <button type="submit" disabled={loading} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-bold rounded-xl transition-colors">
        {loading ? t('admin.reportForm.generating') : t('admin.reportForm.generateReport')}
      </button>
    </form>
  );
}

function UserDetailModal({ user, onClose }: { user: UserRow; onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language as "en" | "id";
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin.getUser(user.id).then((res) => { setDetail(res); setLoading(false); }).catch(() => setLoading(false));
  }, [user.id]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose} />
      <div className="relative bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-300 flex flex-col">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">{t('admin.userDetail.title')}</h3>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-1">{t('admin.userDetail.subtitle')}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-white hover:bg-rose-50 hover:text-rose-500 rounded-2xl shadow-sm transition-all duration-300">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">{t('admin.userDetail.syncing')}</p>
            </div>
          ) : detail ? (
            <div className="space-y-8">
              <div className="flex flex-col sm:flex-row items-center gap-8 bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-black text-5xl shadow-2xl shadow-blue-200">
                  {detail.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-center sm:text-left space-y-2">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">{detail.user.name}</h4>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl border-2 ${ROLE_BADGES[detail.user.role] || ROLE_BADGES.user}`}>{detail.user.role === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + detail.user.role)}</span>
                  </div>
                  <p className="text-lg font-medium text-slate-500">{detail.user.email}</p>
                  <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${detail.user.isActive ? "bg-emerald-500" : "bg-rose-500"}`}></span>
                    {detail.user.isActive ? t('admin.userDetail.accountActive') : t('admin.userDetail.accountSuspended')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl p-6 text-center border-2 border-slate-50 shadow-sm">
                  <div className="text-4xl font-black text-slate-900">{detail.attempts?.length || 0}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('admin.userDetail.attempts')}</div>
                </div>
                <div className="bg-white rounded-3xl p-6 text-center border-2 border-slate-50 shadow-sm">
                  <div className="text-4xl font-black text-emerald-600">{detail.attempts?.filter((a: any) => a.completedAt).length || 0}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{t('admin.userDetail.completed')}</div>
                </div>
                <div className="bg-white rounded-3xl p-6 text-center border-2 border-slate-50 shadow-sm">
                  <div className="text-xl font-black text-slate-900 py-3">{new Date(detail.user.createdAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: "short", year: "numeric" })}</div>
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('admin.userDetail.joined')}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h5 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{t('admin.userDetail.recentActivity')}</h5>
                  <div className="h-px flex-1 bg-slate-100 mx-6"></div>
                </div>
                {detail.attempts && detail.attempts.length > 0 ? (
                  <div className="space-y-3">
                    {detail.attempts.slice(0, 5).map((a: any) => (
                      <div key={a.id} className="group flex items-center justify-between p-5 bg-white hover:bg-slate-50 rounded-[1.5rem] border-2 border-slate-50 transition-all duration-300">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${a.completedAt ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" /></svg>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 text-sm">{t('admin.userDetail.attemptNumber', { id: a.id })}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(a.startedAt).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-black text-slate-900">{a.score != null ? `${a.score}/${a.totalQuestions}` : "—"}</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">{a.completedAt ? t('admin.finalResult') : t('admin.inProgress')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <p className="text-sm font-bold text-slate-400">{t('admin.userDetail.noActivity')}</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-slate-500 font-bold">{t('admin.userDetail.loadError')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
