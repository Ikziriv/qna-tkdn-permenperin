import React from "react";
import { useTranslation } from "react-i18next";
import { useAdminData } from "@/contexts/AdminDataContext";

const LeaderboardTab: React.FC = () => {
  const { t } = useTranslation();
  const { leaderboard } = useAdminData();

  return (
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
  );
};

export default LeaderboardTab;
