import React from "react";
import { useTranslation } from "react-i18next";
import { useAdminData } from "@/contexts/AdminDataContext";

const AttemptsTab: React.FC = () => {
  const { t } = useTranslation();
  const { attempts } = useAdminData();

  return (
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
  );
};

export default AttemptsTab;
