import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "@/lib/api";
import { UserRow, ROLE_BADGES } from "@/components/feature/admin/types";

interface UserDetailModalProps {
  user: UserRow;
  onClose: () => void;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ user, onClose }) => {
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
};

export default UserDetailModal;
