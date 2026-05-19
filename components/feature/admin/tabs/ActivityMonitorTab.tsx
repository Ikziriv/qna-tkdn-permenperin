import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Spinner } from "@/components/ui";

interface ActivityStats {
  totalActivityEvents: number;
  totalOnboardingSessions: number;
  totalQuizAnswerLogs: number;
  onboardingCompleted: number;
  onboardingAbandoned: number;
}

interface ActivityEvent {
  id: number;
  eventType: string;
  userId: number | null;
  sessionId: string | null;
  payload: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface OnboardingSession {
  id: number;
  sessionToken: string;
  userId: number | null;
  name: string | null;
  role: string | null;
  completionStatus: string;
  startedAt: string;
  completedAt: string | null;
  abandonedAt: string | null;
}

interface QuizAnswerLog {
  id: number;
  attemptId: number | null;
  sessionToken: string | null;
  questionId: number;
  selectedAnswerIndex: number;
  isCorrect: boolean;
  answeredAt: string;
}

type TabView = "events" | "onboarding" | "quiz-answers";

const ActivityMonitorTab: React.FC = () => {
  const { t } = useTranslation();
  const { authUser } = useAuth();
  const isSuperAdmin = authUser?.role === "super_admin";

  const [activeView, setActiveView] = useState<TabView>("events");
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [onboardingSessions, setOnboardingSessions] = useState<OnboardingSession[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<QuizAnswerLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const [eventTypeFilter, setEventTypeFilter] = useState("");
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      const data = await api.admin.getActivityStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load stats");
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.admin.getActivityEvents(
        eventTypeFilter ? { eventType: eventTypeFilter, limit: 100 } : { limit: 100 }
      );
      setEvents(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load events");
    } finally {
      setLoading(false);
    }
  }, [eventTypeFilter]);

  const fetchOnboarding = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.admin.getOnboardingSessions(
        onboardingStatusFilter ? { status: onboardingStatusFilter, limit: 100 } : { limit: 100 }
      );
      setOnboardingSessions(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load onboarding sessions");
    } finally {
      setLoading(false);
    }
  }, [onboardingStatusFilter]);

  const fetchQuizAnswers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await api.admin.getQuizAnswerLogs({ limit: 100 });
      setQuizAnswers(data.items || []);
    } catch (err: any) {
      setError(err.message || "Failed to load quiz answers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeView === "events") fetchEvents();
    if (activeView === "onboarding") fetchOnboarding();
    if (activeView === "quiz-answers") fetchQuizAnswers();
  }, [activeView, fetchEvents, fetchOnboarding, fetchQuizAnswers]);

  const handlePurge = async () => {
    if (!window.confirm(t("admin.activity.confirmPurge"))) return;
    setLoading(true);
    try {
      const result = await api.admin.purgeActivityData();
      setActionMessage(
        `Purged ${result.deleted.activityEvents} events, ${result.deleted.onboardingSessions} onboarding sessions, ${result.deleted.quizAnswerLogs} quiz answers.`
      );
      await fetchStats();
      if (activeView === "events") fetchEvents();
      if (activeView === "onboarding") fetchOnboarding();
      if (activeView === "quiz-answers") fetchQuizAnswers();
    } catch (err: any) {
      setError(err.message || "Purge failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm(t("admin.activity.confirmClearAll"))) return;
    setLoading(true);
    try {
      const result = await api.admin.clearAllActivityData();
      setActionMessage(
        `Cleared ${result.deleted.activityEvents} events, ${result.deleted.onboardingSessions} onboarding sessions, ${result.deleted.quizAnswerLogs} quiz answers.`
      );
      setEvents([]);
      setOnboardingSessions([]);
      setQuizAnswers([]);
      await fetchStats();
    } catch (err: any) {
      setError(err.message || "Clear failed");
    } finally {
      setLoading(false);
    }
  };

  const completionRate = stats
    ? stats.totalOnboardingSessions > 0
      ? ((stats.onboardingCompleted / stats.totalOnboardingSessions) * 100).toFixed(1)
      : "0"
    : "0";

  const abandonRate = stats
    ? stats.totalOnboardingSessions > 0
      ? ((stats.onboardingAbandoned / stats.totalOnboardingSessions) * 100).toFixed(1)
      : "0"
    : "0";

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t("admin.activity.totalEvents")}</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalActivityEvents.toLocaleString()}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t("admin.activity.onboardingSessions")}</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalOnboardingSessions.toLocaleString()}</p>
            <div className="flex gap-3 mt-2 text-xs font-semibold">
              <span className="text-emerald-600">{stats.onboardingCompleted} {t("admin.activity.completed")}</span>
              <span className="text-red-500">{stats.onboardingAbandoned} {t("admin.activity.abandoned")}</span>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t("admin.activity.quizAnswersLogged")}</p>
            <p className="text-3xl font-black text-slate-900">{stats.totalQuizAnswerLogs.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Funnel */}
      {stats && stats.totalOnboardingSessions > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">{t("admin.activity.onboardingFunnel")}</h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>{t("admin.activity.started")}</span>
                <span>100%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-blue-600 h-3 rounded-full" style={{ width: "100%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>{t("admin.activity.completed")}</span>
                <span>{completionRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${completionRate}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                <span>{t("admin.activity.abandoned")}</span>
                <span>{abandonRate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-red-400 h-3 rounded-full" style={{ width: `${abandonRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-100 pb-1">
        {(["events", "onboarding", "quiz-answers"] as TabView[]).map((v) => (
          <button
            key={v}
            onClick={() => setActiveView(v)}
            className={`px-4 py-2 text-xs font-black uppercase tracking-widest rounded-t-lg transition-colors ${
              activeView === v
                ? "text-blue-600 border-b-2 border-blue-600"
                : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {t(`admin.activity.views.${v}`)}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {activeView === "events" && (
          <select
            value={eventTypeFilter}
            onChange={(e) => setEventTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("admin.activity.allEventTypes")}</option>
            <option value="onboarding_start">onboarding_start</option>
            <option value="onboarding_complete">onboarding_complete</option>
            <option value="onboarding_abandon">onboarding_abandon</option>
            <option value="quiz_start">quiz_start</option>
            <option value="quiz_answer">quiz_answer</option>
            <option value="quiz_complete">quiz_complete</option>
            <option value="page_view">page_view</option>
            <option value="login">login</option>
            <option value="logout">logout</option>
            <option value="register">register</option>
          </select>
        )}
        {activeView === "onboarding" && (
          <select
            value={onboardingStatusFilter}
            onChange={(e) => setOnboardingStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">{t("admin.activity.allStatuses")}</option>
            <option value="started">started</option>
            <option value="completed">completed</option>
            <option value="abandoned">abandoned</option>
          </select>
        )}
      </div>

      {/* Messages */}
      {actionMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
          {actionMessage}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Tables */}
      {loading ? (
        <Spinner className="min-h-[200px]" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {activeView === "events" && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.id")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.type")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.user")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.time")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {events.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400 text-sm font-medium">{t("admin.activity.noData")}</td></tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{ev.id}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-bold">{ev.eventType}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{ev.userId ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(ev.createdAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeView === "onboarding" && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.id")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.name")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.role")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.status")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.startedAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {onboardingSessions.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400 text-sm font-medium">{t("admin.activity.noData")}</td></tr>
                ) : (
                  onboardingSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{s.id}</td>
                      <td className="px-4 py-3 text-slate-700">{s.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{s.role || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                          s.completionStatus === "completed"
                            ? "bg-emerald-50 text-emerald-700"
                            : s.completionStatus === "abandoned"
                            ? "bg-red-50 text-red-600"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {s.completionStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(s.startedAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {activeView === "quiz-answers" && (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.id")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.attemptId")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.questionId")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.answer")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.correct")}</th>
                  <th className="text-left px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("admin.activity.cols.answeredAt")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {quizAnswers.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm font-medium">{t("admin.activity.noData")}</td></tr>
                ) : (
                  quizAnswers.map((a) => (
                    <tr key={a.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600 font-mono text-xs">{a.id}</td>
                      <td className="px-4 py-3 text-slate-700">{a.attemptId ?? "—"}</td>
                      <td className="px-4 py-3 text-slate-700">{a.questionId}</td>
                      <td className="px-4 py-3 text-slate-700">{a.selectedAnswerIndex}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-bold ${
                          a.isCorrect ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
                        }`}>
                          {a.isCorrect ? t("admin.activity.yes") : t("admin.activity.no")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs">{new Date(a.answeredAt).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Admin Actions */}
      {isSuperAdmin && (
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">{t("admin.activity.dataManagement")}</h3>
          <div className="flex gap-3">
            <button
              onClick={handlePurge}
              disabled={loading}
              className="px-5 py-3 bg-amber-50 text-amber-700 hover:bg-amber-100 font-bold rounded-xl text-sm transition-colors border border-amber-200 disabled:opacity-50"
            >
              {t("admin.activity.purgeExpired")}
            </button>
            <button
              onClick={handleClearAll}
              disabled={loading}
              className="px-5 py-3 bg-red-50 text-red-600 hover:bg-red-100 font-bold rounded-xl text-sm transition-colors border border-red-200 disabled:opacity-50"
            >
              {t("admin.activity.clearAllData")}
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-3 font-medium">{t("admin.activity.irreversibleWarning")}</p>
        </div>
      )}
    </div>
  );
};

export default ActivityMonitorTab;
