import React from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AdminDataProvider, useAdminData } from "@/contexts/AdminDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { UserDetailModal } from "@/components/feature/admin/UserDetailModal";

const tabs = [
  { id: "overview", path: "/admin", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" },
  { id: "users", path: "/admin/users", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
  { id: "attempts", path: "/admin/attempts", icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6 4h.01M9 16h.01" },
  { id: "leaderboard", path: "/admin/leaderboard", icon: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" },
  { id: "reports", path: "/admin/reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
  { id: "activity", path: "/admin/activity", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" },
];

const AdminLayoutShell: React.FC = () => {
  const { t } = useTranslation();
  const { authUser } = useAuth();
  const {
    loading, error, fetchAll, userDetailOpen, setUserDetailOpen, selectedUser
  } = useAdminData();
  const location = useLocation();
  const activeTabId = tabs.find((t) => location.pathname === t.path || (t.id !== "overview" && location.pathname.startsWith(t.path)))?.id || "overview";

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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{authUser?.role === "super_admin" ? t('admin.roles.superAdmin') : t('admin.roles.' + (authUser?.role || "user"))}</p>
                </div>
              </div>
            </div>
            <nav className="space-y-2">
              {tabs.map((tab) => {
                const isActive = tab.id === activeTabId;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xl shadow-blue-200"
                        : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <svg className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                    {t(`admin.tabs.${tab.id}`)}
                  </Link>
                );
              })}
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
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <Link key={tab.id} to={tab.path} className={`flex flex-col items-center gap-1 px-2 py-1 rounded-lg ${isActive ? "text-blue-600" : "text-slate-400"}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} /></svg>
                <span className="text-[10px] font-bold">{t(`admin.tabs.${tab.id}`)}</span>
              </Link>
            );
          })}
        </div>

        {/* Main content */}
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <div className="mb-8">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">{t(`admin.tabs.${activeTabId}`)}</h1>
            <p className="text-slate-500 mt-1 text-sm font-medium">{t(`admin.tabDescriptions.${activeTabId}`)}</p>
          </div>
          <Outlet />
        </main>
      </div>

      {/* User Detail Modal */}
      {userDetailOpen && selectedUser && (
        <UserDetailModal user={selectedUser} onClose={() => setUserDetailOpen(false)} />
      )}
    </div>
  );
};

/**
 * Admin layout wrapper that provides data context and renders the shell.
 *
 * Designed for use within React Router as a layout route.
 */
export const AdminLayout: React.FC = () => {
  const { authUser } = useAuth();
  const userRole = authUser?.role || "user";
  return (
    <AdminDataProvider userRole={userRole}>
      <AdminLayoutShell />
    </AdminDataProvider>
  );
};
